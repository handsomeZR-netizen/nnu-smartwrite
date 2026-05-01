"use client";

import * as React from "react";
import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Accent = "green" | "amber" | "coral" | "blue" | "gray";

const ACCENT_BORDER: Record<Accent, string> = {
  green: "border-l-nnu-green",
  amber: "border-l-amber-500",
  coral: "border-l-nnu-coral",
  blue: "border-l-blue-500",
  gray: "border-l-gray-400",
};

const ACCENT_TEXT: Record<Accent, string> = {
  green: "text-nnu-green",
  amber: "text-amber-600",
  coral: "text-nnu-coral",
  blue: "text-blue-600",
  gray: "text-gray-600",
};

export interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  defaultOpen?: boolean;
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  subtitle,
  defaultOpen = false,
  accent = "green",
  className,
  children,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border-l-4",
        "bg-white/55 backdrop-blur-2xl border border-white/40",
        "shadow-[0_8px_32px_-8px_rgba(31,106,82,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "print:open print:bg-white print:backdrop-blur-none",
        ACCENT_BORDER[accent],
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "text-left font-semibold text-sm cursor-pointer select-none",
          "hover:bg-white/40 transition-colors",
          ACCENT_TEXT[accent],
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <span className="truncate">{title}</span>
          {subtitle ? (
            <span className="text-xs font-normal text-gray-500 truncate">
              {subtitle}
            </span>
          ) : null}
        </span>
        <CaretRight
          weight="bold"
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200",
            open ? "rotate-90" : "rotate-0",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-out print:!grid-rows-[1fr]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-white/30 bg-white/30">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleCard;
