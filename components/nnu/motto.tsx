import * as React from "react";
import { cn } from "@/lib/utils";

export interface MottoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact";
  showEnglish?: boolean;
}

export const Motto = React.forwardRef<HTMLDivElement, MottoProps>(
  ({ className, variant = "default", showEnglish = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-center",
          variant === "default" ? "py-8" : "py-4",
          className
        )}
        {...props}
      >
        <p
          className={cn(
            "font-serif text-nnu-gold tracking-wider",
            variant === "default" ? "text-3xl" : "text-xl"
          )}
        >
          正德厚生，笃学敏行
        </p>
        {showEnglish && (
          <p
            className={cn(
              "text-gray-600 mt-2",
              variant === "default" ? "text-sm" : "text-xs"
            )}
          >
            Nanjing Normal University
          </p>
        )}
      </div>
    );
  }
);

Motto.displayName = "Motto";
