"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EvaluationInput, ValidationError } from "@/lib/types";
import { EvaluationInputSchema } from "@/lib/types";
import { ZodError } from "zod";
import { debounce } from "@/lib/performance";
import { evaluationRateLimiter } from "@/lib/rate-limiter";
import { isUsingCustomAPI } from "@/lib/settings";
import { RefreshCw, Send, FileText, Cloud, Key, Shuffle, ScanSearch } from "lucide-react";
import sampleCasesData from "@/data/sample-cases.json";

export interface EvaluationFormProps {
  initialData?: Partial<EvaluationInput>;
  onSubmit: (input: EvaluationInput) => Promise<void>;
  isLoading?: boolean;
  selectedText?: string;
}

// 从案例库加载示例
const SAMPLE_CASES = sampleCasesData.samples.map(sample => ({
  directions: sample.directions,
  essayContext: sample.essayContext,
  studentSentence: "",
  title: sample.title,
}));

export function EvaluationForm({
  initialData,
  onSubmit,
  isLoading = false,
  selectedText = "",
}: EvaluationFormProps) {
  const [formData, setFormData] = React.useState<EvaluationInput>({
    directions: initialData?.directions || "",
    essayContext: initialData?.essayContext || "",
    studentSentence: initialData?.studentSentence || "",
  });
  
  const [selection, setSelection] = React.useState<string>("");
  const essayContextRef = React.useRef<HTMLTextAreaElement>(null);
  const [currentSampleIndex, setCurrentSampleIndex] = React.useState(0);
  const [usingCustomAPI, setUsingCustomAPI] = React.useState(false);

  // 检查API类型
  React.useEffect(() => {
    setUsingCustomAPI(isUsingCustomAPI());
  }, []);

  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [touched, setTouched] = React.useState<Record<keyof EvaluationInput, boolean>>({
    directions: false,
    essayContext: false,
    studentSentence: false,
    evaluationType: false,
    mode: false,
  });
  const [rateLimitError, setRateLimitError] = React.useState<string | null>(null);

  const saveDraft = React.useMemo(
    () =>
      debounce((input: EvaluationInput) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('evaluation-draft', JSON.stringify(input));
          }
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }, 1000),
    []
  );

  React.useEffect(() => {
    if (!initialData) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const draft = localStorage.getItem('evaluation-draft');
          if (draft) {
            const parsed = JSON.parse(draft);
            setFormData(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [initialData]);

  React.useEffect(() => {
    if (formData.directions || formData.essayContext || formData.studentSentence) {
      saveDraft(formData);
    }
  }, [formData, saveDraft]);

  const validateField = (field: keyof EvaluationInput, value: string): string | null => {
    // Skip validation for optional evaluationType field
    if (field === 'evaluationType') {
      return null;
    }
    try {
      EvaluationInputSchema.shape[field].parse(value);
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        return error.issues[0]?.message || "验证失败";
      }
      return "验证失败";
    }
  };

  const validateForm = (): boolean => {
    try {
      EvaluationInputSchema.parse(formData);
      setErrors([]);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map((err) => ({
          field: String(err.path[0]),
          message: err.message,
        }));
        setErrors(validationErrors);
      }
      return false;
    }
  };

  const handleFieldChange = (field: keyof EvaluationInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Only validate required fields
    if (field !== 'evaluationType' && touched[field as 'directions' | 'essayContext' | 'studentSentence']) {
      const error = validateField(field, value);
      setErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== field);
        if (error) {
          return [...filtered, { field, message: error }];
        }
        return filtered;
      });
    }
  };

  const handleFieldBlur = (field: keyof EvaluationInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field];
    if (value !== undefined) {
      const error = validateField(field, value);
      if (error) {
        setErrors((prev) => {
          const filtered = prev.filter((e) => e.field !== field);
          return [...filtered, { field, message: error }];
        });
      }
    }
  };

  const handleTextSelection = () => {
    if (essayContextRef.current) {
      const start = essayContextRef.current.selectionStart;
      const end = essayContextRef.current.selectionEnd;
      const selectedText = formData.essayContext.substring(start, end);
      if (selectedText.trim()) {
        setSelection(selectedText.trim());
      }
    }
  };

  const handleEvaluateSelection = async () => {
    if (!selection) return;
    
    setRateLimitError(null);
    if (!evaluationRateLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(evaluationRateLimiter.getTimeUntilNextRequest() / 1000);
      setRateLimitError(`请求过于频繁，请等待 ${waitTime} 秒后再试`);
      return;
    }
    
    const evaluationData = {
      ...formData,
      studentSentence: selection,
    };
    
    setTouched({ directions: true, essayContext: true, studentSentence: true, evaluationType: false, mode: false });
    
    try {
      EvaluationInputSchema.parse(evaluationData);
      setErrors([]);
      evaluationRateLimiter.recordRequest();
      await onSubmit(evaluationData);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map((err) => ({
          field: String(err.path[0]),
          message: err.message,
        }));
        setErrors(validationErrors);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitError(null);
    if (!evaluationRateLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(evaluationRateLimiter.getTimeUntilNextRequest() / 1000);
      setRateLimitError(`请求过于频繁，请等待 ${waitTime} 秒后再试`);
      return;
    }
    setTouched({ directions: true, essayContext: true, studentSentence: true, evaluationType: false, mode: false });
    if (!validateForm()) return;
    evaluationRateLimiter.recordRequest();
    await onSubmit(formData);
  };

  const handleFillSample = () => {
    const sample = SAMPLE_CASES[currentSampleIndex];
    setFormData({
      directions: sample.directions,
      essayContext: sample.essayContext,
      studentSentence: sample.studentSentence,
    });
    setErrors([]);
    setTouched({ directions: false, essayContext: false, studentSentence: false, evaluationType: false, mode: false });
  };

  const handleNextSample = () => {
    const nextIndex = (currentSampleIndex + 1) % SAMPLE_CASES.length;
    setCurrentSampleIndex(nextIndex);
    const sample = SAMPLE_CASES[nextIndex];
    setFormData({
      directions: sample.directions,
      essayContext: sample.essayContext,
      studentSentence: sample.studentSentence,
    });
    setErrors([]);
    setTouched({ directions: false, essayContext: false, studentSentence: false, evaluationType: false, mode: false });
  };

  const getFieldError = (field: keyof EvaluationInput): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
  };

  const hasFieldError = (field: keyof EvaluationInput): boolean => {
    return touched[field] && !!getFieldError(field);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="英语写作评估表单">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-nnu-green flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5" />
            智能评测工作台
          </h3>
          {/* API状态提示 */}
          <div className="flex items-center gap-2 text-xs">
            {usingCustomAPI ? (
              <div className="flex items-center gap-1 text-nnu-coral">
                <Key className="w-3 h-3" />
                <span>使用自定义 API</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-nnu-jade">
                <Cloud className="w-3 h-3" />
                <span>使用云端 API</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNextSample}
            className="text-xs text-nnu-coral hover:text-nnu-green underline flex items-center gap-1 transition-colors whitespace-nowrap"
            title="切换示例案例"
          >
            <Shuffle className="w-3 h-3" />
            换一个
          </button>
          <button
            type="button"
            onClick={handleFillSample}
            className="text-xs text-nnu-green hover:text-nnu-coral underline flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3 h-3" />
            填入示例
          </button>
        </div>
      </div>
      
      {/* 当前示例标题 */}
      {SAMPLE_CASES[currentSampleIndex] && (
        <div className="p-3 bg-gradient-to-r from-nnu-jade/10 to-nnu-gold/10 border-l-4 border-nnu-jade rounded text-sm">
          <p className="text-nnu-green font-semibold">
            当前示例：{SAMPLE_CASES[currentSampleIndex].title}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="directions" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="bg-nnu-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
          Directions (题目要求)
        </label>
        <Textarea
          id="directions"
          value={formData.directions}
          onChange={(e) => handleFieldChange("directions", e.target.value)}
          onBlur={() => handleFieldBlur("directions")}
          placeholder="例如: Translate the underlined sentence..."
          className={cn(
            "min-h-[80px] bg-gray-50 border-gray-200 focus:ring-2 focus:ring-nnu-jade focus:border-transparent resize-none",
            hasFieldError("directions") && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={hasFieldError("directions")}
          aria-describedby={hasFieldError("directions") ? "directions-error" : undefined}
        />
        {hasFieldError("directions") && (
          <p id="directions-error" className="text-sm text-red-500" role="alert">{getFieldError("directions")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="essayContext" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="bg-nnu-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
          Essay Full Text (文章全文)
          <span className="text-xs font-normal text-gray-400 ml-auto">选中句子后点击下方按钮评估</span>
        </label>
        <Textarea
          ref={essayContextRef}
          id="essayContext"
          value={formData.essayContext}
          onChange={(e) => handleFieldChange("essayContext", e.target.value)}
          onBlur={() => handleFieldBlur("essayContext")}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder="粘贴文章全文，然后用鼠标选中需要评估的句子..."
          className={cn(
            "min-h-[200px] bg-nnu-paper border-nnu-gold/30 focus:ring-2 focus:ring-nnu-jade focus:border-transparent text-gray-700 resize-none leading-relaxed",
            hasFieldError("essayContext") && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={hasFieldError("essayContext")}
          aria-describedby={hasFieldError("essayContext") ? "essayContext-error" : undefined}
        />
        {hasFieldError("essayContext") && (
          <p id="essayContext-error" className="text-sm text-red-500" role="alert">{getFieldError("essayContext")}</p>
        )}
        
        {selection && (
          <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-xs text-blue-600 font-semibold mb-1">已选中句子：</p>
            <p className="text-sm text-gray-700 italic">"{selection}"</p>
          </div>
        )}
      </div>

      {rateLimitError && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md" role="alert">
          <p className="text-sm text-yellow-800">{rateLimitError}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* 按钮 1: 单句模式 */}
        <Button
          type="button"
          onClick={async () => {
            if (!selection || !formData.directions) {
              alert("请先在文章中选中一句要分析的句子");
              return;
            }
            
            setRateLimitError(null);
            if (!evaluationRateLimiter.canMakeRequest()) {
              const waitTime = Math.ceil(evaluationRateLimiter.getTimeUntilNextRequest() / 1000);
              setRateLimitError(`请求过于频繁，请等待 ${waitTime} 秒后再试`);
              return;
            }
            
            const evaluationData = {
              ...formData,
              studentSentence: selection,
              mode: 'sentence' as const,
            };
            
            setTouched({ directions: true, essayContext: true, studentSentence: true, evaluationType: false, mode: false });
            
            try {
              EvaluationInputSchema.parse(evaluationData);
              setErrors([]);
              evaluationRateLimiter.recordRequest();
              await onSubmit(evaluationData);
            } catch (error) {
              if (error instanceof ZodError) {
                const validationErrors: ValidationError[] = error.issues.map((err) => ({
                  field: String(err.path[0]),
                  message: err.message,
                }));
                setErrors(validationErrors);
              }
            }
          }}
          disabled={isLoading || !selection || !formData.directions}
          className={cn(
            "w-full py-6 rounded-lg font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all",
            isLoading 
              ? "bg-gray-400 cursor-not-allowed text-white" 
              : selection && formData.directions
              ? "bg-white border-2 border-nnu-green text-nnu-green hover:bg-nnu-green hover:text-white"
              : "bg-gray-200 cursor-not-allowed text-gray-400"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>AI 分析中...</span>
            </>
          ) : (
            <>
              <ScanSearch className="w-5 h-5" />
              深度分析选中长难句
            </>
          )}
        </Button>

        {/* 按钮 2: 全文模式 */}
        <Button
          type="button"
          onClick={async () => {
            if (!formData.essayContext || !formData.directions) return;
            
            setRateLimitError(null);
            if (!evaluationRateLimiter.canMakeRequest()) {
              const waitTime = Math.ceil(evaluationRateLimiter.getTimeUntilNextRequest() / 1000);
              setRateLimitError(`请求过于频繁，请等待 ${waitTime} 秒后再试`);
              return;
            }
            
            const evaluationData = {
              ...formData,
              studentSentence: formData.essayContext,
              mode: 'article' as const,
            };
            
            setTouched({ directions: true, essayContext: true, studentSentence: true, evaluationType: false, mode: false });
            
            try {
              EvaluationInputSchema.parse(evaluationData);
              setErrors([]);
              evaluationRateLimiter.recordRequest();
              await onSubmit(evaluationData);
            } catch (error) {
              if (error instanceof ZodError) {
                const validationErrors: ValidationError[] = error.issues.map((err) => ({
                  field: String(err.path[0]),
                  message: err.message,
                }));
                setErrors(validationErrors);
              }
            }
          }}
          disabled={isLoading || !formData.essayContext || !formData.directions}
          className={cn(
            "w-full py-6 rounded-lg font-bold text-lg shadow-md flex items-center justify-center gap-2 transition-all",
            isLoading 
              ? "bg-gray-400 cursor-not-allowed text-white" 
              : formData.essayContext && formData.directions
              ? "bg-nnu-green text-white hover:bg-nnu-green/90"
              : "bg-gray-200 cursor-not-allowed text-gray-400"
          )}
        >
          <FileText className="w-5 h-5" />
          全文/段落宏观评测
        </Button>
      </div>
    </form>
  );
}
