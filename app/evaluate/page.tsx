"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { EvaluationForm } from "@/components/nnu/evaluation-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EvaluationInput, EvaluationResult, APIError } from "@/lib/types";
import { saveToHistory } from "@/lib/storage";
import { ResultCardSkeleton } from "@/components/nnu/skeletons";
import { Pulse, GraduationCap, Warning, ArrowCounterClockwise, ArrowLeft, Trash, Printer } from "@phosphor-icons/react";
import { FollowUpChat } from "@/components/nnu/followup-chat";
import { ThinkingModeToggle } from "@/components/nnu/thinking-mode-toggle";
import { PromptLibraryPanel, type PromptTemplate } from "@/components/nnu/prompt-library-panel";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ChatCircleDots } from "@phosphor-icons/react";
import promptLibraryData from "@/data/prompt-library.json";

const ResultCard = dynamic(
  () => import("@/components/nnu/result-card").then(mod => mod.ResultCard),
  { loading: () => <ResultCardSkeleton />, ssr: false }
);

const CURRENT_EVALUATION_KEY = 'nnu-current-evaluation';

function EvaluatePageInner() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<EvaluationResult | null>(null);
  const [error, setError] = React.useState<APIError | null>(null);
  const [currentInput, setCurrentInput] = React.useState<EvaluationInput | null>(null);
  const [seedFromTemplate, setSeedFromTemplate] = React.useState<Partial<EvaluationInput> | null>(null);
  const [appliedTemplate, setAppliedTemplate] = React.useState<PromptTemplate | null>(null);
  const showResult = !!result;

  const handleApplyTemplate = React.useCallback((t: PromptTemplate) => {
    setSeedFromTemplate({ directions: t.directionsTemplate });
    setAppliedTemplate(t);
  }, []);

  const didApplyFromUrlRef = React.useRef(false);
  React.useEffect(() => {
    if (didApplyFromUrlRef.current) return;
    const templateId = searchParams?.get("template");
    if (!templateId) {
      didApplyFromUrlRef.current = true;
      return;
    }
    const lib = promptLibraryData as unknown as {
      categories: Array<{ templates: PromptTemplate[] }>;
    };
    for (const cat of lib.categories) {
      const found = cat.templates.find((t) => t.id === templateId);
      if (found) {
        handleApplyTemplate(found);
        break;
      }
    }
    didApplyFromUrlRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 页面加载时恢复上次的评测结果
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(CURRENT_EVALUATION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.result && parsed.input) {
            setResult(parsed.result);
            setCurrentInput(parsed.input);
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore evaluation:', error);
    }
  }, []);

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
      ...(settings?.reasoning ? { reasoning: settings.reasoning } : {}),
      ...(appliedTemplate ? {
        rubric: appliedTemplate.rubric,
        scoreWeights: appliedTemplate.scoreWeights,
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
    
    // 宽松验证：只检查必需字段是否存在
    if (!data || typeof data !== 'object') {
      throw { error: 'INVALID_RESPONSE', message: 'API响应格式错误', retryable: true } as APIError;
    }
    
    // 验证必需字段
    const validScores = ['S', 'A', 'B', 'C'];
    if (!validScores.includes(data.score)) {
      console.warn('Invalid score, using default:', data.score);
      data.score = 'B';
    }
    
    if (typeof data.isSemanticallyCorrect !== 'boolean') {
      data.isSemanticallyCorrect = data.score !== 'C';
    }
    
    if (!data.analysis || typeof data.analysis !== 'string') {
      data.analysis = '评估完成';
    }
    
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      data.timestamp = Date.now();
    }
    
    return data as EvaluationResult;
  };

  const handleSubmit = async (input: EvaluationInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentInput(input);

    try {
      const evaluationResult = await callEvaluationAPI(input);
      setResult(evaluationResult);
      
      // 保存到历史记录
      const saved = saveToHistory(input, evaluationResult);
      if (!saved) {
        console.warn('Failed to save evaluation to history');
      }
      
      // 自动保存当前评测结果到 localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(CURRENT_EVALUATION_KEY, JSON.stringify({
            result: evaluationResult,
            input: input,
            timestamp: Date.now(),
          }));
        }
      } catch (saveError) {
        console.error('Failed to save current evaluation:', saveError);
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
    
    // 清空 localStorage 中的当前评测
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(CURRENT_EVALUATION_KEY);
      }
    } catch (error) {
      console.error('Failed to clear current evaluation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-nnu-paper pt-24 pb-8 px-4">
      <PromptLibraryPanel onApply={handleApplyTemplate} />
      <div className="container mx-auto max-w-7xl">
        {/* iOS 26 Liquid Glass thinking-mode control bar */}
        <div className="mb-5 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-nnu-green/70 shadow-[0_0_0_4px_rgba(31,106,82,0.12)]" />
            <span>当前模型 deepseek-v4-flash · 思考模式可调</span>
          </div>
          <ThinkingModeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 左侧：输入区（lg+ 抽拉式 sticky） */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start space-y-6 print:!static">
            <Card className="bg-white rounded-xl shadow-xl border-t-4 border-nnu-green">
              <CardContent className="p-6">
                <EvaluationForm
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  initialData={seedFromTemplate ?? undefined}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：结果展示区 */}
          <div className="lg:col-span-5 space-y-6" id="results-section">
            
            {/* 等待状态 */}
            {!showResult && !isLoading && !error && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Pulse className="w-10 h-10 text-gray-300" />
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
                      <Warning className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-red-600">
                      {error.error === 'INVALID_INPUT' ? '输入错误' : '评估失败'}
                    </h3>
                    <p className="text-gray-700">{error.message}</p>
                    <div className="flex gap-4 justify-center">
                      {error.retryable && (
                        <Button onClick={handleRetry} variant="nnu" disabled={isLoading}>
                          <ArrowCounterClockwise className="w-4 h-4 mr-2" />
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
            {result && currentInput && (
              <div className="space-y-4">
                <div id="evaluation-printable">
                  <ResultCard result={result} showRadarChart={!!(result.radarScores || result.radarDimensions)} />
                </div>

                <CollapsibleCard
                  title="继续追问 AI"
                  subtitle="基于本次评测多轮提问"
                  icon={<ChatCircleDots className="w-4 h-4" weight="fill" />}
                  accent="green"
                >
                  <FollowUpChat input={currentInput} result={result} />
                </CollapsibleCard>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-3 justify-center print:hidden">
                  <Button
                    onClick={() => typeof window !== "undefined" && window.print()}
                    variant="outline"
                    className="text-nnu-green border-nnu-green hover:bg-nnu-green/10"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    导出报告 (PDF)
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="text-gray-600 hover:text-red-600 hover:border-red-300"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    清空当前评测
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-nnu-paper pt-24 pb-8 px-4">
          <div className="container mx-auto max-w-7xl">
            <ResultCardSkeleton />
          </div>
        </div>
      }
    >
      <EvaluatePageInner />
    </React.Suspense>
  );
}
