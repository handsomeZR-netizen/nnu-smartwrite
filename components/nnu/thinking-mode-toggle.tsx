"use client";

import * as React from "react";
import { Brain, Lightning, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { getSettings, saveSettings, type ThinkingMode, type ReasoningEffort } from "@/lib/settings";

export interface ThinkingModeToggleProps {
  className?: string;
  onChange?: (next: { thinking: ThinkingMode; effort: ReasoningEffort }) => void;
}

export const ThinkingModeToggle: React.FC<ThinkingModeToggleProps> = ({
  className,
  onChange,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [thinking, setThinking] = React.useState<ThinkingMode>("enabled");
  const [effort, setEffort] = React.useState<ReasoningEffort>("high");

  React.useEffect(() => {
    const sync = () => {
      const s = getSettings();
      setThinking(s.reasoning.thinking);
      setEffort(s.reasoning.effort);
    };
    sync();
    setMounted(true);
    window.addEventListener("nnu-settings-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nnu-settings-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = (next: { thinking: ThinkingMode; effort: ReasoningEffort }) => {
    const current = getSettings();
    saveSettings({
      ...current,
      reasoning: next,
      lastUpdated: Date.now(),
    });
    onChange?.(next);
  };

  const setThinkingMode = (mode: ThinkingMode) => {
    setThinking(mode);
    persist({ thinking: mode, effort });
  };

  const setEffortLevel = (e: ReasoningEffort) => {
    setEffort(e);
    persist({ thinking, effort: e });
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-11 rounded-2xl bg-stone-100/60 backdrop-blur-xl border border-stone-200/40 animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }

  const thinkingOn = thinking === "enabled";

  return (
    <div
      className={cn(
        "relative isolate inline-flex flex-wrap items-center gap-2 px-1.5 py-1.5 rounded-2xl",
        "bg-stone-100/55 backdrop-blur-2xl",
        "border border-stone-200/50",
        "shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]",
        className,
      )}
      role="group"
      aria-label="思考模式设置"
    >
      <Segmented
        ariaLabel="思考模式开关"
        options={[
          {
            value: "disabled",
            label: "极速",
            icon: (active) => (
              <Lightning
                weight={active ? "fill" : "regular"}
                className={cn("w-3.5 h-3.5", active ? "text-amber-500" : "text-stone-400")}
              />
            ),
          },
          {
            value: "enabled",
            label: "深度思考",
            icon: (active) => (
              <Brain
                weight={active ? "fill" : "regular"}
                className={cn("w-3.5 h-3.5", active ? "text-emerald-700" : "text-stone-400")}
              />
            ),
          },
        ]}
        value={thinking}
        onValueChange={(v) => setThinkingMode(v as ThinkingMode)}
      />

      <Segmented
        ariaLabel="思考强度"
        options={[
          {
            value: "high",
            label: "标准",
            icon: (active) => (
              <Sparkle
                weight="regular"
                className={cn("w-3 h-3", active ? "text-slate-600" : "text-stone-400")}
              />
            ),
          },
          {
            value: "max",
            label: "极致",
            icon: (active) => (
              <Sparkle
                weight="fill"
                className={cn("w-3 h-3", active ? "text-rose-500" : "text-stone-400")}
              />
            ),
          },
        ]}
        value={effort}
        onValueChange={(v) => setEffortLevel(v as ReasoningEffort)}
        disabled={!thinkingOn}
      />
    </div>
  );
};

interface SegmentedOption {
  value: string;
  label: string;
  icon?: (active: boolean) => React.ReactNode;
}

const Segmented: React.FC<{
  ariaLabel: string;
  options: SegmentedOption[];
  value: string;
  onValueChange: (v: string) => void;
  disabled?: boolean;
}> = ({ ariaLabel, options, value, onValueChange, disabled }) => {
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={cn(
        "relative inline-flex items-center p-0.5 rounded-xl",
        "bg-stone-200/40",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Sliding white pill — Apple-style segmented control */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0.5 rounded-[10px] bg-white",
          "shadow-[0_1px_3px_rgba(15,23,42,0.08),0_1px_1px_rgba(15,23,42,0.04)]",
          "transition-[transform,width] duration-250 ease-out",
        )}
        style={{
          width: `calc(${100 / options.length}% - 2px)`,
          left: 2,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
        }}
      />
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-[10px]",
              "select-none transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40",
              isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-700",
            )}
          >
            {opt.icon ? opt.icon(isActive) : null}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
