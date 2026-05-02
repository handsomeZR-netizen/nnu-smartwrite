"use client";

import * as React from "react";
import { BookmarkSimple, CaretRight, X, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import promptLibraryData from "@/data/prompt-library.json";

export interface PromptTemplate {
  id: string;
  title: string;
  summary: string;
  evaluationFocus: string[];
  scoreWeights: Record<string, number>;
  directionsTemplate: string;
  rubric: string;
  polishHints: string[];
  tags?: string[];
}

interface PromptCategory {
  id: string;
  label: string;
  description: string;
  templates: PromptTemplate[];
}

interface PromptLibraryFile {
  version: string;
  categories: PromptCategory[];
}

const library = promptLibraryData as unknown as PromptLibraryFile;

export interface PromptLibraryPanelProps {
  onApply: (template: PromptTemplate) => void;
  className?: string;
}

export const PromptLibraryPanel: React.FC<PromptLibraryPanelProps> = ({
  onApply,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [activeCategoryId, setActiveCategoryId] = React.useState(
    library.categories[0]?.id ?? "",
  );
  const [appliedId, setAppliedId] = React.useState<string | null>(null);

  const activeCategory =
    library.categories.find((c) => c.id === activeCategoryId) ??
    library.categories[0];

  const handleApply = (t: PromptTemplate) => {
    onApply(t);
    setAppliedId(t.id);
    setOpen(false);
    setTimeout(() => setAppliedId(null), 2000);
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Floating tab on the left edge */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开提示词库"
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2 z-30",
          "liquid-glass-tinted rounded-r-2xl rounded-l-none",
          "px-3 py-4 flex flex-col items-center gap-2",
          "text-nnu-green hover:text-nnu-coral transition-colors",
          "shadow-[4px_0_20px_-8px_rgba(31,106,82,0.25)]",
          "print:hidden",
          open && "opacity-0 pointer-events-none",
          className,
        )}
      >
        <BookmarkSimple className="w-5 h-5" weight="fill" />
        <span className="[writing-mode:vertical-rl] text-xs font-semibold tracking-wider">
          提示词库
        </span>
        <CaretRight className="w-4 h-4" weight="bold" />
      </button>

      {/* Backdrop — sibling of drawer so it sits above the page nav (z-50) */}
      <button
        type="button"
        aria-label="关闭"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[55] bg-black/35 backdrop-blur-[2px] transition-opacity print:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[60] w-full sm:w-[440px] max-w-full",
          "transition-transform duration-300 ease-out print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="提示词库"
        {...(open ? {} : { inert: true })}
      >
        <div className="h-full flex flex-col rounded-r-2xl shadow-2xl bg-white/95 backdrop-blur-2xl border-r border-nnu-mist/60">
          <div className="flex items-center justify-between px-5 py-4 border-b border-nnu-mist/70">
            <div className="flex items-center gap-2">
              <BookmarkSimple className="w-5 h-5 text-nnu-green" weight="fill" />
              <h2 className="font-bold text-nnu-green">提示词库</h2>
              <span className="text-xs text-gray-500">
                {library.categories.reduce((n, c) => n + c.templates.length, 0)} 条
              </span>
            </div>
            <button
              type="button"
              aria-label="关闭"
              onClick={() => setOpen(false)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-nnu-mist/60 hover:bg-nnu-green hover:text-white text-nnu-ink/70 transition-colors"
            >
              <X className="w-4 h-4" weight="bold" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-white/30">
            {library.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategoryId(c.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCategoryId === c.id
                    ? "bg-nnu-green text-white shadow-sm"
                    : "bg-white/60 text-nnu-green hover:bg-nnu-green/10",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-xs text-gray-500 mb-2">{activeCategory?.description}</p>
            {activeCategory?.templates.map((t) => {
              const justApplied = appliedId === t.id;
              return (
                <article
                  key={t.id}
                  className="bg-white/80 border border-white/40 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-sm text-nnu-green">
                      {t.title}
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant={justApplied ? "nnuGreen" : "outline"}
                      onClick={() => handleApply(t)}
                      className="gap-1 shrink-0 text-xs"
                    >
                      <Sparkle className="w-3.5 h-3.5" weight={justApplied ? "fill" : "regular"} />
                      {justApplied ? "已填入" : "应用"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{t.summary}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.evaluationFocus.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-nnu-paper text-nnu-green border border-nnu-green/15"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer text-nnu-green hover:underline">
                      查看评分细则与润色建议
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="font-semibold text-gray-700">评分细则：</span>
                        <p className="mt-1 leading-relaxed">{t.rubric}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">润色方向：</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {t.polishHints.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
