'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ScoreTrendPoint {
  date: number;
  score: number;
  grade: string;
  index: number;
}

export interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
  height?: number;
}

const formatTick = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const TrendTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: ScoreTrendPoint }> }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const d = new Date(p.date);
  const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate(),
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return (
    <div className="rounded-xl border border-nnu-mist bg-white/90 backdrop-blur-md px-3 py-2 shadow-[0_8px_24px_-12px_rgba(31,42,38,0.18)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-nnu-sage">第 {p.index} 次</div>
      <div className="mt-0.5 text-xs text-nnu-ink/70">{dateStr}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-serif text-2xl font-bold text-nnu-green">{p.score}</span>
        <span className="text-xs text-nnu-ink/60">/ 100</span>
        <span className="ml-auto rounded-md bg-nnu-mist px-1.5 py-0.5 text-[10px] font-semibold text-nnu-green">
          {p.grade}
        </span>
      </div>
    </div>
  );
};

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ data, height = 220 }) => {
  return (
    <div className="w-full relative" data-testid="score-trend-chart">
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F6A52" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#E8EFE9" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#E8EFE9" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            tick={{ fill: '#8FA89B', fontSize: 11 }}
            axisLine={{ stroke: '#E8EFE9' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: '#8FA89B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#5DB090', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#1F6A52"
            strokeWidth={2.5}
            fill="url(#trendGradient)"
            dot={{ r: 4, fill: '#1F6A52', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#5DB090', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreTrendChart;
