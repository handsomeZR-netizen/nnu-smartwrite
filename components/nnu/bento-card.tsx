import * as React from "react";
import { cn } from "@/lib/utils";

type Accent = "green" | "gold" | "mist" | "cream" | "sage";

const ACCENT_RING: Record<Accent, string> = {
  green: "border-nnu-green/15",
  gold: "border-nnu-gold/30",
  mist: "border-nnu-mist",
  cream: "border-nnu-cream",
  sage: "border-nnu-sage/25",
};

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
  asChild?: never;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  accent = "mist",
  className,
  children,
  ...rest
}) => (
  <article
    className={cn(
      "group relative overflow-hidden rounded-2xl",
      "bg-white/65 backdrop-blur-2xl",
      "border",
      ACCENT_RING[accent],
      "shadow-[0_2px_12px_-6px_rgba(31,42,38,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
      "transition-[transform,box-shadow] duration-300 ease-out",
      "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(31,42,38,0.12),inset_0_1px_0_rgba(255,255,255,0.7)]",
      className,
    )}
    {...rest}
  >
    {children}
  </article>
);

export interface BentoCardHeaderProps {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  className?: string;
}

export const BentoCardHeader: React.FC<BentoCardHeaderProps> = ({
  icon,
  eyebrow,
  title,
  className,
}) => (
  <header className={cn("flex items-start gap-3", className)}>
    {icon ? (
      <div className="shrink-0 w-10 h-10 rounded-xl bg-nnu-mist/80 flex items-center justify-center text-nnu-green">
        {icon}
      </div>
    ) : null}
    <div className="min-w-0 flex-1">
      {eyebrow ? (
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-nnu-sage mb-1">
          {eyebrow}
        </div>
      ) : null}
      <h3 className="text-base md:text-lg font-semibold text-nnu-ink leading-snug">
        {title}
      </h3>
    </div>
  </header>
);

export const BentoCardBody: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn("text-sm text-nnu-ink/70 leading-relaxed", className)}>
    {children}
  </div>
);
