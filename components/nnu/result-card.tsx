import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EvaluationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RadarChart } from './radar-chart';
import { BarChart3, CheckCircle, BookOpen, AlertCircle, ChevronRight, Lightbulb, XCircle, Brain } from 'lucide-react';

export interface ResultCardProps {
  result: EvaluationResult;
  showRadarChart?: boolean;
}

const getScoreColor = (score: 'S' | 'A' | 'B' | 'C'): string => {
  switch (score) {
    case 'S':
      return 'text-green-600';
    case 'A':
      return 'text-blue-600';
    case 'B':
      return 'text-yellow-600';
    case 'C':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getScoreDescription = (score: 'S' | 'A' | 'B' | 'C'): string => {
  const descriptions = {
    S: '优秀',
    A: '良好',
    B: '中等',
    C: '需要改进',
  };
  return descriptions[score];
};


export const ResultCard: React.FC<ResultCardProps> = ({ result, showRadarChart = false }) => {
  const { 
    score, 
    isSemanticallyCorrect, 
    analysis, 
    analysisBreakdown,
    polishedVersion,
    evaluationType,
    reasoningProcess 
  } = result;

  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // 使用结构化分析（如果有），否则回退到传统分析
  const analysisDetails = analysisBreakdown ? [
    {
      type: isSemanticallyCorrect ? 'success' : 'warning',
      title: '语义等价判定 (Semantic Equivalence)',
      content: isSemanticallyCorrect 
        ? '你的表达在语义上与标准答案等价，DeepSeek 判定为正确。'
        : '你的表达与标准答案存在语义差异，建议参考润色建议进行改进。',
    },
    {
      type: 'strengths',
      title: '✨ 优点 (Strengths)',
      content: analysisBreakdown.strengths.length > 0 
        ? analysisBreakdown.strengths 
        : ['整体表达流畅'],
    },
    {
      type: 'weaknesses',
      title: '⚠️ 需要改进 (Areas for Improvement)',
      content: analysisBreakdown.weaknesses.length > 0 
        ? analysisBreakdown.weaknesses 
        : ['暂无明显问题'],
    },
    {
      type: 'context',
      title: '📝 语境契合度 (Context Match)',
      content: analysisBreakdown.contextMatch || '与语境匹配良好',
    },
    {
      type: 'suggestion',
      title: '💡 AI 润色建议 (Polished Version)',
      content: polishedVersion,
    },
  ] : [
    {
      type: isSemanticallyCorrect ? 'success' : 'warning',
      title: '语义等价判定 (Semantic Equivalence)',
      content: isSemanticallyCorrect 
        ? '你的表达在语义上与标准答案等价，DeepSeek 判定为正确。'
        : '你的表达与标准答案存在语义差异，建议参考润色建议进行改进。',
    },
    {
      type: 'info',
      title: '语境契合度 (Context Awareness)',
      content: analysis,
    },
    {
      type: 'suggestion',
      title: 'AI 润色建议 (Polishing)',
      content: polishedVersion,
    },
  ];

  return (
    <Card 
      className="bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
      role="article"
      aria-label="评估结果卡片"
    >
      {/* Header */}
      <CardHeader className="bg-nnu-green p-4 text-white flex flex-row justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          评测报告
        </h3>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          ID: {new Date(result.timestamp).toISOString().slice(0, 10).replace(/-/g, '')}-{String(result.timestamp).slice(-3)}
        </span>
      </CardHeader>

      <CardContent className="p-6">
        {/* Score and Radar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">综合评级</div>
            <div 
              className={cn("text-6xl font-black font-serif drop-shadow-sm", getScoreColor(score))}
              role="status"
              aria-label={`评分等级 ${score}，${getScoreDescription(score)}`}
            >
              {score}
            </div>
            {evaluationType && (
              <Badge variant="outline" className="mt-2 text-xs">
                {evaluationType === 'translation' ? '翻译题' : '写作题'}
              </Badge>
            )}
          </div>
          
          {showRadarChart && (result.radarDimensions || result.radarScores) && (
            <>
              <div className="h-12 w-[1px] bg-gray-200" />
              <div className="w-48 h-32">
                <RadarChart 
                  scores={result.radarScores}
                  dimensions={result.radarDimensions}
                  size="sm"
                  onDimensionClick={(dimension) => setSelectedDimension(dimension)}
                />
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="bg-nnu-paper p-4 rounded-lg border border-nnu-gold/30 mb-4">
          <p className="text-nnu-green text-sm font-medium leading-relaxed italic">
            "{isSemanticallyCorrect ? 'Excellent work! Your translation demonstrates a deep understanding of the context.' : 'Good effort! There are some areas that could be improved.'}"
          </p>
        </div>

        {/* Reasoning Process (if available) */}
        {reasoningProcess && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-sm text-nnu-green hover:underline"
            >
              <Brain className="w-4 h-4" />
              {showReasoning ? '隐藏' : '查看'} AI 推理过程
            </button>
            {showReasoning && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 leading-relaxed">
                {reasoningProcess}
              </div>
            )}
          </div>
        )}

        {/* Selected Dimension Highlight */}
        {selectedDimension && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                已选择维度: {selectedDimension}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDimension(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Detail Analysis */}
        <div className="space-y-3">
          {analysisDetails.map((item, idx) => (
            <div 
              key={idx} 
              className={cn(
                "border rounded-lg p-3 hover:shadow-md transition bg-white",
                selectedDimension && item.title.includes(selectedDimension) 
                  ? "border-blue-400 bg-blue-50" 
                  : "border-gray-100"
              )}
            >
              <div className="flex items-start gap-3">
                {item.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />}
                {item.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />}
                {item.type === 'info' && <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />}
                {item.type === 'strengths' && <Lightbulb className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />}
                {item.type === 'weaknesses' && <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />}
                {item.type === 'context' && <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />}
                {item.type === 'suggestion' && <Lightbulb className="w-5 h-5 text-nnu-coral mt-0.5 shrink-0" />}
                
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                  {Array.isArray(item.content) ? (
                    <ul className="text-gray-600 text-xs mt-1 leading-relaxed list-disc list-inside space-y-1">
                      {item.content.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                      {item.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">Powered by NNU SmartWrite Engine</span>
          <button type="button" className="text-xs text-nnu-green font-bold hover:underline flex items-center">
            查看完整报告 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
