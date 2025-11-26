"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showArrow?: boolean;
}

export const MagneticButton = React.forwardRef<
  HTMLButtonElement,
  MagneticButtonProps
>(({ className, children, showArrow = true, ...props }, ref) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    button.style.setProperty("--x", `${x}%`);
    button.style.setProperty("--y", `${y}%`);
  };

  return (
    <button
      ref={(node) => {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn(
        "magnetic-btn",
        "inline-flex items-center justify-center gap-2",
        "bg-nnu-coral text-white font-semibold",
        "px-8 py-4 rounded-full",
        "text-lg",
        "focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-offset-2",
        "active:scale-95",
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowRight className="w-5 h-5 arrow-icon" aria-hidden="true" />
      )}
    </button>
  );
});

MagneticButton.displayName = "MagneticButton";
