import * as React from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  className,
  ...rest
}) => (
  <div
    role="separator"
    aria-orientation={orientation}
    className={cn(
      "shrink-0 bg-nnu-mist/70",
      orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
      className,
    )}
    {...rest}
  />
);

export default Separator;
