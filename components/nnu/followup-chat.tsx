"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatCircle, PaperPlaneRight, Sparkle, Warning } from "@phosphor-icons/react";
import type { EvaluationInput, EvaluationResult } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FollowUpChatProps {
  input: EvaluationInput;
  result: EvaluationResult;
}

const SUGGESTED_QUESTIONS = [
  "为什么这里的得分不是 S？",
  "把这个句子换一种更地道的表达",
  "这次评测里我最该改进的点是什么？",
  "请基于这个语境再给一个范例句子",
];

const buildContext = (input: EvaluationInput, result: EvaluationResult) => ({
  directions: input.directions,
  essayContext: input.essayContext,
  studentSentence: input.studentSentence,
  result: {
    score: result.score,
    analysis: result.analysis,
    polishedVersion: result.polishedVersion,
  },
});

export const FollowUpChat: React.FC<FollowUpChatProps> = ({ input, result }) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const listEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setDraft("");
    setIsSending(true);
    try {
      const settings =
        typeof window !== "undefined"
          ? await import("@/lib/settings").then((m) => m.getSettings()).catch(() => null)
          : null;
      const customApi =
        settings?.api.useCustomAPI && settings.api.customAPIKey
          ? {
              customAPIKey: settings.api.customAPIKey,
              customAPIEndpoint: settings.api.customAPIEndpoint,
              customAPIModel: settings.api.customAPIModel,
            }
          : {};
      const reasoning = settings?.reasoning ? { reasoning: settings.reasoning } : {};
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          evaluationContext: buildContext(input, result),
          ...customApi,
          ...reasoning,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "AI 暂时无法回复");
      }
      const reply = data?.message?.content as string | undefined;
      if (!reply) throw new Error("AI 没有返回内容");
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后再试");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <Card className="liquid-glass-tinted border-0 print:hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <ChatCircle className="w-5 h-5 text-nnu-green" />
          <h3 className="font-bold text-nnu-green">继续追问 AI</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          基于这次评测继续提问，AI 会结合你的题目、答案和分析回答
        </p>

        {messages.length === 0 ? (
          <div className="grid sm:grid-cols-2 gap-2 mb-4">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={isSending}
                className="text-left text-sm bg-nnu-paper border border-nnu-green/20 rounded-lg px-3 py-2 hover:bg-nnu-green/5 transition-colors disabled:opacity-60"
              >
                <Sparkle className="inline w-3.5 h-3.5 mr-1.5 text-nnu-coral" />
                {q}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 mb-4">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-nnu-green text-white rounded-br-sm"
                      : "bg-nnu-paper text-gray-800 border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-nnu-paper text-gray-500 text-sm rounded-2xl px-4 py-2.5 border border-gray-100">
                  <span className="inline-block animate-pulse">AI 正在思考…</span>
                </div>
              </div>
            )}
            <div ref={listEndRef} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 mb-3">
            <Warning className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 items-end">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="例如：为什么这里扣分？请举一个更高级的写法。"
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            disabled={isSending}
          />
          <Button
            type="submit"
            variant="nnuGreen"
            size="lg"
            disabled={isSending || !draft.trim()}
            aria-label="发送"
          >
            <PaperPlaneRight className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Enter 发送，Shift+Enter 换行</p>
      </CardContent>
    </Card>
  );
};
