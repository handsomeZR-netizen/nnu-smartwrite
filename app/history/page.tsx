'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ChartLineUp,
  TrendUp,
  TrendDown,
  Trophy,
  Sparkle,
  BookOpen,
  MagnifyingGlass,
  TrashSimple,
  FunnelSimple,
  Translate,
  PencilLine,
  CalendarBlank,
  Equals,
} from '@phosphor-icons/react/dist/ssr';
import { getHistory, clearHistory, deleteHistoryRecord } from '@/lib/storage';
import type { HistoryRecord, EvaluationType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BentoCard, BentoCardHeader } from '@/components/nnu/bento-card';
import { RadarChartSkeleton, HistoryListItemSkeleton } from '@/components/nnu/skeletons';
import { cn } from '@/lib/utils';

// Lazy-loaded charts (kept out of first paint bundle)
const RadarChart = dynamic(
  () => import('@/components/nnu/radar-chart').then((m) => m.RadarChart),
  {
    loading: () => <RadarChartSkeleton />,
    ssr: false,
  },
);

const ScoreTrendChart = dynamic(
  () => import('@/components/nnu/history/score-trend-chart').then((m) => m.ScoreTrendChart),
  {
    loading: () => (
      <div className="h-[220px] w-full animate-pulse rounded-xl bg-nnu-mist/50" />
    ),
    ssr: false,
  },
);

// ============== Helpers ==============

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDay = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const SCORE_FALLBACK: Record<string, number> = { S: 95, A: 85, B: 75, C: 65 };

const scoreToNumeric = (record: HistoryRecord): number => {
  if (typeof record.result.numericScore === 'number') {
    return Math.max(0, Math.min(100, record.result.numericScore));
  }
  return SCORE_FALLBACK[record.result.score] ?? 70;
};

const SCORE_RANK: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };

const getScoreColor = (score: string): string => {
  switch (score) {
    case 'S':
      return 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-white shadow-[0_2px_10px_-3px_rgba(217,119,6,0.45)]';
    case 'A':
      return 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-white shadow-[0_2px_10px_-3px_rgba(16,185,129,0.45)]';
    case 'B':
      return 'bg-gradient-to-br from-sky-400 via-sky-500 to-sky-700 text-white shadow-[0_2px_10px_-3px_rgba(14,165,233,0.4)]';
    case 'C':
      return 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 text-white shadow-[0_2px_10px_-3px_rgba(100,116,139,0.4)]';
    default:
      return 'bg-gray-300 text-gray-700';
  }
};

const ACCENT_FOR_SCORE: Record<string, 'gold' | 'green' | 'mist' | 'sage'> = {
  S: 'gold',
  A: 'green',
  B: 'mist',
  C: 'sage',
};

const DIM_LABELS: Record<string, string> = {
  vocabulary: '词汇',
  grammar: '语法',
  coherence: '连贯',
  structure: '结构',
};

const TYPE_LABEL: Record<EvaluationType, string> = {
  translation: '翻译',
  writing: '写作',
};

// ============== Stats ==============

interface DashStats {
  total: number;
  avg: number;
  trendDelta: number; // percentage points: recent half avg minus older half avg
  best: { grade: string; date: number } | null;
  topDimension: { key: string; label: string; avg: number } | null;
}

