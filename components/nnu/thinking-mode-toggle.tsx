"use client";

import * as React from "react";
import { Brain, Lightning, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { getSettings, saveSettings, type ThinkingMode, type ReasoningEffort } from "@/lib/settings";

export interface ThinkingModeToggleProps {
  className?: string;
  onChange?: (next: { thinking: ThinkingMode; effort: ReasoningEffort }) => void;
}

/**
 * iOS 26 Liquid Glass styled toggle for DeepSeek thinking mode + reasoning effort.
 *
 * Visual: frosted-glass capsule with a sliding "pill" that morphs across positions.
 * Two control rows:
 *   1. Thinking mode capsule (Off ↔ On)
 *   2. Effort capsule (high ↔ max), greyed out when thinking off
 */
export const ThinkingModeToggle: React.FC<ThinkingModeToggleProps> = ({
  className,
  onChange,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [thinking, setThinking] = React.useState<ThinkingMode>("enabled");
  const [effort, setEffort] = React.useState<ReasoningEffort>("high");

  React.useEffect(() => {
    const s = getSettings();
    setThinking(s.reasoning.thinking);
    setEffort(s.reasoning.effort);
    setMounted(true);
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
          "h-12 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }

  const thinkingOn = thinking === "enabled";
  const isMax = effort === "max";

  return (
    <div
      className={cn(
        // Liquid-glass container
        "relative isolate inline-flex flex-wrap items-center gap-3 px-2 py-2 rounded-2xl",
        "bg-white/55 backdrop-blur-2xl",
        "border border-white/40 shadow-[0_8px_32px_-8px_rgba(31,106,82,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:via-transparent before:to-transparent before:pointer-events-none",
        className,
      )}
      role="group"
      aria-label="思考模式设置"
    >
      {/* Thinking on/off */}
      <Segmented
        ariaLabel="思考模式开关"
        options={[
          {
            value: "disabled",
            label: "极速",
            icon: <Lightning weight={thinkingOn ? "regular" : "fill"} className="w-4 h-4" />,
          },
          {
            value: "enabled",
            label: "深度思考",
            icon: <Brain weight={thinkingOn ? "fill" : "regular"} className="w-4 h-4" />,
          },
        ]}
        value={thinking}
        onValueChange={(v) => setThinkingMode(v as ThinkingMode)}
        accent={thinkingOn ? "green" : "neutral"}
      />

      {/* Effort */}
      <Segmented
        ariaLabel="思考强度"
        options={[
          { value: "high", label: "标准 high", icon: <Sparkle weight="regular" className="w-3.5 h-3.5" /> },
          { value: "max", label: "极致 max", icon: <Sparkle weight="fill" className="w-3.5 h-3.5" /> },
        ]}
        value={effort}
        onValueChange={(v) => setEffortLevel(v as ReasoningEffort)}
        accent={thinkingOn ? (isMax ? "coral" : "green") : "muted"}
        disabled={!thinkingOn}
      />
    </div>
  );
};

interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const Segmented: React.FC<{
  ariaLabel: string;
  options: SegmentedOption[];
  value: string;
  onValueChange: (v: string) => void;
  accent: "green" | "coral" | "neutral" | "muted";
  disabled?: boolean;
}> = ({ ariaLabel, options, value, onValueChange, accent, disabled }) => {
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const accentClass =
    accent === "green"
      ? "bg-gradient-to-br from-nnu-green to-nnu-jade text-white shadow-[0_4px_14px_-4px_rgba(31,106,82,0.55)]"
      : accent === "coral"
      ? "bg-gradient-to-br from-nnu-coral to-amber-400 text-white shadow-[0_4px_14px_-4px_rgba(255,127,80,0.55)]"
      : accent === "muted"
      ? "bg-gray-300/70 text-gray-500"
      : "bg-white text-nnu-green shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12)]";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={cn(
        "relative inline-flex items-center p-1 rounded-xl",
        "bg-black/5 backdrop-blur-md",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {/* Sliding pill */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 rounded-lg transition-[transform,width,background] duration-300 ease-out",
          accentClass,
        )}
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: 4,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
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
              "relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 select-none",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-nnu-gold/70",
              isActive ? "text-current" : "text-gray-600 hover:text-nnu-green",
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
