'use client';

import * as React from 'react';
import {
  Flag,
  Crown,
  Flame,
  Books,
  Translate,
  PencilLine,
  Target,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';
import type { Achievement } from './compute-insights';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  first: Flag,
  sLevel: Crown,
  streak: Flame,
  volume: Books,
  translation: Translate,
  writing: PencilLine,
  dimension: Target,
  comeback: CheckCircle,
} as const;

const ICON_COLOR: Record<Achievement['icon'], string> = {
  first: 'text-emerald-600',
  sLevel: 'text-amber-500',
  streak: 'text-orange-500',
  volume: 'text-sky-600',
  translation: 'text-nnu-green',
  writing: 'text-rose-500',
  dimension: 'text-violet-600',
  comeback: 'text-teal-600',
};

const formatUnlocked = (ts?: number): string | null => {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export interface AchievementWallProps {
  achievements: Achievement[];
}

export const AchievementWall: React.FC<AchievementWallProps> = ({ achievements }) => {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div className="w-full" data-testid="achievement-wall">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {achievements.map((a) => {
          const Icon = ICON_MAP[a.icon] ?? Flag;
          return (
            <div
              key={a.id}
              className={cn(
                'rounded-xl border p-2.5 text-center transition-all',
                a.unlocked
                  ? 'bg-white/80 border-nnu-mist hover:-translate-y-0.5 hover:shadow-sm'
                  : 'bg-nnu-mist/40 border-nnu-mist/60 grayscale opacity-55',
              )}
              title={a.unlocked ? `${a.title} · 已解锁` : `${a.title} · 未解锁`}
            >
              <div
                className={cn(
                  'mx-auto w-9 h-9 rounded-full flex items-center justify-center mb-1.5',
                  a.unlocked ? 'bg-nnu-mist/70' : 'bg-white/60',
                )}
              >
                <Icon
                  weight={a.unlocked ? 'duotone' : 'regular'}
                  className={cn('w-5 h-5', a.unlocked ? ICON_COLOR[a.icon] : 'text-nnu-sage/60')}
                />
              </div>
              <div className="text-[11px] font-semibold text-nnu-ink leading-tight">{a.title}</div>
              <div className="text-[9px] text-nnu-sage mt-0.5 leading-snug">{a.desc}</div>
              {a.unlocked && a.unlockedAt ? (
                <div className="text-[9px] text-nnu-green mt-1 tabular-nums">
                  {formatUnlocked(a.unlockedAt)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-nnu-mist/60 flex items-center justify-between text-[11px]">
        <span className="text-nnu-sage">
          已解锁 <span className="font-semibold text-nnu-ink">{unlocked}</span> /{' '}
          {achievements.length}
        </span>
        <div className="flex-1 ml-3 h-1.5 bg-nnu-mist rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-nnu-jade to-nnu-green rounded-full transition-all"
            style={{ width: `${(unlocked / achievements.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AchievementWall;
