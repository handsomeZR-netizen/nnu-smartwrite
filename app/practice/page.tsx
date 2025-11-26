"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { EvaluationForm } from "@/components/nnu/evaluation-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EvaluationInput, EvaluationResult, APIError, PracticeQuestion } from "@/lib/types";
import { saveToHistory } from "@/lib/storage";
import { EvaluationResultSchema } from "@/lib/types";
import { getCachedData, setCachedData } from "@/lib/performance";
import { ResultCardSkeleton, RadarChartSkeleton } from "@/components/nnu/skeletons";
import practiceQuestionsData from "@/data/practice-questions.json";

// Dynamic import for ResultCard (only loaded when needed)
const ResultCard = dynamic(
  () => import("@/components/nnu/result-card").then(mod => mod.ResultCard),
  {
    loading: () => <ResultCardSkeleton />,
    ssr: false,
  }
);

/**
 * 练习大厅页面
 * 
 * 功能：
 * - 显示题目列表（按类型分组）
 * - 题目选择和预填充
 * - 集成评估表单
 * - 返回题目列表功能
 */
export default function PracticePage() {
  const [selectedQuestion, setSelectedQuestion] = React.useState<PracticeQuestion | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<EvaluationResult | null>(null);
  const [error, setError] = React.useState<APIError | null>(null);
  const [currentInput, setCurrentInput] = React.useState<EvaluationInput | null>(null);

  // 从JSON数据加载题目（使用缓存）
  const questions = React.useMemo(() => {
    const CACHE_KEY = 'practice-questions-cache';
    
    // Try to get from cache first
    const cached = getCachedData<PracticeQuestion[]>(CACHE_KEY);
    if (cached) {
      return cached;
    }
    
    // Load from JSON and cache
    const loadedQuestions = practiceQuestionsData.questions as PracticeQuestion[];
    setCachedData(CACHE_KEY, loadedQuestions);
    
    return loadedQuestions;
  }, []);

  // 按类型分组题目
  const groupedQuestions = React.useMemo(() => {
    const groups: Record<string, PracticeQuestion[]> = {};
    
    questions.forEach((question) => {
      if (!groups[question.type]) {
        groups[question.type] = [];
      }
      groups[question.type].push(question);
    });
    
    return groups;
  }, [questions]);

  /**
   * 获取题目类型的中文名称
   */
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      translation: "翻译题",
      writing: "写作题",
      completion: "完形填空",
    };
    return labels[type] || type;
  };

  /**
   * 获取难度标签样式
   */
  const getDifficultyBadge = (difficulty: string) => {
    const styles: Record<string, string> = {
      easy: "bg-green-100 text-green-800 hover:bg-green-100",
      medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      hard: "bg-red-100 text-red-800 hover:bg-red-100",
    };
    const labels: Record<string, string> = {
      easy: "简单",
      medium: "中等",
      hard: "困难",
    };
    return (
      <Badge className={styles[difficulty] || ""}>
        {labels[difficulty] || difficulty}
      </Badge>
    );
  };

  /**
   * 选择题目并预填充表单
   */
  const handleSelectQuestion = (question: PracticeQuestion) => {
    setSelectedQuestion(question);
    setResult(null);
    setError(null);
    setCurrentInput(null);
  };

  /**
   * 返回题目列表
   */
  const handleBackToList = () => {
    setSelectedQuestion(null);
    setResult(null);
    setError(null);
    setCurrentInput(null);
  };

  /**
   * 调用评估API
   */
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: APIError = await response.json();
      throw errorData;
    }

    const data = await response.json();
    
    // 验证响应格式
    const validated = EvaluationResultSchema.safeParse(data);
    if (!validated.success) {
      throw {
        error: 'INVALID_RESPONSE',
        message: 'API响应格式错误',
        retryable: true,
      } as APIError;
    }

    return validated.data;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (input: EvaluationInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentInput(input);

    try {
      // 调用评估API
      const evaluationResult = await callEvaluationAPI(input);
      
      // 设置结果
      setResult(evaluationResult);
      
      // 自动保存到历史记录
      const saved = saveToHistory(input, evaluationResult);
      if (!saved) {
        console.warn('Failed to save evaluation to history');
      }
    } catch (err) {
      // 处理错误
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

  /**
   * 重试评估
   */
  const handleRetry = () => {
    if (currentInput) {
      handleSubmit(currentInput);
    }
  };

  /**
   * 重新开始评估
   */
  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentInput(null);
  };

  return (
    <main className="min-h-screen bg-nnu-paper pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-nnu-green mb-2">
            练习大厅
          </h1>
          <p className="text-gray-600" role="status" aria-live="polite">
            {selectedQuestion 
              ? `正在练习：${selectedQuestion.title}`
              : "选择题目开始练习，提升你的英语写作能力"
            }
          </p>
        </header>

        {/* 题目列表视图 */}
        {!selectedQuestion && (
          <section aria-label="练习题目列表">
            <div className="space-y-8">
              {Object.entries(groupedQuestions).map(([type, typeQuestions]) => (
                <div key={type}>
                  <h2 className="text-2xl font-semibold text-nnu-green mb-4 flex items-center gap-2">
                    <span>{getTypeLabel(type)}</span>
                    <Badge variant="outline" aria-label={`共${typeQuestions.length}道题目`}>
                      {typeQuestions.length}题
                    </Badge>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
                    {typeQuestions.map((question) => (
                      <Card
                        key={question.id}
                        className="bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
                        onClick={() => handleSelectQuestion(question)}
                        role="listitem"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectQuestion(question);
                          }
                        }}
                        aria-label={`${question.title}，难度${question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg text-nnu-green flex-1">
                              {question.title}
                            </CardTitle>
                            {getDifficultyBadge(question.difficulty)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {question.directions}
                          </p>
                          <Button
                            variant="link"
                            className="mt-2 p-0 h-auto min-h-[44px] text-nnu-coral touch-manipulation flex items-center focus:outline-none focus:ring-2 focus:ring-nnu-coral rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectQuestion(question);
                            }}
                            aria-label={`开始练习${question.title}`}
                          >
                            开始练习 →
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 题目练习视图 */}
        {selectedQuestion && !result && !error && (
          <section aria-label="题目练习区域">
            <div className="space-y-6">
              {/* 返回按钮 */}
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="mb-4"
                aria-label="返回题目列表"
              >
                ← 返回题目列表
              </Button>

              {/* 题目信息卡片 */}
              <Card className="bg-white shadow-md border-nnu-green/20" role="article">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl text-nnu-green">
                      {selectedQuestion.title}
                    </CardTitle>
                    {getDifficultyBadge(selectedQuestion.difficulty)}
                  </div>
                </CardHeader>
              </Card>

              {/* 评估表单（预填充题目数据） */}
              <Card className="bg-white shadow-md">
                <CardContent className="pt-6">
                  <EvaluationForm
                    initialData={{
                      directions: selectedQuestion.directions,
                      essayContext: selectedQuestion.essayContext,
                      studentSentence: "",
                    }}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 错误提示 */}
        {selectedQuestion && error && (
          <section aria-label="错误提示" role="alert">
            <div className="space-y-6">
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="mb-4"
                aria-label="返回题目列表"
              >
                ← 返回题目列表
              </Button>

              <Card className="bg-white shadow-md border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-5xl" role="img" aria-label="警告图标">⚠️</div>
                    <h3 className="text-xl font-semibold text-red-600">
                      {error.error === 'INVALID_INPUT' ? '输入错误' : '评估失败'}
                    </h3>
                    <p className="text-gray-700">{error.message}</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                      {error.retryable && (
                        <Button
                          onClick={handleRetry}
                          variant="nnu"
                          disabled={isLoading}
                          aria-label={isLoading ? '正在重试' : '重试评估'}
                        >
                          {isLoading ? '重试中...' : '重试'}
                        </Button>
                      )}
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        aria-label="重新答题"
                      >
                        重新答题
                      </Button>
                      <Button
                        onClick={handleBackToList}
                        variant="outline"
                        aria-label="返回题目列表"
                      >
                        返回列表
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* 评估结果 */}
        {selectedQuestion && result && (
          <section aria-label="评估结果" role="region" aria-live="polite">
            <div className="space-y-6">
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="mb-4"
                aria-label="返回题目列表"
              >
                ← 返回题目列表
              </Button>

              <ResultCard
                result={result}
                showRadarChart={!!result.radarScores}
              />
              
              {/* 操作按钮 */}
              <nav aria-label="评估后操作" className="flex gap-4 justify-center flex-wrap">
                <Button
                  onClick={handleReset}
                  variant="nnu"
                  size="lg"
                  aria-label="重新答题"
                >
                  重新答题
                </Button>
                <Button
                  onClick={handleBackToList}
                  variant="outline"
                  size="lg"
                  aria-label="选择其他题目"
                >
                  选择其他题目
                </Button>
                <Button
                  onClick={() => window.location.href = '/history'}
                  variant="outline"
                  size="lg"
                  aria-label="查看历史记录"
                >
                  查看历史
                </Button>
              </nav>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
