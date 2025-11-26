import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { container: "h-8 w-8", text: "text-base" },
  md: { container: "h-10 w-10", text: "text-xl" },
  lg: { container: "h-12 w-12", text: "text-2xl" },
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", showText = true, ...props }, ref) => {
    const sizes = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        {/* NNU Logo */}
        <div className={cn("relative rounded-full overflow-hidden", sizes.container)}>
          <Image
            src="/logo.png"
            alt="南京师范大学校徽"
            fill
            sizes="(max-width: 768px) 40px, 48px"
            className="object-contain"
            priority
          />
        </div>
        {showText && (
          <span className={cn("font-bold text-nnu-green", sizes.text)}>
            南师智评
          </span>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";