const computeStats = (records: HistoryRecord[]): DashStats => {
  if (records.length === 0) {
    return { total: 0, avg: 0, trendDelta: 0, best: null, topDimension: null };
  }
  const scores = records.map(scoreToNumeric);
  const avg = scores.reduce((s, x) => s + x, 0) / scores.length;

  // Trend: split chronologically (ascending) into two halves; compare averages
  const ordered = [...records].sort((a, b) => a.createdAt - b.createdAt);
  let trendDelta = 0;
  if (ordered.length >= 2) {
    const mid = Math.floor(ordered.length / 2);
    const older = ordered.slice(0, mid).map(scoreToNumeric);
    const recent = ordered.slice(mid).map(scoreToNumeric);
    const olderAvg = older.length ? older.reduce((s, x) => s + x, 0) / older.length : 0;
    const recentAvg = recent.length ? recent.reduce((s, x) => s + x, 0) / recent.length : 0;
    trendDelta = recentAvg - olderAvg;
  }

  // Best record
  const best = records.reduce((acc, r) => {
    const rank = SCORE_RANK[r.result.score] ?? 0;
    const accRank = acc ? SCORE_RANK[acc.result.score] ?? 0 : -1;
    if (rank > accRank || (rank === accRank && r.createdAt > (acc?.createdAt ?? 0))) {
      return r;
    }
    return acc;
  }, null as HistoryRecord | null);

  // Top dimension across records that have radarScores
  const dimSums: Record<string, { sum: number; n: number }> = {};
  for (const r of records) {
    const rs = r.result.radarScores;
    if (!rs) continue;
    for (const key of Object.keys(DIM_LABELS)) {
      const v = (rs as Record<string, number>)[key];
      if (typeof v === 'number') {
        dimSums[key] ??= { sum: 0, n: 0 };
        dimSums[key].sum += v;
        dimSums[key].n += 1;
      }
    }
  }
  let topDimension: DashStats['topDimension'] = null;
  for (const [key, { sum, n }] of Object.entries(dimSums)) {
    if (n === 0) continue;
    const avgD = sum / n;
    if (!topDimension || avgD > topDimension.avg) {
      topDimension = { key, label: DIM_LABELS[key], avg: avgD };
    }
  }

  return {
    total: records.length,
    avg,
    trendDelta,
    best: best ? { grade: best.result.score, date: best.createdAt } : null,
    topDimension,
  };
};

// ============== Sub-components ==============

