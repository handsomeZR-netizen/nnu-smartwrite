'use client';

import * as React from 'react';
import type { WordItem } from './compute-insights';

const COLORS = ['#1F6A52', '#5DB090', '#8FA89B', '#F4B860', '#FF7F50'];

export interface WordCloudProps {
  words: WordItem[];
}

export const WordCloud: React.FC<WordCloudProps> = ({ words }) => {
  if (words.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-nnu-sage">
        暂无可分析的英文文本
      </div>
    );
  }
  const max = words[0].count;
  const min = words[words.length - 1].count;
  const span = Math.max(1, max - min);

  return (
    <div className="w-full" data-testid="word-cloud">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 min-h-[140px] py-2">
        {words.map((w, i) => {
          const ratio = (w.count - min) / span;
          const fontSize = 10 + ratio * 18; // 10px → 28px
          const opacity = 0.55 + ratio * 0.45;
          const color = COLORS[i % COLORS.length];
          return (
            <span
              key={w.word}
              title={`${w.word} · ${w.count} 次`}
              className="font-medium leading-tight transition-transform hover:scale-110 cursor-default"
              style={{ fontSize: `${fontSize}px`, color, opacity }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-nnu-mist/60 text-[11px] text-nnu-sage text-center">
        共 <span className="font-semibold text-nnu-ink">{words.length}</span> 个高频词
      </div>
    </div>
  );
};

export default WordCloud;
