"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { IssueSpan, SentenceAnnotation } from "@/lib/types";
import { ChatCircleDots, WaveSine, BookBookmark, TextAa, ArrowsHorizontal } from "@phosphor-icons/react";

export interface AnnotatedEssayProps {
  sentenceAnnotations: SentenceAnnotation[];
  className?: string;
}

type IssueKind = IssueSpan["type"];

const ISSUE_STYLE: Record<IssueKind, string> = {
  grammar: "decoration-red-500 decoration-wavy underline bg-red-50",
  spelling: "decoration-red-500 decoration-wavy underline bg-red-50",
  vocab: "bg-amber-50 border-b-2 border-amber-400 border-dashed",
  style: "bg-blue-50 border-b-2 border-blue-300 border-dotted",
  logic: "bg-gray-100 italic",
};

const ISSUE_LABEL: Record<IssueKind, string> = {
  grammar: "语法",
  spelling: "拼写",
  vocab: "词汇",
  style: "句式",
  logic: "逻辑",
};

interface RenderSegment {
  key: string;
  text: string;
  issue?: IssueSpan;
}

function buildSegments(text: string, issues: IssueSpan[]): RenderSegment[] {
  if (!text) return [];
  if (!issues || issues.length === 0) {
    return [{ key: "plain-0", text }];
  }
  const sorted = [...issues]
    .filter((i) => Array.isArray(i.span) && i.span.length === 2)
    .map((i) => {
      const start = Math.max(0, Math.min(i.span[0], text.length));
      const end = Math.max(start, Math.min(i.span[1], text.length));
      return { ...i, span: [start, end] as [number, number] };
    })
    .sort((a, b) => a.span[0] - b.span[0]);

  const segments: RenderSegment[] = [];
  let cursor = 0;
  let segIdx = 0;
  for (const issue of sorted) {
    const [start, end] = issue.span;
    if (end <= cursor) {
      continue;
    }
    const effectiveStart = Math.max(start, cursor);
    if (effectiveStart > cursor) {
      segments.push({
        key: `plain-${segIdx++}`,
        text: text.slice(cursor, effectiveStart),
      });
    }
    if (end > effectiveStart) {
      segments.push({
        key: `issue-${segIdx++}`,
        text: text.slice(effectiveStart, end),
        issue,
      });
      cursor = end;
    }
  }
  if (cursor < text.length) {
    segments.push({ key: `plain-${segIdx++}`, text: text.slice(cursor) });
  }
  return segments;
}

interface AnnotatedTokenProps {
  segment: RenderSegment;
  activeKey: string | null;
  setActiveKey: React.Dispatch<React.SetStateAction<string | null>>;
  ownerKey: string;
}

const AnnotatedToken: React.FC<AnnotatedTokenProps> = ({
  segment,
  activeKey,
  setActiveKey,
  ownerKey,
}) => {
  if (!segment.issue) {
    return <span>{segment.text}</span>;
  }
  const issue = segment.issue;
  const isActive = activeKey === ownerKey;
  const handleToggle = () => {
    setActiveKey(isActive ? null : ownerKey);
  };
  return (
    <span className="relative inline-block group">
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setActiveKey(ownerKey)}
        onMouseLeave={() =>
          setActiveKey((prev) => (prev === ownerKey ? null : prev))
        }
        className={cn(
          "px-0.5 rounded-sm transition-colors cursor-help align-baseline",
          ISSUE_STYLE[issue.type],
        )}
        aria-label={`${ISSUE_LABEL[issue.type]}问题：${issue.message}`}
        aria-expanded={isActive}
      >
        {segment.text}
      </button>
      {isActive && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1 w-64 max-w-[80vw]",
            "rounded-lg px-3 py-2 text-xs leading-relaxed",
            "bg-white/85 backdrop-blur-xl border border-white/40 shadow-md text-gray-800",
            "pointer-events-none",
          )}
        >
          <span className="block font-semibold text-nnu-green mb-1">
            {ISSUE_LABEL[issue.type]}
          </span>
          <span className="block text-gray-700">{issue.message}</span>
          {issue.suggestion ? (
            <span className="mt-1 block text-gray-600">
              <span className="text-gray-400">建议：</span>
              {issue.suggestion}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
};

export const AnnotatedEssay: React.FC<AnnotatedEssayProps> = ({
  sentenceAnnotations,
  className,
}) => {
  const [activeKey, setActiveKey] = React.useState<string | null>(null);

  if (!sentenceAnnotations || sentenceAnnotations.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("space-y-3", className)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveKey(null);
      }}
    >
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 px-3 py-2 rounded-lg bg-white/70 backdrop-blur border border-white/40">
        <span className="flex items-center gap-1">
          <WaveSine className="w-3.5 h-3.5 text-red-500" />
          <span className="text-red-600 font-medium">红色波浪线</span>
          <span className="text-gray-500">语法/拼写</span>
        </span>
        <span className="flex items-center gap-1">
          <BookBookmark className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-600 font-medium">琥珀虚线</span>
          <span className="text-gray-500">词汇</span>
        </span>
        <span className="flex items-center gap-1">
          <TextAa className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-blue-600 font-medium">蓝色点线</span>
          <span className="text-gray-500">句式</span>
        </span>
        <span className="flex items-center gap-1">
          <ArrowsHorizontal className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-700 font-medium">灰底斜体</span>
          <span className="text-gray-500">逻辑</span>
        </span>
      </div>

      <div className="space-y-3">
        {sentenceAnnotations.map((sentence, idx) => {
          const segments = buildSegments(sentence.text, sentence.issues);
          const sentenceKey = `s-${sentence.sentenceIndex ?? idx}`;
          return (
            <div
              key={sentenceKey}
              className="rounded-lg border border-gray-100 bg-white/60 backdrop-blur p-3"
            >
              <p className="text-sm leading-loose text-gray-800">
                <span className="text-xs text-gray-400 mr-2 select-none">
                  {String((sentence.sentenceIndex ?? idx) + 1).padStart(2, "0")}.
                </span>
                {segments.length === 0 ? (
                  <span className="text-gray-400">（空句）</span>
                ) : (
                  segments.map((segment, segIdx) => (
                    <AnnotatedToken
                      key={segment.key}
                      segment={segment}
                      activeKey={activeKey}
                      setActiveKey={setActiveKey}
                      ownerKey={`${sentenceKey}-seg-${segIdx}`}
                    />
                  ))
                )}
              </p>
              {sentence.comment ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs italic text-gray-500">
                  <ChatCircleDots className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <span>{sentence.comment}</span>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnotatedEssay;