const Pill: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}> = ({ active, onClick, children, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={ariaLabel}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all touch-manipulation',
      'border',
      active
        ? 'bg-nnu-green text-white border-nnu-green shadow-[0_2px_8px_-3px_rgba(31,106,82,0.45)]'
        : 'bg-white/70 text-nnu-ink/70 border-nnu-mist hover:border-nnu-sage/40 hover:text-nnu-ink',
    )}
  >
    {children}
  </button>
);

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) {
    return <div className="h-7 w-full" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const StatsHero: React.FC<{ stats: DashStats; sparklineValues: number[] }> = ({
  stats,
  sparklineValues,
}) => {
  const trendIcon =
    stats.trendDelta > 0.5 ? (
      <TrendUp weight="bold" className="w-4 h-4 text-emerald-600" />
    ) : stats.trendDelta < -0.5 ? (
      <TrendDown weight="bold" className="w-4 h-4 text-rose-500" />
    ) : (
      <Equals weight="bold" className="w-4 h-4 text-nnu-sage" />
    );
  const trendLabel =
    stats.trendDelta > 0.5
      ? `较前期 +${stats.trendDelta.toFixed(1)}`
      : stats.trendDelta < -0.5
        ? `较前期 ${stats.trendDelta.toFixed(1)}`
        : '稳定波动';

  return (
    <section
      aria-label="学习概况"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6"
    >
      {/* 累计评估 */}
      <BentoCard accent="mist" className="p-4">
        <BentoCardHeader
          icon={<ChartLineUp weight="duotone" className="w-5 h-5" />}
          eyebrow="累计评估"
          title=""
        />
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-serif text-3xl md:text-4xl font-black text-nnu-ink tabular-nums">
            {stats.total}
          </span>
          <span className="text-xs text-nnu-sage">次</span>
        </div>
        <div className="mt-2 text-nnu-green/70">
          <Sparkline values={sparklineValues} />
        </div>
      </BentoCard>

      {/* 平均分 */}
      <BentoCard accent="green" className="p-4">
        <BentoCardHeader
          icon={<Sparkle weight="duotone" className="w-5 h-5" />}
          eyebrow="平均得分"
          title=""
        />
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-serif text-3xl md:text-4xl font-black text-nnu-green tabular-nums">
            {stats.total === 0 ? '—' : stats.avg.toFixed(1)}
          </span>
          <span className="text-xs text-nnu-sage">/ 100</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-nnu-ink/70">
          {trendIcon}
          <span>{trendLabel}</span>
        </div>
      </BentoCard>

      {/* 最高等级 */}
      <BentoCard accent="gold" className="p-4">
        <BentoCardHeader
          icon={<Trophy weight="duotone" className="w-5 h-5" />}
          eyebrow="最佳成绩"
          title=""
        />
        <div className="mt-2 flex items-center gap-2">
          {stats.best ? (
            <>
              <Badge
                className={cn(
                  'text-2xl font-black px-3 py-1 rounded-lg',
                  getScoreColor(stats.best.grade),
                )}
                aria-label={`最高等级 ${stats.best.grade}`}
              >
                {stats.best.grade}
              </Badge>
              <div className="text-[11px] text-nnu-ink/60">
                <div className="text-nnu-sage">达成于</div>
                <div className="font-medium text-nnu-ink/80">{formatDay(stats.best.date)}</div>
              </div>
            </>
          ) : (
            <span className="text-2xl text-nnu-sage/60">—</span>
          )}
        </div>
      </BentoCard>

      {/* 维度强项 */}
      <BentoCard accent="sage" className="p-4">
        <BentoCardHeader
          icon={<Sparkle weight="duotone" className="w-5 h-5" />}
          eyebrow="维度强项"
          title=""
        />
        {stats.topDimension ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl font-bold text-nnu-ink">
                {stats.topDimension.label}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-nnu-mist rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-nnu-jade to-nnu-green rounded-full"
                  style={{ width: `${Math.min(100, stats.topDimension.avg)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-nnu-green tabular-nums">
                {stats.topDimension.avg.toFixed(0)}
              </span>
            </div>
          </>
        ) : (
          <div className="mt-2 text-xs text-nnu-sage">暂无维度数据</div>
        )}
      </BentoCard>
    </section>
  );
};

type SortKey = 'newest' | 'oldest' | 'scoreDesc' | 'scoreAsc';

const FilterBar: React.FC<{
  filterType: 'all' | EvaluationType;
  setFilterType: (v: 'all' | EvaluationType) => void;
  filterScore: 'all' | 'S' | 'A' | 'B' | 'C';
  setFilterScore: (v: 'all' | 'S' | 'A' | 'B' | 'C') => void;
  sortBy: SortKey;
  setSortBy: (v: SortKey) => void;
  searchText: string;
  setSearchText: (v: string) => void;
  shown: number;
  total: number;
}> = ({
  filterType,
  setFilterType,
  filterScore,
  setFilterScore,
  sortBy,
  setSortBy,
  searchText,
  setSearchText,
  shown,
  total,
}) => (
  <div className="rounded-2xl border border-nnu-mist bg-white/70 backdrop-blur-md p-3 md:p-4 mb-5 shadow-[0_2px_10px_-6px_rgba(31,42,38,0.06)]">
    <div className="flex flex-col gap-3">
      {/* Row 1: pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-nnu-sage mr-1">
          <FunnelSimple weight="bold" className="w-3.5 h-3.5" />
          类型
        </span>
        <Pill active={filterType === 'all'} onClick={() => setFilterType('all')}>
          全部
        </Pill>
        <Pill active={filterType === 'translation'} onClick={() => setFilterType('translation')}>
          <Translate weight="bold" className="w-3 h-3" />
          翻译
        </Pill>
        <Pill active={filterType === 'writing'} onClick={() => setFilterType('writing')}>
          <PencilLine weight="bold" className="w-3 h-3" />
          写作
        </Pill>

        <span className="hidden md:inline-block w-px h-5 bg-nnu-mist mx-2" />

        <span className="inline-flex items-center text-[11px] font-medium uppercase tracking-[0.12em] text-nnu-sage mr-1">
          等级
        </span>
        {(['all', 'S', 'A', 'B', 'C'] as const).map((g) => (
          <Pill key={g} active={filterScore === g} onClick={() => setFilterScore(g)}>
            {g === 'all' ? '全部' : g}
          </Pill>
        ))}
      </div>

      {/* Row 2: search + sort + count */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nnu-sage pointer-events-none"
          />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索题目或答案…"
            className="w-full h-9 pl-9 pr-3 rounded-full text-xs bg-white border border-nnu-mist focus:border-nnu-green focus:ring-2 focus:ring-nnu-green/15 outline-none text-nnu-ink placeholder:text-nnu-sage/70"
            aria-label="搜索历史记录"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          aria-label="排序方式"
          className="h-9 px-3 pr-8 rounded-full text-xs bg-white border border-nnu-mist focus:border-nnu-green focus:ring-2 focus:ring-nnu-green/15 outline-none text-nnu-ink"
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="scoreDesc">分数高 → 低</option>
          <option value="scoreAsc">分数低 → 高</option>
        </select>

        <div className="ml-auto text-[11px] text-nnu-sage tabular-nums">
          显示 <span className="font-semibold text-nnu-ink">{shown}</span> / 共{' '}
          <span className="font-semibold text-nnu-ink">{total}</span> 条
        </div>
      </div>
    </div>
  </div>
);

const DimensionMiniBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <div className="flex items-baseline justify-between gap-1">
      <span className="text-[10px] text-nnu-sage uppercase tracking-wider truncate">{label}</span>
      <span className="text-[11px] font-semibold text-nnu-ink/80 tabular-nums">{Math.round(value)}</span>
    </div>
    <div className="h-1.5 w-full bg-nnu-mist rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-nnu-jade to-nnu-green rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

const HistoryCard: React.FC<{
  record: HistoryRecord;
  onView: () => void;
  onDelete: () => void;
}> = ({ record, onView, onDelete }) => {
  const accent = ACCENT_FOR_SCORE[record.result.score] ?? 'mist';
  const numeric = scoreToNumeric(record);
  const radar = record.result.radarScores;
  const type = record.input.evaluationType;

  return (
    <BentoCard
      accent={accent}
      className="p-4 md:p-5"
      role="article"
      aria-label={`历史记录，评分${record.result.score}，${formatDate(record.createdAt)}`}
    >
      <div className="flex flex-col gap-4">
        {/* Top row: score badge + numeric + meta */}
        <div className="flex items-start gap-3">
          <Badge
            className={cn(
              'text-2xl md:text-3xl font-black w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl shrink-0',
              getScoreColor(record.result.score),
            )}
            aria-label={`评分等级 ${record.result.score}`}
          >
            {record.result.score}
          </Badge>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-baseline gap-1 text-xs font-semibold text-nnu-ink/80 tabular-nums">
                <span className="font-serif text-base md:text-lg">{numeric.toFixed(0)}</span>
                <span className="text-nnu-sage text-[10px]">/ 100</span>
              </span>
              {type ? (
                <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-white/80 border border-nnu-mist text-[10px] font-medium text-nnu-green">
                  {type === 'translation' ? (
                    <Translate weight="bold" className="w-3 h-3" />
                  ) : (
                    <PencilLine weight="bold" className="w-3 h-3" />
                  )}
                  {TYPE_LABEL[type]}
                </span>
              ) : null}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-medium',
                  record.result.isSemanticallyCorrect
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700',
                )}
              >
                {record.result.isSemanticallyCorrect ? '语义达标' : '待优化'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-nnu-sage">
              <CalendarBlank weight="bold" className="w-3 h-3" />
              <time dateTime={new Date(record.createdAt).toISOString()}>
                {formatDate(record.createdAt)}
              </time>
            </div>
          </div>
        </div>

        {/* Body: prompt + answer */}
        <div className="space-y-2.5">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-nnu-sage mb-0.5">
              题目
            </div>
            <p className="text-xs md:text-sm text-nnu-ink/65 line-clamp-2 leading-relaxed">
              {record.input.directions}
            </p>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-nnu-sage mb-0.5">
              答案
            </div>
            <p className="text-xs md:text-sm text-nnu-ink/85 font-medium line-clamp-2 leading-relaxed">
              {record.input.studentSentence}
            </p>
          </div>
        </div>

        {/* Dimension mini bars */}
        {radar ? (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-nnu-mist/60">
            {(Object.keys(DIM_LABELS) as Array<keyof typeof DIM_LABELS>).map((key) => (
              <DimensionMiniBar
                key={key}
                label={DIM_LABELS[key]}
                value={(radar as Record<string, number>)[key] ?? 0}
              />
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={onView}
            size="sm"
            variant="nnuGreen"
            className="rounded-full px-4 flex-1 md:flex-none touch-manipulation"
            aria-label="查看详情"
          >
            查看详情
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="ghost"
            className="rounded-full px-3 text-nnu-sage hover:text-rose-600 hover:bg-rose-50 touch-manipulation"
            aria-label="删除此记录"
          >
            <TrashSimple weight="bold" className="w-3.5 h-3.5" />
            删除
          </Button>
        </div>
      </div>
    </BentoCard>
  );
};

const HistoryDetail = ({
  record,
  onClose,
}: {
  record: HistoryRecord;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 bg-nnu-ink/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <Card className="bg-white/95 backdrop-blur-2xl border border-nnu-mist rounded-2xl shadow-[0_24px_60px_-20px_rgba(31,42,38,0.35)] w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <div className="flex justify-between items-start mb-6 gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-nnu-sage mb-1">
              Evaluation Detail
            </div>
            <h2
              id="history-detail-title"
              className="font-serif text-2xl md:text-3xl font-bold text-nnu-ink mb-1"
            >
              评估详情
            </h2>
            <p className="text-sm text-nnu-sage">
              <time dateTime={new Date(record.createdAt).toISOString()}>
                {formatDate(record.createdAt)}
              </time>
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full border-nnu-mist text-nnu-ink/70 hover:bg-nnu-mist touch-manipulation shrink-0"
            aria-label="关闭详情对话框"
          >
            关闭
          </Button>
        </div>

        {/* 评估结果概览 */}
        <section
          aria-labelledby="result-summary"
          className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-nnu-mist/40 border border-nnu-mist"
        >
          <Badge
            className={cn('text-3xl font-black w-16 h-16 flex items-center justify-center rounded-xl', getScoreColor(record.result.score))}
            role="status"
            aria-label={`评分等级 ${record.result.score}`}
          >
            {record.result.score}
          </Badge>
          <div className="flex-1">
            <h3 id="result-summary" className="font-serif text-lg font-bold text-nnu-ink">
              评估结果
            </h3>
            <p className="text-sm text-nnu-ink/65">
              {record.result.isSemanticallyCorrect ? '✓ 语义正确' : '✗ 需要改进'}
            </p>
          </div>
          {typeof record.result.numericScore === 'number' ? (
            <div className="text-right">
              <div className="font-serif text-3xl font-black text-nnu-green tabular-nums">
                {record.result.numericScore}
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-nnu-sage">分 / 100</div>
            </div>
          ) : null}
        </section>

        {/* 原始输入 */}
        <section aria-labelledby="original-input" className="space-y-4 mb-6">
          <h3 id="original-input" className="sr-only">
            原始输入
          </h3>
          <div>
            <h4 className="font-medium text-nnu-green mb-2">题目要求</h4>
            <p className="text-nnu-ink/85 bg-nnu-mist/30 border border-nnu-mist rounded-lg p-3">
              {record.input.directions}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-nnu-green mb-2">文章语境</h4>
            <p className="text-nnu-ink/85 bg-nnu-mist/30 border border-nnu-mist rounded-lg p-3 whitespace-pre-wrap">
              {record.input.essayContext}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-nnu-green mb-2">你的答案</h4>
            <p className="text-nnu-ink bg-nnu-cream/60 border border-nnu-cream rounded-lg p-3 font-medium">
              {record.input.studentSentence}
            </p>
          </div>
        </section>

        {/* 评估反馈 */}
        <section aria-labelledby="feedback-section" className="space-y-4 mb-6">
          <h3 id="feedback-section" className="sr-only">
            评估反馈
          </h3>
          <div>
            <h4 className="font-medium text-nnu-green mb-2">详细分析</h4>
            <p className="text-nnu-ink/85 leading-relaxed bg-nnu-mist/30 border border-nnu-mist rounded-lg p-3">
              {record.result.analysis}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-nnu-green mb-2">润色建议</h4>
            <p className="text-nnu-ink/85 italic bg-nnu-paper border border-nnu-cream rounded-lg p-3">
              {record.result.polishedVersion}
            </p>
          </div>
        </section>

        {/* 雷达图（如果有） */}
        {record.result.radarScores && (
          <section aria-labelledby="radar-section">
            <h4 id="radar-section" className="font-medium text-nnu-green mb-4">
              多维度评分
            </h4>
            <div className="flex justify-center">
              <RadarChart scores={record.result.radarScores} size="lg" />
            </div>
          </section>
        )}
      </Card>
    </div>
  );
};

const EmptyState = () => (
  <BentoCard accent="cream" className="p-10 md:p-14 text-center">
    <div
      className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-white/70 border border-nnu-mist flex items-center justify-center text-nnu-green"
      role="img"
      aria-label="书本图标"
    >
      <BookOpen weight="duotone" className="w-8 h-8" />
    </div>
    <h3 className="font-serif text-xl md:text-2xl font-bold text-nnu-ink mb-2">暂无历史记录</h3>
    <p className="text-sm text-nnu-ink/65 mb-6">完成评估后，记录会自动保存在这里</p>
    <Button
      onClick={() => (window.location.href = '/evaluate')}
      variant="nnu"
      className="rounded-full px-6 shadow-[0_4px_18px_-6px_rgba(255,127,80,0.5)]"
      aria-label="开始评估"
    >
      开始评估
    </Button>
  </BentoCard>
);

// ============== Main Page ==============

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [filterType, setFilterType] = useState<'all' | EvaluationType>('all');
  const [filterScore, setFilterScore] = useState<'all' | 'S' | 'A' | 'B' | 'C'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = getHistory();
        setRecords(history.records);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const stats = useMemo(() => computeStats(records), [records]);

  const sparklineValues = useMemo(() => {
    return [...records]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(scoreToNumeric);
  }, [records]);

  const trendData = useMemo(() => {
    return [...records]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((r, i) => ({
        date: r.createdAt,
        score: Math.round(scoreToNumeric(r)),
        grade: r.result.score,
        index: i + 1,
      }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let list = records.filter((r) => {
      if (filterType !== 'all' && r.input.evaluationType !== filterType) return false;
      if (filterScore !== 'all' && r.result.score !== filterScore) return false;
      if (q) {
        const hay = `${r.input.directions}\n${r.input.studentSentence}\n${r.input.essayContext}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (sortBy) {
      case 'newest':
        list = list.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        list = list.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'scoreDesc':
        list = list.sort((a, b) => scoreToNumeric(b) - scoreToNumeric(a));
        break;
      case 'scoreAsc':
        list = list.sort((a, b) => scoreToNumeric(a) - scoreToNumeric(b));
        break;
    }
    return list;
  }, [records, filterType, filterScore, sortBy, searchText]);

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      const success = clearHistory();
      if (success) {
        setRecords([]);
      } else {
        alert('清空历史记录失败，请重试');
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      const success = deleteHistoryRecord(id);
      if (success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('删除记录失败，请重试');
      }
    }
  };

  const handleView = (record: HistoryRecord) => setSelectedRecord(record);
  const handleCloseDetail = () => setSelectedRecord(null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="space-y-4">
          <HistoryListItemSkeleton />
          <HistoryListItemSkeleton />
          <HistoryListItemSkeleton />
        </div>
      </div>
    );
  }

  const hasRecords = records.length > 0;

  return (
    <main className="min-h-screen bg-nnu-cream">
      {/* Soft hero halo */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-nnu-mist/50 rounded-full blur-[100px] pointer-events-none"
        />
        <div className="container mx-auto px-4 pt-24 pb-10 relative z-10">
          {/* Page header */}
          <header className="flex flex-wrap justify-between items-end gap-4 mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] mb-3 bg-white/70 backdrop-blur-md border border-nnu-mist text-nnu-sage">
                <ChartLineUp weight="fill" className="w-3.5 h-3.5 text-nnu-green" />
                <span className="font-medium">学习仪表盘 · v2</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-black text-nnu-ink mb-2 tracking-tight">
                历史记录
              </h1>
              <p className="text-sm text-nnu-ink/65" role="status" aria-live="polite">
                {hasRecords ? `共 ${records.length} 条记录` : '暂无记录'}
              </p>
            </div>
            {hasRecords && (
              <Button
                onClick={handleClearAll}
                variant="ghost"
                className="rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100"
                aria-label="清空所有历史记录"
              >
                <TrashSimple weight="bold" className="w-4 h-4" />
                清空所有记录
              </Button>
            )}
          </header>

          {!hasRecords ? (
            <EmptyState />
          ) : (
            <>
              {/* Stats */}
              <StatsHero stats={stats} sparklineValues={sparklineValues} />

              {/* Trend */}
              <BentoCard accent="green" className="p-4 md:p-5 mb-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-nnu-sage mb-0.5">
                      Score Trend
                    </div>
                    <h2 className="font-serif text-lg md:text-xl font-bold text-nnu-ink">得分趋势</h2>
                  </div>
                  <div className="text-[11px] text-nnu-sage hidden md:block">
                    最近 {trendData.length} 次评估
                  </div>
                </div>
                {trendData.length >= 2 ? (
                  <ScoreTrendChart data={trendData} />
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-sm text-nnu-sage">
                    再做一次评估即可看到趋势曲线
                  </div>
                )}
              </BentoCard>

              {/* Filters */}
              <FilterBar
                filterType={filterType}
                setFilterType={setFilterType}
                filterScore={filterScore}
                setFilterScore={setFilterScore}
                sortBy={sortBy}
                setSortBy={setSortBy}
                searchText={searchText}
                setSearchText={setSearchText}
                shown={filteredRecords.length}
                total={records.length}
              />

              {/* List */}
              <section aria-label="历史记录列表">
                {filteredRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-nnu-mist bg-white/40 px-6 py-12 text-center">
                    <div className="text-sm text-nnu-sage">没有匹配的记录</div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterType('all');
                        setFilterScore('all');
                        setSearchText('');
                      }}
                      className="mt-2 text-xs font-medium text-nnu-green hover:underline"
                    >
                      清除筛选条件
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
                    {filteredRecords.map((record) => (
                      <HistoryCard
                        key={record.id}
                        record={record}
                        onView={() => handleView(record)}
                        onDelete={() => handleDelete(record.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {selectedRecord && (
            <HistoryDetail record={selectedRecord} onClose={handleCloseDetail} />
          )}
        </div>
      </div>
    </main>
  );
}
