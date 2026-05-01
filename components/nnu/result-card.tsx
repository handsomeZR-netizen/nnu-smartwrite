import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EvaluationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RadarChart } from './radar-chart';
import { AnnotatedEssay } from './annotated-essay';
import { ChartBar, CheckCircle, BookOpen, WarningCircle, CaretRight, Lightbulb, XCircle, Brain, MapPin } from '@phosphor-icons/react';

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

const NUMERIC_RING_SIZE = 96;
const NUMERIC_RING_STROKE = 8;
const NUMERIC_RING_RADIUS = (NUMERIC_RING_SIZE - NUMERIC_RING_STROKE) / 2;
const NUMERIC_RING_CIRCUMFERENCE = 2 * Math.PI * NUMERIC_RING_RADIUS;

const getNumericRingColor = (value: number | null): { stroke: string; text: string } => {
  if (value === null) {
    return { stroke: '#d1d5db', text: 'text-gray-400' };
  }
  if (value >= 80) {
    return { stroke: '#16a34a', text: 'text-green-600' };
  }
  if (value >= 60) {
    return { stroke: '#d97706', text: 'text-amber-600' };
  }
  return { stroke: '#dc2626', text: 'text-red-600' };
};

interface NumericScoreRingProps {
  numericScore?: number;
}

const NumericScoreRing: React.FC<NumericScoreRingProps> = ({ numericScore }) => {
  const hasScore =
    typeof numericScore === 'number' && Number.isFinite(numericScore);
  const clamped = hasScore ? Math.max(0, Math.min(100, numericScore as number)) : null;
  const colors = getNumericRingColor(clamped);
  const dashOffset =
    clamped === null
      ? NUMERIC_RING_CIRCUMFERENCE
      : NUMERIC_RING_CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="text-center" aria-label={hasScore ? `具体分数 ${clamped}/100` : '具体分数暂未提供'}>
      <div className="text-sm text-gray-500 mb-1">具体分数</div>
      <div className="relative inline-flex items-center justify-center" style={{ width: NUMERIC_RING_SIZE, height: NUMERIC_RING_SIZE }}>
        <svg
          width={NUMERIC_RING_SIZE}
          height={NUMERIC_RING_SIZE}
          viewBox={`0 0 ${NUMERIC_RING_SIZE} ${NUMERIC_RING_SIZE}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={NUMERIC_RING_SIZE / 2}
            cy={NUMERIC_RING_SIZE / 2}
            r={NUMERIC_RING_RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={NUMERIC_RING_STROKE}
          />
          <circle
            cx={NUMERIC_RING_SIZE / 2}
            cy={NUMERIC_RING_SIZE / 2}
            r={NUMERIC_RING_RADIUS}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={NUMERIC_RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={NUMERIC_RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-black leading-none', colors.text)}>
            {clamped !== null ? clamped : '—'}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 tracking-wider">/100</span>
        </div>
      </div>
    </div>
  );
};


export const ResultCard: React.FC<ResultCardProps> = ({ result, showRadarChart = false }) => {
  const {
    score,
    numericScore,
    isSemanticallyCorrect,
    analysis,
    analysisBreakdown,
    polishedVersion,
    sentenceAnnotations,
    evaluationType,
    reasoningProcess
  } = result;

  const hasSentenceAnnotations = Array.isArray(sentenceAnnotations) && sentenceAnnotations.length > 0;

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
        : <WarningCircle className="w-5 h-5 text-yellow-600" />,
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
          <ChartBar className="w-5 h-5" />
          评测报告
        </h3>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          ID: {new Date(result.timestamp).toISOString().slice(0, 10).replace(/-/g, '')}-{String(result.timestamp).slice(-3)}
        </span>
      </CardHeader>

      <CardContent className="p-6">
        {/* Score and Radar */}
        <div className="flex items-center justify-between flex-wrap gap-y-4 mb-6">
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

          <div className="h-12 w-[1px] bg-gray-200 hidden sm:block" />

          <NumericScoreRing numericScore={numericScore} />

          {showRadarChart && (result.radarDimensions || result.radarScores) && (
            <>
              <div className="h-12 w-[1px] bg-gray-200 hidden sm:block" />
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

        {/* 逐句批注（折叠） */}
        {hasSentenceAnnotations && (
          <details className="mt-6 group rounded-lg border border-gray-200 bg-white/60 backdrop-blur-sm overflow-hidden">
            <summary className="flex items-center justify-between gap-2 cursor-pointer list-none px-4 py-3 text-sm font-semibold text-nnu-green hover:bg-nnu-green/5 transition-colors">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" weight="fill" />
                逐句批注
                <span className="text-xs font-normal text-gray-500">
                  共 {sentenceAnnotations?.length} 句
                </span>
              </span>
              <CaretRight className="w-4 h-4 transition-transform group-open:rotate-90 text-gray-400" />
            </summary>
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/40">
              <AnnotatedEssay sentenceAnnotations={sentenceAnnotations ?? []} />
            </div>
          </details>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">Powered by NNU SmartWrite Engine</span>
          <button type="button" className="text-xs text-nnu-green font-bold hover:underline flex items-center">
            查看完整报告 <CaretRight className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
