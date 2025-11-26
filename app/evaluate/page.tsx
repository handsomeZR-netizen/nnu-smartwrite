"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { EvaluationForm } from "@/components/nnu/evaluation-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EvaluationInput, EvaluationResult, APIError } from "@/lib/types";
import { saveToHistory } from "@/lib/storage";
import { EvaluationResultSchema } from "@/lib/types";
import { ResultCardSkeleton } from "@/components/nnu/skeletons";
import { Activity, GraduationCap, AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

const ResultCard = dynamic(
  () => import("@/components/nnu/result-card").then(mod => mod.ResultCard),
  { loading: () => <ResultCardSkeleton />, ssr: false }
);

export default function EvaluatePage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<EvaluationResult | null>(null);
  const [error, setError] = React.useState<APIError | null>(null);
  const [currentInput, setCurrentInput] = React.useState<EvaluationInput | null>(null);
  const showResult = !!result;

  const callEvaluationAPI = async (input: EvaluationInput): Promise<EvaluationResult> => {
    // 获取自定义API配置
    const settings = typeof window !== 'undefined' ? await import('@/lib/settings').then(m => m.getSettings()) : null;
    
    const requestBody = {
      ...input,
      ...(settings?.api.useCustomAPI && settings.api.customAPIKey ? {
        customAPIKey: settings.api.customAPIKey,
        customAPIEndpoint: settings.api.customAPIEndpoint,
        customAPIModel: settings.api.customAPIModel,
      } : {}),
    };
    
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorData: APIError = await response.json();
      throw errorData;
    }
    const data = await response.json();
    const validated = EvaluationResultSchema.safeParse(data);
    if (!validated.success) {
      throw { error: 'INVALID_RESPONSE', message: 'API响应格式错误', retryable: true } as APIError;
    }
    return validated.data;
  };

  const handleSubmit = async (input: EvaluationInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentInput(input);

    try {
      const evaluationResult = await callEvaluationAPI(input);
      setResult(evaluationResult);
      const saved = saveToHistory(input, evaluationResult);
      if (!saved) {
        console.warn('Failed to save evaluation to history');
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'error' in err) {
        setError(err as APIError);
      } else {
        setError({
          error: 'UNKNOWN_ERROR',
          message: '评估失败，请稍后重试',
          retryable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (currentInput) {
      handleSubmit(currentInput);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentInput(null);
  };

  return (
    <div className="min-h-screen bg-nnu-paper pt-24 pb-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左侧：输入区 */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white rounded-xl shadow-xl border-t-4 border-nnu-green">
              <CardContent className="p-6">
                <EvaluationForm onSubmit={handleSubmit} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：结果展示区 */}
          <div className="lg:col-span-5 space-y-6" id="results-section">
            
            {/* 等待状态 */}
            {!showResult && !isLoading && !error && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-medium">等待提交评测...</p>
                <p className="text-sm mt-2">点击左侧"一键填入测试用例"快速体验</p>
              </div>
            )}

            {/* 加载状态 */}
            {isLoading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-nnu-green/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-nnu-green rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-nnu-green" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-nnu-green animate-pulse">DeepSeek 正在思考...</h3>
                <p className="text-gray-500 text-sm mt-2">分析语义连贯性与上下文逻辑</p>
              </div>
            )}

            {/* 错误状态 */}
            {error && (
              <Card className="bg-white shadow-md border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-red-600">
                      {error.error === 'INVALID_INPUT' ? '输入错误' : '评估失败'}
                    </h3>
                    <p className="text-gray-700">{error.message}</p>
                    <div className="flex gap-4 justify-center">
                      {error.retryable && (
                        <Button onClick={handleRetry} variant="nnu" disabled={isLoading}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {isLoading ? '重试中...' : '重试'}
                        </Button>
                      )}
                      <Button onClick={handleReset} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 结果展示 */}
            {result && (
              <ResultCard result={result} showRadarChart={!!result.radarScores} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
