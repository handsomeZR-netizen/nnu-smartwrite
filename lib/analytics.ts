import type { HistoryRecord, RadarDimensions } from "./types";

export interface GrowthPoint {
  index: number;
  label: string;
  scoreValue: number;
  grade: "S" | "A" | "B" | "C";
  createdAt: number;
}

export interface DimensionAverage {
  key: string;
  label: string;
  average: number;
}

const GRADE_TO_VALUE: Record<"S" | "A" | "B" | "C", number> = {
  S: 95,
  A: 85,
  B: 75,
  C: 60,
};

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
};

export const buildGrowthSeries = (records: HistoryRecord[]): GrowthPoint[] => {
  const ordered = [...records].sort((a, b) => a.createdAt - b.createdAt);
  return ordered.map((r, i) => ({
    index: i + 1,
    label: formatDate(r.createdAt),
    scoreValue: GRADE_TO_VALUE[r.result.score] ?? 70,
    grade: r.result.score,
    createdAt: r.createdAt,
  }));
};

const collectDimensions = (
  record: HistoryRecord,
): Array<{ key: string; label: string; value: number }> => {
  const out: Array<{ key: string; label: string; value: number }> = [];
  const radar = record.result.radarScores;
  if (radar) {
    out.push(
      { key: "vocabulary", label: "词汇 Vocabulary", value: radar.vocabulary },
      { key: "grammar", label: "语法 Grammar", value: radar.grammar },
      { key: "coherence", label: "连贯 Coherence", value: radar.coherence },
      { key: "structure", label: "结构 Structure", value: radar.structure },
    );
  }
  const dims = record.result.radarDimensions as RadarDimensions | undefined;
  if (dims) {
    for (let i = 0; i < 4; i++) {
      const label = dims.labels?.[i] ?? `维度 ${i + 1}`;
      const value = [dims.dim1, dims.dim2, dims.dim3, dims.dim4][i];
      out.push({ key: label.toLowerCase(), label, value });
    }
  }
  return out;
};

export const computeDimensionAverages = (
  records: HistoryRecord[],
): DimensionAverage[] => {
  const buckets = new Map<string, { label: string; sum: number; count: number }>();
  for (const r of records) {
    for (const d of collectDimensions(r)) {
      const existing = buckets.get(d.key);
      if (existing) {
        existing.sum += d.value;
        existing.count += 1;
      } else {
        buckets.set(d.key, { label: d.label, sum: d.value, count: 1 });
      }
    }
  }
  return [...buckets.entries()]
    .map(([key, v]) => ({ key, label: v.label, average: Math.round(v.sum / v.count) }))
    .sort((a, b) => a.average - b.average);
};

const WEAK_KEYWORDS: Record<string, string[]> = {
  vocabulary: ["词汇", "Vocabulary", "用词", "丰富"],
  grammar: ["语法", "Grammar", "规范", "Accuracy"],
  coherence: ["连贯", "Coherence", "Fluency", "通顺"],
  structure: ["结构", "Structure", "Syntax", "句法"],
  relevance: ["切题", "Relevance", "准确"],
};

export const matchPracticeTags = (weakLabel: string): string[] => {
  const out: string[] = [];
  for (const [tag, keywords] of Object.entries(WEAK_KEYWORDS)) {
    if (keywords.some((k) => weakLabel.includes(k))) out.push(tag);
  }
  return out;
};
