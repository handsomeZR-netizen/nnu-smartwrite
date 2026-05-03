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

// MinerU returns a ZIP (full.md + content_list.json + layout.json + origin.pdf).
// We unzip in-memory using Bun's built-in fflate-style API via global Response
// + DecompressionStream where possible. To stay framework-agnostic, fall back
// to a hand-rolled minimal ZIP central-directory parser that pulls just the
// "full.md" entry.
async function extractFullMdFromZip(zipBytes: ArrayBuffer): Promise<string | null> {
  const buf = new Uint8Array(zipBytes);
  // Find End Of Central Directory record (signature 0x06054b50)
  const eocdSig = [0x50, 0x4b, 0x05, 0x06];
  let eocdPos = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (
      buf[i] === eocdSig[0] &&
      buf[i + 1] === eocdSig[1] &&
      buf[i + 2] === eocdSig[2] &&
      buf[i + 3] === eocdSig[3]
    ) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos < 0) return null;
  const dv = new DataView(zipBytes);
  const cdEntries = dv.getUint16(eocdPos + 10, true);
  const cdOffset = dv.getUint32(eocdPos + 16, true);

  let cursor = cdOffset;
  for (let i = 0; i < cdEntries; i++) {
    if (dv.getUint32(cursor, true) !== 0x02014b50) return null;
    const compSize = dv.getUint32(cursor + 20, true);
    const fnLen = dv.getUint16(cursor + 28, true);
    const exLen = dv.getUint16(cursor + 30, true);
    const cmLen = dv.getUint16(cursor + 32, true);
    const localOffset = dv.getUint32(cursor + 42, true);
    const fileName = new TextDecoder().decode(
      buf.subarray(cursor + 46, cursor + 46 + fnLen),
    );
    cursor += 46 + fnLen + exLen + cmLen;

    if (fileName.endsWith("full.md") || fileName === "full.md") {
      // Read local file header
      const lhFnLen = dv.getUint16(localOffset + 26, true);
      const lhExLen = dv.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + lhFnLen + lhExLen;
      const compMethod = dv.getUint16(localOffset + 8, true);
      const compressed = buf.subarray(dataStart, dataStart + compSize);
      if (compMethod === 0) {
        return new TextDecoder().decode(compressed);
      }
      if (compMethod === 8) {
        // deflate — use DecompressionStream
        const stream = new Response(
          new Blob([compressed]).stream().pipeThrough(
            new DecompressionStream("deflate-raw"),
          ),
        );
        return await stream.text();
      }
      return null;
    }
  }
  return null;
}

async function pollPreciseTask(
  batchId: string,
  token: string,
  maxAttempts = 18,
  intervalMs = 3000,
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
    if (result.state !== "done") continue;
    // Prefer direct markdown_url if MinerU ever provides it
    if (result.markdown_url) {
      const md = await fetch(result.markdown_url).then((res) => res.text());
      return { status: "done", markdown: md };
    }
    // Fallback: download the ZIP and pull full.md out
    if (result.full_zip_url) {
      const zipResp = await fetch(result.full_zip_url);
      if (!zipResp.ok) continue;
      const md = await extractFullMdFromZip(await zipResp.arrayBuffer());
      if (md) return { status: "done", markdown: md };
      return { status: "failed", error: "无法从 MinerU 结果包中提取 markdown" };
    }
    return { status: "failed", error: "MinerU 返回完成但缺少结果地址" };
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
