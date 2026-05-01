import { describe, it, expect } from 'bun:test';
import {
  EvaluationResultSchema,
  IssueSpanSchema,
  SentenceAnnotationSchema,
  type IssueSpan,
  type SentenceAnnotation,
  type EvaluationResult,
} from './types';

/**
 * lib/types.ts 类型与 schema 测试
 *
 * 覆盖：
 * - IssueSpanSchema 校验 span 半开区间
 * - SentenceAnnotationSchema 校验 sentenceIndex / issues ≤ 3
 * - EvaluationResultSchema 接收 numericScore / sentenceAnnotations
 *   且保持向后兼容（旧字段必填，不传新字段也能通过）
 */

describe('IssueSpanSchema', () => {
  it('accepts a valid issue', () => {
    const issue: IssueSpan = {
      type: 'spelling',
      span: [2, 5],
      message: '应为 "will"',
      suggestion: 'will',
    };
    expect(IssueSpanSchema.safeParse(issue).success).toBe(true);
  });

  it('rejects span where start >= end', () => {
    const issue = {
      type: 'spelling',
      span: [5, 5],
      message: 'empty span',
    };
    expect(IssueSpanSchema.safeParse(issue).success).toBe(false);
  });

  it('rejects negative start', () => {
    const issue = {
      type: 'spelling',
      span: [-1, 3],
      message: 'bad start',
    };
    expect(IssueSpanSchema.safeParse(issue).success).toBe(false);
  });

  it('rejects unknown type', () => {
    const issue = {
      type: 'unknown',
      span: [0, 3],
      message: 'bad type',
    };
    expect(IssueSpanSchema.safeParse(issue).success).toBe(false);
  });

  it('accepts all five known types', () => {
    for (const t of ['grammar', 'spelling', 'vocab', 'style', 'logic'] as const) {
      const ok = IssueSpanSchema.safeParse({
        type: t,
        span: [0, 1],
        message: 'm',
      });
      expect(ok.success).toBe(true);
    }
  });
});

describe('SentenceAnnotationSchema', () => {
  it('accepts a sentence with up to 3 issues', () => {
    const ann: SentenceAnnotation = {
      sentenceIndex: 0,
      text: 'I wil go to school tomorrow.',
      issues: [
        { type: 'spelling', span: [2, 5], message: '应为 "will"' },
        { type: 'grammar', span: [6, 8], message: '时态' },
        { type: 'logic', span: [10, 14], message: '衔接' },
      ],
      comment: '整体注意将来时。',
    };
    expect(SentenceAnnotationSchema.safeParse(ann).success).toBe(true);
  });

  it('rejects > 3 issues per sentence', () => {
    const ann = {
      sentenceIndex: 0,
      text: 'abcdefg',
      issues: [
        { type: 'spelling', span: [0, 1], message: 'a' },
        { type: 'grammar', span: [1, 2], message: 'b' },
        { type: 'logic', span: [2, 3], message: 'c' },
        { type: 'style', span: [3, 4], message: 'd' },
      ],
    };
    expect(SentenceAnnotationSchema.safeParse(ann).success).toBe(false);
  });

  it('rejects negative sentenceIndex', () => {
    const ann = {
      sentenceIndex: -1,
      text: 'a',
      issues: [],
    };
    expect(SentenceAnnotationSchema.safeParse(ann).success).toBe(false);
  });

  it('accepts sentence with empty issues array', () => {
    const ann: SentenceAnnotation = {
      sentenceIndex: 2,
      text: 'No problems here.',
      issues: [],
    };
    expect(SentenceAnnotationSchema.safeParse(ann).success).toBe(true);
  });
});

describe('EvaluationResultSchema (backward compatibility)', () => {
  it('accepts a minimal legacy result without new fields', () => {
    const legacy: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '总体不错',
      polishedVersion: 'A polished sentence.',
      timestamp: Date.now(),
    };
    expect(EvaluationResultSchema.safeParse(legacy).success).toBe(true);
  });

  it('accepts a result with numericScore and sentenceAnnotations', () => {
    const enhanced: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '总体不错',
      polishedVersion: 'A polished sentence.',
      numericScore: 87,
      sentenceAnnotations: [
        {
          sentenceIndex: 0,
          text: 'I wil go.',
          issues: [
            { type: 'spelling', span: [2, 5], message: '应为 "will"', suggestion: 'will' },
          ],
        },
      ],
      timestamp: Date.now(),
    };
    expect(EvaluationResultSchema.safeParse(enhanced).success).toBe(true);
  });

  it('rejects numericScore out of [0,100]', () => {
    const bad = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '总体不错',
      polishedVersion: 'A polished sentence.',
      numericScore: 150,
      timestamp: Date.now(),
    };
    expect(EvaluationResultSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects numericScore that is negative', () => {
    const bad = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '总体不错',
      polishedVersion: 'A polished sentence.',
      numericScore: -1,
      timestamp: Date.now(),
    };
    expect(EvaluationResultSchema.safeParse(bad).success).toBe(false);
  });
});
