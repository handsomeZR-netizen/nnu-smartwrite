'use client';

import * as React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TypeBreakdown } from './compute-insights';

const COLOR_FOR_TYPE: Record<string, string> = {
  translation: '#1F6A52',
  writing: '#F4B860',
  unknown: '#8FA89B',
};

const Legend: React.FC<{ data: TypeBreakdown[] }> = ({ data }) => (
  <div className="flex flex-col gap-2 text-xs">
    {data.map((d) => (
      <div key={d.type} className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ background: COLOR_FOR_TYPE[d.type] ?? '#8FA89B' }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-nnu-ink font-medium">{d.label}</div>
          <div className="text-nnu-sage text-[10px]">
            {d.count} 次 · 均分 {d.avg.toFixed(1)}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DonutTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: TypeBreakdown }> }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-white/95 backdrop-blur-md border border-nnu-mist px-2.5 py-1.5 shadow-md text-xs">
      <div className="font-semibold text-nnu-ink">{p.label}</div>
      <div className="text-nnu-sage text-[10px]">
        {p.count} 次 · 均分 {p.avg.toFixed(1)}
      </div>
    </div>
  );
};

export interface TypeDonutProps {
  data: TypeBreakdown[];
  total: number;
}

export const TypeDonut: React.FC<TypeDonutProps> = ({ data, total }) => {
  if (data.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-nnu-sage">
        暂无类型数据
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center" data-testid="type-donut">
      <div className="relative h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              innerRadius={42}
              outerRadius={64}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.type} fill={COLOR_FOR_TYPE[d.type] ?? '#8FA89B'} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-serif text-2xl font-black text-nnu-ink tabular-nums">{total}</span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-nnu-sage">条记录</span>
        </div>
      </div>
      <Legend data={data} />
    </div>
  );
};

export default TypeDonut;
