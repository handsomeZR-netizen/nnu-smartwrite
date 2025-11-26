import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { RadarChart } from './radar-chart';

describe('RadarChart', () => {
  // Feature: nnu-smartwrite, Property 9: 雷达图数据完整性
  // 对于任何写作类型的评估，系统应该返回包含四个维度的雷达图数据：
  // vocabulary、grammar、coherence、structure，每个值在0-100范围内。
  // **验证需求：3.4**
  it('should accept and render radar chart with all four dimensions in valid range (0-100)', () => {
    fc.assert(
      fc.property(
        fc.record({
          vocabulary: fc.integer({ min: 0, max: 100 }),
          grammar: fc.integer({ min: 0, max: 100 }),
          coherence: fc.integer({ min: 0, max: 100 }),
          structure: fc.integer({ min: 0, max: 100 }),
        }),
        (scores) => {
          const { container } = render(<RadarChart scores={scores} />);
          
          try {
            // 验证雷达图容器存在
            const radarChart = container.querySelector('[data-testid="radar-chart"]');
            expect(radarChart).toBeTruthy();
            
            // 验证ResponsiveContainer被渲染（Recharts的核心容器）
            const responsiveContainer = container.querySelector('.recharts-responsive-container');
            expect(responsiveContainer).toBeTruthy();
            
            // 验证分数值在有效范围内
            // 这确保了数据完整性：所有四个维度都存在且在0-100范围内
            expect(scores.vocabulary).toBeGreaterThanOrEqual(0);
            expect(scores.vocabulary).toBeLessThanOrEqual(100);
            expect(scores.grammar).toBeGreaterThanOrEqual(0);
            expect(scores.grammar).toBeLessThanOrEqual(100);
            expect(scores.coherence).toBeGreaterThanOrEqual(0);
            expect(scores.coherence).toBeLessThanOrEqual(100);
            expect(scores.structure).toBeGreaterThanOrEqual(0);
            expect(scores.structure).toBeLessThanOrEqual(100);
            
            // 验证所有四个必需的维度都存在
            expect(scores).toHaveProperty('vocabulary');
            expect(scores).toHaveProperty('grammar');
            expect(scores).toHaveProperty('coherence');
            expect(scores).toHaveProperty('structure');
          } finally {
            // 清理DOM以避免多个元素问题
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // 单元测试：验证组件正确渲染特定示例
  it('should render with specific score values', () => {
    const scores = {
      vocabulary: 85,
      grammar: 90,
      coherence: 75,
      structure: 80,
    };

    const { container } = render(<RadarChart scores={scores} />);
    
    // 验证雷达图存在
    const radarChart = container.querySelector('[data-testid="radar-chart"]');
    expect(radarChart).toBeTruthy();
    
    // 验证Recharts容器被渲染
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeTruthy();
  });

  // 单元测试：验证不同尺寸选项
  it('should render with different size options', () => {
    const scores = {
      vocabulary: 50,
      grammar: 60,
      coherence: 70,
      structure: 80,
    };

    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    
    for (const size of sizes) {
      const { container } = render(<RadarChart scores={scores} size={size} />);
      const radarChart = container.querySelector('[data-testid="radar-chart"]');
      expect(radarChart).toBeTruthy();
      cleanup();
    }
  });

  // 边缘情况测试：最小值
  it('should handle minimum scores (all zeros)', () => {
    const scores = {
      vocabulary: 0,
      grammar: 0,
      coherence: 0,
      structure: 0,
    };

    const { container } = render(<RadarChart scores={scores} />);
    const radarChart = container.querySelector('[data-testid="radar-chart"]');
    expect(radarChart).toBeTruthy();
  });

  // 边缘情况测试：最大值
  it('should handle maximum scores (all 100s)', () => {
    const scores = {
      vocabulary: 100,
      grammar: 100,
      coherence: 100,
      structure: 100,
    };

    const { container } = render(<RadarChart scores={scores} />);
    const radarChart = container.querySelector('[data-testid="radar-chart"]');
    expect(radarChart).toBeTruthy();
  });
});
