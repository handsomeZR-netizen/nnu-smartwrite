'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimeOfDayChartProps {
  buckets: number[]; // length 24
}

const PERIOD_FOR_HOUR = (h: number): { label: string; color: string } => {
  if (h >= 5 && h < 11) return { label: '上午', color: '#5DB090' };
  if (h >= 11 && h < 14) return { label: '中午', color: '#F4B860' };
  if (h >= 14 && h < 18) return { label: '下午', color: '#1F6A52' };
  if (h >= 18 && h < 22) return { label: '傍晚', color: '#FF7F50' };
  return { label: '深夜', color: '#8FA89B' };
};

export const TimeOfDayChart: React.FC<TimeOfDayChartProps> = ({ buckets }) => {
  const max = Math.max(1, ...buckets);
  const total = buckets.reduce((s, x) => s + x, 0);
  const peakHour = buckets.indexOf(Math.max(...buckets));
  const peakPeriod = PERIOD_FOR_HOUR(peakHour);

  return (
    <div className="w-full" data-testid="time-of-day-chart">
      <div className="flex items-end gap-[3px] h-[120px]">
        {buckets.map((count, h) => {
          const { color } = PERIOD_FOR_HOUR(h);
          const heightPct = (count / max) * 100;
          return (
            <div
              key={h}
              className="flex-1 flex flex-col items-center justify-end gap-1 group relative"
              title={`${String(h).padStart(2, '0')}:00 — ${count} 次`}
            >
              <div
                className={cn(
                  'w-full rounded-t-sm transition-all',
                  count === 0 && 'bg-nnu-mist/60',
                )}
                style={{
                  height: `${Math.max(heightPct, count > 0 ? 8 : 4)}%`,
                  background: count > 0 ? color : undefined,
                  opacity: count > 0 ? 0.85 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Hour ticks */}
      <div className="flex items-center mt-1.5">
        {[0, 6, 12, 18, 23].map((h) => (
          <div
            key={h}
            className="text-[10px] text-nnu-sage tabular-nums"
            style={{ width: h === 23 ? 'auto' : `${(h === 0 ? 0 : ((h - 0) / 23) * 100) - (h === 0 ? 0 : ((h === 6 ? 6 : h) / 23) * 100 * 0)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-nnu-sage tabular-nums mt-1 px-0.5">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-nnu-mist/60 flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <div className="text-nnu-sage">
          高峰时段{' '}
          <span className="font-semibold text-nnu-ink">
            {String(peakHour).padStart(2, '0')}:00
          </span>{' '}
          <span className="ml-1 inline-flex items-center px-1.5 h-4 rounded-full text-[10px] font-medium" style={{ background: `${peakPeriod.color}20`, color: peakPeriod.color }}>
            {peakPeriod.label}
          </span>
        </div>
        <div className="text-nnu-sage">
          共 <span className="font-semibold text-nnu-ink">{total}</span> 次
        </div>
      </div>
    </div>
  );
};

export default TimeOfDayChart;
