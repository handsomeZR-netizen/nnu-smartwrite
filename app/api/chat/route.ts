import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { EvaluationResult } from "@/lib/types";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  evaluationContext: z
    .object({
      directions: z.string().max(500).optional(),
      essayContext: z.string().max(2000).optional(),
      studentSentence: z.string().max(1000).optional(),
      result: z
        .object({
          score: z.string().optional(),
          analysis: z.string().optional(),
          polishedVersion: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  customAPIKey: z.string().optional(),
  customAPIEndpoint: z.string().optional(),
  customAPIModel: z.string().optional(),
});

const buildSystemPrompt = (
  ctx?: z.infer<typeof ChatRequestSchema>["evaluationContext"],
): string => {
  const intro = `你是南师智评（NNU SmartWrite）的英语写作辅导助手，针对四六级、考研英语写作与翻译。
回答风格：
- 默认中文回答，引用例句保留英文。
- 回答简洁、有条理，必要时使用编号或要点。
- 不要捏造分数或新的评测结论；只解释、扩展、举例。`;
  if (!ctx?.result) return intro;
  const lines: string[] = [intro, "\n以下是用户上一次评测的上下文（用户可能围绕它追问）："];
  if (ctx.directions) lines.push(`- 题目要求：${ctx.directions}`);
  if (ctx.essayContext) lines.push(`- 文章语境：${ctx.essayContext.slice(0, 400)}`);
  if (ctx.studentSentence) lines.push(`- 学生答案：${ctx.studentSentence}`);
  if (ctx.result.score) lines.push(`- 评级：${ctx.result.score}`);
  if (ctx.result.polishedVersion) lines.push(`- 润色版本：${ctx.result.polishedVersion}`);
  if (ctx.result.analysis) lines.push(`- 评测分析摘要：${ctx.result.analysis.slice(0, 400)}`);
  return lines.join("\n");
};

interface DeepSeekChoice {
  message?: { content?: string; reasoning_content?: string };
  finish_reason?: string;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "请求体不是合法 JSON", retryable: false },
      { status: 400 },
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_INPUT",
        message: parsed.error.issues.map((i) => i.message).join("；"),
        retryable: false,
      },
      { status: 400 },
    );
  }

  const apiKey = parsed.data.customAPIKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "CONFIG_ERROR",
        message: "服务端未配置 AI 密钥，请稍后再试",
        retryable: false,
      },
      { status: 500 },
    );
  }

  const baseEndpoint = parsed.data.customAPIEndpoint || "https://api.deepseek.com/v1";
  const endpoint = baseEndpoint.includes("/chat/completions")
    ? baseEndpoint
    : `${baseEndpoint}/chat/completions`;
  const model = parsed.data.customAPIModel || "deepseek-v4-flash";

  const systemPrompt = buildSystemPrompt(parsed.data.evaluationContext);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 1200,
        stream: false,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        {
          error: "API_ERROR",
          message: `AI 服务暂时不可用（${upstream.status}）`,
          detail: text.slice(0, 200),
          retryable: upstream.status >= 500 || upstream.status === 429,
        },
        { status: upstream.status >= 500 ? 503 : upstream.status },
      );
    }

    const data = (await upstream.json()) as { choices?: DeepSeekChoice[] };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "EMPTY_REPLY", message: "AI 没有返回内容，请重试", retryable: true },
        { status: 502 },
      );
    }
    return NextResponse.json({
      message: { role: "assistant", content: reply },
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "未知网络错误",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
