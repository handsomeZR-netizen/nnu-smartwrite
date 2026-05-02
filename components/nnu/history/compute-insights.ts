import type { HistoryRecord } from '@/lib/types';

const DAY_MS = 86_400_000;

export const dayKey = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDay: number | null;
}

export const computeStreak = (records: HistoryRecord[]): StreakInfo => {
  if (records.length === 0) return { current: 0, longest: 0, lastActiveDay: null };
  const days = new Set<string>();
  let last = 0;
  for (const r of records) {
    const k = dayKey(r.createdAt);
    days.add(k);
    if (r.createdAt > last) last = r.createdAt;
  }
  const sorted = Array.from(days)
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d).getTime();
    })
    .sort((a, b) => b - a);

  // Longest streak (scan ascending diffs)
  const asc = [...sorted].reverse();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < asc.length; i++) {
    if (asc[i] - asc[i - 1] === DAY_MS) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: consecutive days back from today (or yesterday if today empty)
  const today = startOfDay(Date.now());
  let current = 0;
  let cursor = today;
  if (!sorted.includes(cursor)) cursor -= DAY_MS;
  while (sorted.includes(cursor)) {
    current += 1;
    cursor -= DAY_MS;
  }

  return { current, longest, lastActiveDay: last };
};

export interface HeatmapCell {
  ts: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export const buildHeatmap = (records: HistoryRecord[], days = 182): HeatmapCell[] => {
  const counts = new Map<number, number>();
  for (const r of records) {
    const k = startOfDay(r.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = startOfDay(Date.now());
  const cells: HeatmapCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = today - i * DAY_MS;
    const count = counts.get(ts) ?? 0;
    let level: HeatmapCell['level'] = 0;
    if (count >= 4) level = 4;
    else if (count === 3) level = 3;
    else if (count === 2) level = 2;
    else if (count === 1) level = 1;
    cells.push({ ts, count, level });
  }
  return cells;
};

export interface TypeBreakdown {
  type: 'translation' | 'writing' | 'unknown';
  label: string;
  count: number;
  avg: number;
}

const TYPE_LABEL: Record<string, string> = {
  translation: '翻译',
  writing: '写作',
  unknown: '未分类',
};

const SCORE_FALLBACK: Record<string, number> = { S: 95, A: 85, B: 75, C: 65 };
const numericOf = (r: HistoryRecord): number =>
  typeof r.result.numericScore === 'number'
    ? r.result.numericScore
    : SCORE_FALLBACK[r.result.score] ?? 70;

export const computeTypeBreakdown = (records: HistoryRecord[]): TypeBreakdown[] => {
  const groups = new Map<string, HistoryRecord[]>();
  for (const r of records) {
    const t = r.input.evaluationType ?? 'unknown';
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(r);
  }
  return Array.from(groups.entries()).map(([type, list]) => {
    const avg = list.reduce((s, r) => s + numericOf(r), 0) / list.length;
    return {
      type: type as TypeBreakdown['type'],
      label: TYPE_LABEL[type] ?? type,
      count: list.length,
      avg,
    };
  });
};

export const computeHourBuckets = (records: HistoryRecord[]): number[] => {
  const buckets = new Array(24).fill(0);
  for (const r of records) {
    const h = new Date(r.createdAt).getHours();
    buckets[h] += 1;
  }
  return buckets;
};

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','then','else','for','of','to','in','on','at','by','with',
  'is','are','was','were','be','been','being','am','i','you','he','she','it','we','they','them',
  'this','that','these','those','my','your','his','her','its','our','their','as','from','into',
  'about','over','under','out','up','down','off','can','could','should','would','will','shall',
  'do','does','did','done','have','has','had','not','no','yes','so','too','very','just','than',
  'also','only','any','all','some','more','most','one','two','three','because','what','when',
  'where','who','why','how','which','one','via','de','le','la','et','un','une',
  'translate','following','chinese','passage','english','sample','directions','answer',
  'try','use','please','write','word','words','sentence','sentences','essay','context',
]);

export interface WordItem {
  word: string;
  count: number;
}

export const computeTopWords = (records: HistoryRecord[], limit = 30): WordItem[] => {
  const counts = new Map<string, number>();
  for (const r of records) {
    const text = `${r.input.directions ?? ''} ${r.input.studentSentence ?? ''}`.toLowerCase();
    const matches = text.match(/[a-z]{3,}/g);
    if (!matches) continue;
    for (const w of matches) {
      if (STOP_WORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: 'first' | 'sLevel' | 'streak' | 'volume' | 'translation' | 'writing' | 'dimension' | 'comeback';
  unlockedAt?: number;
}

export const computeAchievements = (records: HistoryRecord[]): Achievement[] => {
  const total = records.length;
  const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
  const firstS = sorted.find((r) => r.result.score === 'S');
  const aOrAbove = records.filter((r) => r.result.score === 'S' || r.result.score === 'A').length;
  const translation = records.filter((r) => r.input.evaluationType === 'translation').length;
  const writing = records.filter((r) => r.input.evaluationType === 'writing').length;
  const streak = computeStreak(records);
  const hasPerfectDim = records.some((r) => {
    const rs = r.result.radarScores;
    if (!rs) return false;
    return Object.values(rs).some((v) => v >= 95);
  });

  return [
    {
      id: 'first-step',
      title: '初次启程',
      desc: '完成第一次评估',
      unlocked: total >= 1,
      icon: 'first',
      unlockedAt: sorted[0]?.createdAt,
    },
    {
      id: 's-grade',
      title: 'S 级写手',
      desc: '获得一次 S 评级',
      unlocked: !!firstS,
      icon: 'sLevel',
      unlockedAt: firstS?.createdAt,
    },
    {
      id: 'streak-3',
      title: '连续打卡',
      desc: '连续 3 天有评估',
      unlocked: streak.longest >= 3,
      icon: 'streak',
    },
    {
      id: 'volume-5',
      title: '勤学不辍',
      desc: '累计完成 5 次评估',
      unlocked: total >= 5,
      icon: 'volume',
    },
    {
      id: 'a-trio',
      title: 'A 类常客',
      desc: '取得 3 次 A 及以上',
      unlocked: aOrAbove >= 3,
      icon: 'sLevel',
    },
    {
      id: 'translator',
      title: '译笔生花',
      desc: '完成 3 次翻译题',
      unlocked: translation >= 3,
      icon: 'translation',
    },
    {
      id: 'writer',
      title: '执笔成文',
      desc: '完成 3 次写作题',
      unlocked: writing >= 3,
      icon: 'writing',
    },
    {
      id: 'dim-perfect',
      title: '满维突破',
      desc: '单维度得分 ≥ 95',
      unlocked: hasPerfectDim,
      icon: 'dimension',
    },
  ];
};

export const computeRadarAverage = (records: HistoryRecord[]) => {
  const sums = { vocabulary: 0, grammar: 0, coherence: 0, structure: 0 };
  let n = 0;
  for (const r of records) {
    const rs = r.result.radarScores;
    if (!rs) continue;
    sums.vocabulary += rs.vocabulary;
    sums.grammar += rs.grammar;
    sums.coherence += rs.coherence;
    sums.structure += rs.structure;
    n += 1;
  }
  if (n === 0) return null;
  return {
    vocabulary: sums.vocabulary / n,
    grammar: sums.grammar / n,
    coherence: sums.coherence / n,
    structure: sums.structure / n,
  };
};
