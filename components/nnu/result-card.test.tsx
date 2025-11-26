import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { ResultCard } from './result-card';
import type { EvaluationResult } from '@/lib/types';
import * as fc from 'fast-check';

describe('ResultCard', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Feature: nnu-smartwrite, Property 4: 评估结果完整性
   * 
   * 对于任何评估结果，系统应该显示所有必需字段：
   * 等级评分（S/A/B/C）、详细分析文本和润色版本。
   * 
   * **验证需求：1.5, 3.1, 3.2, 3.3**
   */
  it('Property 4: should display all required fields for any evaluation result', () => {
    fc.assert(
      fc.property(
        fc.record({
          score: fc.constantFrom('S' as const, 'A' as const, 'B' as const, 'C' as const),
          isSemanticallyCorrect: fc.boolean(),
          // 过滤掉纯空白字符串，因为它们不符合需求规范（analysis必须非空）
          analysis: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          polishedVersion: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          timestamp: fc.integer({ min: 0 }),
        }),
        (result: EvaluationResult) => {
          const { container, unmount } = render(<ResultCard result={result} />);
          
          // 使用 within 限定查询范围到当前容器
          const card = within(container);
          
          // 验证等级评分显示
          const scoreElement = card.getByText(result.score);
          expect(scoreElement).toBeTruthy();
          
          // 验证详细分析文本显示
          expect(card.getByText('详细分析')).toBeTruthy();
          // 验证analysis文本存在于容器中（使用textContent避免normalize问题）
          expect(container.textContent).toContain(result.analysis);
          
          // 验证润色版本显示
          expect(card.getByText('润色建议')).toBeTruthy();
          // 验证polishedVersion文本存在于容器中
          expect(container.textContent).toContain(result.polishedVersion);
          
          // 验证语义正确性标志显示
          const semanticFlag = result.isSemanticallyCorrect ? '✓ 语义正确' : '✗ 需要改进';
          expect(card.getByText(semanticFlag)).toBeTruthy();
          
          // 验证卡片结构存在
          expect(container.querySelector('.bg-white')).toBeTruthy();
          
          // 清理DOM
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: nnu-smartwrite, Property 8: 评分等级有效性
   * 
   * 对于任何评估结果，返回的score字段必须是有效的等级值（'S'、'A'、'B'或'C'之一）。
   * 
   * **验证需求：2.5**
   */
  it('Property 8: should only accept valid score grades', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('S' as const, 'A' as const, 'B' as const, 'C' as const),
        fc.boolean(),
        // 过滤掉纯空白字符串
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 0 }),
        (score, isSemanticallyCorrect, analysis, polishedVersion, timestamp) => {
          const result: EvaluationResult = {
            score,
            isSemanticallyCorrect,
            analysis,
            polishedVersion,
            timestamp,
          };
          
          // 应该能够成功渲染，不抛出错误
          const { container, unmount } = render(<ResultCard result={result} />);
          
          // 使用 within 限定查询范围到当前容器
          const card = within(container);
          
          // 验证score是有效的等级值
          expect(['S', 'A', 'B', 'C']).toContain(score);
          
          // 验证score被正确显示（使用textContent避免多个匹配）
          expect(container.textContent).toContain(score);
          
          // 验证score有对应的颜色样式
          const badge = container.querySelector('.text-2xl');
          expect(badge).toBeTruthy();
          expect(badge?.classList.toString()).toMatch(/bg-gradient-to-r/);
          
          // 清理DOM
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  // 单元测试：验证特定等级的颜色样式
  it('should apply correct color for S grade', () => {
    const result: EvaluationResult = {
      score: 'S',
      isSemanticallyCorrect: true,
      analysis: 'Excellent work!',
      polishedVersion: 'Perfect sentence.',
      timestamp: Date.now(),
    };

    const { container } = render(<ResultCard result={result} />);
    const badge = container.querySelector('.from-yellow-400');
    expect(badge).toBeTruthy();
  });

  it('should apply correct color for A grade', () => {
    const result: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: 'Good work!',
      polishedVersion: 'Great sentence.',
      timestamp: Date.now(),
    };

    const { container } = render(<ResultCard result={result} />);
    const badge = container.querySelector('.from-green-400');
    expect(badge).toBeTruthy();
  });

  it('should apply correct color for B grade', () => {
    const result: EvaluationResult = {
      score: 'B',
      isSemanticallyCorrect: false,
      analysis: 'Needs improvement.',
      polishedVersion: 'Better sentence.',
      timestamp: Date.now(),
    };

    const { container } = render(<ResultCard result={result} />);
    const badge = container.querySelector('.from-blue-400');
    expect(badge).toBeTruthy();
  });

  it('should apply correct color for C grade', () => {
    const result: EvaluationResult = {
      score: 'C',
      isSemanticallyCorrect: false,
      analysis: 'Significant issues.',
      polishedVersion: 'Corrected sentence.',
      timestamp: Date.now(),
    };

    const { container } = render(<ResultCard result={result} />);
    const badge = container.querySelector('.from-gray-400');
    expect(badge).toBeTruthy();
  });

  it('should display semantic correctness flag correctly', () => {
    const correctResult: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: 'Good',
      polishedVersion: 'Good',
      timestamp: Date.now(),
    };

    const { rerender } = render(<ResultCard result={correctResult} />);
    expect(screen.getByText('✓ 语义正确')).toBeTruthy();

    const incorrectResult: EvaluationResult = {
      ...correctResult,
      isSemanticallyCorrect: false,
    };

    rerender(<ResultCard result={incorrectResult} />);
    expect(screen.getByText('✗ 需要改进')).toBeTruthy();
  });

  it('should use NNU brand colors', () => {
    const result: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: 'Test analysis',
      polishedVersion: 'Test polished',
      timestamp: Date.now(),
    };

    const { container } = render(<ResultCard result={result} />);
    
    // 验证使用了南师大主题色 #1F6A52
    const headers = container.querySelectorAll('.text-\\[\\#1F6A52\\]');
    expect(headers.length).toBeGreaterThan(0);
    
    // 验证使用了米宣纸色 #F9F7F2
    const polishedSection = container.querySelector('.bg-\\[\\#F9F7F2\\]');
    expect(polishedSection).toBeTruthy();
  });

  it('should show radar chart placeholder when showRadarChart is true and radarScores exist', () => {
    const result: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: 'Good',
      polishedVersion: 'Good',
      timestamp: Date.now(),
      radarScores: {
        vocabulary: 85,
        grammar: 90,
        coherence: 88,
        structure: 92,
      },
    };

    render(<ResultCard result={result} showRadarChart={true} />);
    expect(screen.getByText('多维度评分')).toBeTruthy();
  });

  it('should not show radar chart when showRadarChart is false', () => {
    const result: EvaluationResult = {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: 'Good',
      polishedVersion: 'Good',
      timestamp: Date.now(),
      radarScores: {
        vocabulary: 85,
        grammar: 90,
        coherence: 88,
        structure: 92,
      },
    };

    render(<ResultCard result={result} showRadarChart={false} />);
    expect(screen.queryByText('多维度评分')).toBeFalsy();
  });
});
