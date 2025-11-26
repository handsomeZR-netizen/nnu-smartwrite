import { cn } from "@/lib/utils";

/**
 * Skeleton component for loading states
 * 
 * Provides a placeholder UI while content is loading
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}
