import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import type { EvaluationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RadarChart } from './radar-chart';
import { AnnotatedEssay } from './annotated-essay';
import {
  ChartBar,
  CheckCircle,
  BookOpen,
  XCircle,
  Brain,
  MapPin,
  Lightbulb,
  Scales,
} from '@phosphor-icons/react';

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
    analysis,
    analysisBreakdown,
    polishedVersion,
    sentenceAnnotations,
    evaluationType,
    reasoningProcess,
  } = result;

  const hasSentenceAnnotations = Array.isArray(sentenceAnnotations) && sentenceAnnotations.length > 0;
  const strengths = analysisBreakdown?.strengths ?? [];
  const weaknesses = analysisBreakdown?.weaknesses ?? [];
  const contextMatch = analysisBreakdown?.contextMatch;
  const hasStructuredBreakdown = Boolean(analysisBreakdown);

  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  return (
    <Card
      className="bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
      role="article"
      aria-label="评估结果卡片"
    >
      <CardHeader className="bg-nnu-green p-4 text-white flex flex-row justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <ChartBar className="w-5 h-5" />
          评测报告
        </h3>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          ID: {new Date(result.timestamp).toISOString().slice(0, 10).replace(/-/g, '')}-{String(result.timestamp).slice(-3)}
        </span>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Headline: 评级 / 具体分数 / 雷达 — always visible */}
        <div className="flex items-center justify-between flex-wrap gap-y-4">
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

        {/* AI 总评 — short, always visible */}
        <div className="text-gray-700 leading-relaxed border-l-4 border-nnu-green pl-4 py-2 bg-gray-50">
          <h4 className="text-sm font-bold text-nnu-green mb-1">AI 总评</h4>
          <p className="text-sm">{analysis}</p>
        </div>

        {/* Selected dimension highlight (kept inline) */}
        {selectedDimension && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                已选择维度: {selectedDimension}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDimension(null)}
                className="text-blue-600 hover:text-blue-800"
                aria-label="清除维度选择"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsible: 亮点与改进 */}
        {hasStructuredBreakdown && (strengths.length > 0 || weaknesses.length > 0) && (
          <CollapsibleCard
            title="亮点与改进"
            subtitle={`${strengths.length} 优 · ${weaknesses.length} 待改进`}
            icon={<Scales className="w-4 h-4" weight="fill" />}
            accent="green"
            defaultOpen
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
                  <h4 className="text-sm font-bold text-green-900">亮点与优势</h4>
                </div>
                <ul className="space-y-2">
                  {(strengths.length > 0 ? strengths : ['整体表达流畅']).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" weight="fill" />
                  <h4 className="text-sm font-bold text-red-900">待改进之处</h4>
                </div>
                <ul className="space-y-2">
                  {(weaknesses.length > 0 ? weaknesses : ['暂无明显问题']).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleCard>
        )}

        {/* Collapsible: 语境契合度分析 */}
        {hasStructuredBreakdown && contextMatch && (
          <CollapsibleCard
            title="语境契合度分析"
            icon={<BookOpen className="w-4 h-4" weight="fill" />}
            accent="blue"
          >
            <p className="text-sm leading-relaxed text-gray-700">{contextMatch}</p>
          </CollapsibleCard>
        )}

        {/* Collapsible: 专家润色建议（含全文） */}
        {polishedVersion && (
          <CollapsibleCard
            title="专家润色建议"
            subtitle="Polished Version"
            icon={<Lightbulb className="w-4 h-4" weight="fill" />}
            accent="amber"
          >
            <p className="text-sm leading-relaxed text-gray-800 font-mono bg-white/80 p-3 rounded border border-gray-200 italic whitespace-pre-wrap">
              {polishedVersion}
            </p>
          </CollapsibleCard>
        )}

        {/* Fallback: 无 analysisBreakdown 时显示传统单段分析 */}
        {!hasStructuredBreakdown && analysis && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" weight="fill" />
              <h4 className="text-sm font-bold text-blue-900">语境契合度</h4>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{analysis}</p>
          </div>
        )}

        {/* Collapsible: 逐句批注 */}
        {hasSentenceAnnotations && (
          <CollapsibleCard
            title="逐句批注"
            subtitle={`共 ${sentenceAnnotations?.length} 句`}
            icon={<MapPin className="w-4 h-4" weight="fill" />}
            accent="coral"
          >
            <AnnotatedEssay sentenceAnnotations={sentenceAnnotations ?? []} />
          </CollapsibleCard>
        )}

        {/* Collapsible: AI 推理过程 */}
        {reasoningProcess && (
          <CollapsibleCard
            title="AI 推理过程"
            icon={<Brain className="w-4 h-4" weight="fill" />}
            accent="gray"
          >
            <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
              {reasoningProcess}
            </div>
          </CollapsibleCard>
        )}

        <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
          Powered by NNU SmartWrite Engine
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
