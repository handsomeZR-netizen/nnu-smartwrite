import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton components for loading states
 * 
 * Provides placeholder UI while content is loading to reduce perceived waiting time
 */

/**
 * Skeleton for evaluation form
 */
export const EvaluationFormSkeleton = () => (
  <div className="space-y-4" data-testid="evaluation-form-skeleton">
    <div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-32 w-full" />
    </div>
    <div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-20 w-full" />
    </div>
    <Skeleton className="h-12 w-32" />
  </div>
);

/**
 * Skeleton for evaluation result card
 */
export const ResultCardSkeleton = () => (
  <Card className="bg-white shadow-lg" data-testid="result-card-skeleton">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Skeleton className="h-5 w-20 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div>
        <Skeleton className="h-5 w-20 mb-2" />
        <Skeleton className="h-16 w-full" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton for radar chart
 */
export const RadarChartSkeleton = () => (
  <div className="w-full flex justify-center" data-testid="radar-chart-skeleton">
    <Skeleton className="h-64 w-64 rounded-full" />
  </div>
);

/**
 * Skeleton for history list item
 */
export const HistoryListItemSkeleton = () => (
  <Card className="bg-white p-4">
    <div className="flex items-start gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </Card>
);

/**
 * Skeleton for practice question card
 */
export const PracticeQuestionSkeleton = () => (
  <Card className="bg-white shadow-md">
    <CardHeader>
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-8 w-24" />
    </CardContent>
  </Card>
);

/**
 * Skeleton for page loading
 */
export const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);
