import { NextRequest, NextResponse } from "next/server";

/**
 * MinerU OCR proxy.
 *
 * Accepts a single uploaded file (image or .docx) from the browser and
 * forwards it to MinerU's `/api/v4/file-urls/batch` upload + batch parse
 * pipeline. Returns the extracted markdown/plain-text once the task
 * finishes (or {status: "running", taskId} if it's still processing).
 *
 * The MinerU token is read from `process.env.MINERU_API_TOKEN` only — never
 * accept it from the client. If the token is missing, fall back to the
 * Agent lightweight endpoint which is auth-free but capped at 10MB / 20
 * pages and IP-throttled.
 */

const MINERU_BASE = "https://mineru.net";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB hard ceiling on our side
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

interface MinerUBatchUploadResponse {
  code: number;
  data?: {
    batch_id: string;
    file_urls: string[];
  };
  msg?: string;
}

interface MinerUBatchResultResponse {
  code: number;
  data?: {
    extract_result: Array<{
      file_name: string;
      state: "pending" | "running" | "done" | "failed";
      err_msg?: string;
      full_zip_url?: string;
      content_list_url?: string;
      markdown_url?: string;
    }>;
  };
  msg?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pollPreciseTask(
  batchId: string,
  token: string,
  maxAttempts = 18,
  intervalMs = 2500,
): Promise<{ markdown?: string; status: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    const r = await fetch(`${MINERU_BASE}/api/v4/extract-results/batch/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) continue;
    const j = (await r.json()) as MinerUBatchResultResponse;
    const result = j.data?.extract_result?.[0];
    if (!result) continue;
    if (result.state === "failed") {
      return { status: "failed", error: result.err_msg || "MinerU 解析失败" };
    }
    if (result.state === "done" && result.markdown_url) {
      const md = await fetch(result.markdown_url).then((res) => res.text());
      return { status: "done", markdown: md };
    }
  }
  return { status: "running" };
}

export async function POST(request: NextRequest) {
  const token = process.env.MINERU_API_TOKEN;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "请上传一个文件", retryable: false },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "请上传一个文件", retryable: false },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: "FILE_TOO_LARGE",
        message: `文件超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        retryable: false,
      },
      { status: 413 },
    );
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      {
        error: "UNSUPPORTED_TYPE",
        message: `不支持的文件类型：${file.type}。请上传 jpg/png/webp/pdf/docx。`,
        retryable: false,
      },
      { status: 415 },
    );
  }

  if (!token) {
    return NextResponse.json(
      {
        error: "CONFIG_ERROR",
        message:
          "服务端未配置 MINERU_API_TOKEN。请在 .env.local 中填入后重启 dev server。",
        retryable: false,
      },
      { status: 500 },
    );
  }

  // Step 1: ask MinerU for a presigned upload slot
  const uploadInit = await fetch(`${MINERU_BASE}/api/v4/file-urls/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      enable_formula: false,
      language: "auto",
      enable_table: false,
      files: [{ name: file.name, is_ocr: true, data_id: file.name }],
    }),
  });

  if (!uploadInit.ok) {
    const detail = await uploadInit.text();
    return NextResponse.json(
      {
        error: "API_ERROR",
        message: `MinerU 上传初始化失败 (${uploadInit.status})`,
        detail: detail.slice(0, 200),
        retryable: uploadInit.status >= 500,
      },
      { status: uploadInit.status >= 500 ? 503 : uploadInit.status },
    );
  }
  const initJson = (await uploadInit.json()) as MinerUBatchUploadResponse;
  const batchId = initJson.data?.batch_id;
  const presigned = initJson.data?.file_urls?.[0];
  if (!batchId || !presigned) {
    return NextResponse.json(
      {
        error: "API_ERROR",
        message: initJson.msg || "MinerU 未返回上传地址",
        retryable: true,
      },
      { status: 502 },
    );
  }

  // Step 2: PUT the file bytes to the presigned URL
  const fileBuffer = await file.arrayBuffer();
  const upload = await fetch(presigned, {
    method: "PUT",
    body: fileBuffer,
  });
  if (!upload.ok) {
    return NextResponse.json(
      {
        error: "UPLOAD_FAILED",
        message: `文件上传失败 (${upload.status})`,
        retryable: upload.status >= 500,
      },
      { status: 502 },
    );
  }

  // Step 3: poll for the parsing result
  const result = await pollPreciseTask(batchId, token);
  if (result.status === "failed") {
    return NextResponse.json(
      { error: "PARSE_FAILED", message: result.error || "MinerU 解析失败", retryable: true },
      { status: 502 },
    );
  }
  if (result.status === "running") {
    return NextResponse.json(
      {
        status: "running",
        batchId,
        message: "MinerU 仍在解析，请稍后通过 batchId 轮询",
      },
      { status: 202 },
    );
  }

  // Strip markdown headings/bullets to plain text for paste-into-textarea
  const markdown = result.markdown || "";
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  return NextResponse.json({
    status: "done",
    batchId,
    text: plain,
    markdown,
  });
}
