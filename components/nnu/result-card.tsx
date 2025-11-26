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
      type: 'strengths',
      title: '亮点与优势',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      content: analysisBreakdown.strengths.length > 0 
        ? analysisBreakdown.strengths 
        : ['整体表达流畅'],
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
    },
    {
      type: 'weaknesses',
      title: '待改进之处',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      content: analysisBreakdown.weaknesses.length > 0 
        ? analysisBreakdown.weaknesses 
        : ['暂无明显问题'],
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
    },
    {
      type: 'context',
      title: '语境契合度分析',
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      content: analysisBreakdown.contextMatch || '与语境匹配良好',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      type: 'suggestion',
      title: '专家润色建议 (Polished Version)',
      icon: <Lightbulb className="w-5 h-5 text-nnu-gold" />,
      content: polishedVersion,
      bgColor: 'bg-nnu-paper',
      borderColor: 'border-nnu-gold/30',
    },
  ] : [
    {
      type: isSemanticallyCorrect ? 'success' : 'warning',
      title: '语义等价判定',
      icon: isSemanticallyCorrect 
        ? <CheckCircle className="w-5 h-5 text-green-600" />
        : <AlertCircle className="w-5 h-5 text-yellow-600" />,
      content: isSemanticallyCorrect 
        ? '你的表达在语义上与标准答案等价，AI 判定为正确。'
        : '你的表达与标准答案存在语义差异，建议参考润色建议进行改进。',
      bgColor: isSemanticallyCorrect ? 'bg-green-50' : 'bg-yellow-50',
      borderColor: isSemanticallyCorrect ? 'border-green-100' : 'border-yellow-100',
    },
    {
      type: 'info',
      title: '语境契合度',
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      content: analysis,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      type: 'suggestion',
      title: 'AI 润色建议',
      icon: <Lightbulb className="w-5 h-5 text-nnu-gold" />,
      content: polishedVersion,
      bgColor: 'bg-nnu-paper',
      borderColor: 'border-nnu-gold/30',
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

        {/* AI 总评 */}
        <div className="text-gray-700 leading-relaxed border-l-4 border-nnu-green pl-4 py-2 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-nnu-green mb-1">AI 总评</h4>
          <p className="text-sm">{analysis}</p>
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

        {/* 详细列表展示 */}
        <div className="grid gap-4">
          {analysisDetails.map((section, idx) => (
            <div 
              key={idx} 
              className={cn(
                "p-4 rounded-lg border transition-all",
                section.bgColor,
                section.borderColor,
                selectedDimension && section.title.includes(selectedDimension) 
                  ? "ring-2 ring-blue-400" 
                  : ""
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                {section.icon}
                <h4 className="font-bold text-gray-900">{section.title}</h4>
              </div>
              {Array.isArray(section.content) ? (
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn(
                  "text-sm leading-relaxed",
                  section.type === 'suggestion' 
                    ? "text-gray-800 font-mono bg-white p-3 rounded border border-gray-200 italic" 
                    : "text-gray-700 font-medium"
                )}>
                  {section.content}
                </p>
              )}
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
