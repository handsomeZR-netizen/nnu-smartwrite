'use client';

import * as React from 'react';
import type { HeatmapCell } from './compute-insights';
import { cn } from '@/lib/utils';

const LEVEL_BG: Record<HeatmapCell['level'], string> = {
  0: 'bg-nnu-mist/60',
  1: 'bg-emerald-200',
  2: 'bg-emerald-400',
  3: 'bg-emerald-600',
  4: 'bg-emerald-800',
};

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export interface HeatmapCalendarProps {
  cells: HeatmapCell[];
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ cells }) => {
  // Build columns of 7 (week start Sunday). Pad start so weeks align by weekday.
  const columns = React.useMemo(() => {
    if (cells.length === 0) return [] as Array<Array<HeatmapCell | null>>;
    const firstDow = new Date(cells[0].ts).getDay();
    const padded: Array<HeatmapCell | null> = [];
    for (let i = 0; i < firstDow; i++) padded.push(null);
    padded.push(...cells);
    const cols: Array<Array<HeatmapCell | null>> = [];
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7));
    }
    // Make sure last column has 7 slots
    const last = cols[cols.length - 1];
    while (last && last.length < 7) last.push(null);
    return cols;
  }, [cells]);

  // Month labels: emit the month name above the column whose first cell is day-of-month <= 7
  const monthLabels = React.useMemo(() => {
    const labels: Array<{ idx: number; label: string }> = [];
    let lastMonth = -1;
    columns.forEach((col, idx) => {
      const firstCell = col.find((c): c is HeatmapCell => c !== null);
      if (!firstCell) return;
      const d = new Date(firstCell.ts);
      if (d.getMonth() !== lastMonth && d.getDate() <= 7) {
        labels.push({ idx, label: `${d.getMonth() + 1}月` });
        lastMonth = d.getMonth();
      }
    });
    return labels;
  }, [columns]);

  const totalActiveDays = cells.filter((c) => c.count > 0).length;
  const totalEvals = cells.reduce((s, c) => s + c.count, 0);

  return (
    <div className="w-full" data-testid="heatmap-calendar">
      <div className="flex gap-2 items-start">
        {/* Weekday labels column */}
        <div className="flex flex-col gap-[3px] pt-[18px] shrink-0">
          {WEEKDAY_LABELS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'h-[12px] text-[9px] text-nnu-sage leading-[12px]',
                i % 2 === 0 ? '' : 'opacity-0',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels row */}
            <div className="relative h-[14px] mb-1">
              {monthLabels.map(({ idx, label }) => (
                <span
                  key={`${idx}-${label}`}
                  className="absolute text-[10px] text-nnu-sage"
                  style={{ left: `${idx * 15}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Cells grid */}
            <div className="flex gap-[3px]">
              {columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map((cell, ri) =>
                    cell ? (
                      <div
                        key={ri}
                        title={`${new Date(cell.ts).toLocaleDateString('zh-CN')}: ${cell.count} 次`}
                        className={cn(
                          'w-[12px] h-[12px] rounded-[3px] transition-colors',
                          LEVEL_BG[cell.level],
                        )}
                      />
                    ) : (
                      <div key={ri} className="w-[12px] h-[12px]" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend + summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-nnu-mist/60">
        <div className="text-[11px] text-nnu-sage">
          近 {cells.length} 天活跃 <span className="font-semibold text-nnu-ink">{totalActiveDays}</span>{' '}
          天 · 共 <span className="font-semibold text-nnu-ink">{totalEvals}</span> 次
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-nnu-sage">
          <span>少</span>
          {([0, 1, 2, 3, 4] as const).map((lv) => (
            <span key={lv} className={cn('w-[10px] h-[10px] rounded-[2px]', LEVEL_BG[lv])} />
          ))}
          <span>多</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapCalendar;
