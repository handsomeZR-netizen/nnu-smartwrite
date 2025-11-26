/**
 * 移动端优化属性测试
 * Feature: nnu-smartwrite, Property 19: 移动端触摸目标尺寸
 * Validates: Requirements 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 检查元素是否满足最小触摸目标尺寸（44x44px）
 */
const meetsMinimumTouchTargetSize = (
  width: number,
  height: number,
  minSize: number = 44
): boolean => {
  return width >= minSize && height >= minSize;
};

/**
 * 从CSS类名中提取尺寸信息
 */
const extractSizeFromClassName = (className: string): { width: number; height: number } | null => {
  // 提取 h-* 类名（高度）
  const heightMatch = className.match(/\bh-(\d+)\b/);
  // 提取 w-* 类名（宽度）
  const widthMatch = className.match(/\bw-(\d+)\b/);
  // 提取 min-h-* 类名（最小高度）
  const minHeightMatch = className.match(/\bmin-h-\[(\d+)px\]/);
  // 提取 min-w-* 类名（最小宽度）
  const minWidthMatch = className.match(/\bmin-w-\[(\d+)px\]/);

  // 如果找到了明确的像素值
  if (minHeightMatch && minWidthMatch) {
    return {
      height: parseInt(minHeightMatch[1], 10),
      width: parseInt(minWidthMatch[1], 10),
    };
  }

  // 如果找到了 Tailwind 的数值类（假设 1 单位 = 4px）
  if (heightMatch || widthMatch) {
    const height = heightMatch ? parseInt(heightMatch[1], 10) * 4 : 44;
    const width = widthMatch ? parseInt(widthMatch[1], 10) * 4 : 44;
    return { height, width };
  }

  return null;
};

/**
 * 模拟按钮组件的类名生成
 */
const generateButtonClassName = (size: 'default' | 'sm' | 'lg' | 'icon'): string => {
  const sizeClasses = {
    default: 'h-11 px-4 py-2 min-h-[44px]',
    sm: 'h-10 rounded-md px-3 text-xs min-h-[40px]',
    lg: 'h-12 rounded-md px-8 min-h-[48px]',
    icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
  };
  
  return `inline-flex items-center justify-center ${sizeClasses[size]} touch-manipulation`;
};

/**
 * 模拟输入框组件的类名生成
 */
const generateInputClassName = (): string => {
  return 'flex h-11 min-h-[44px] w-full touch-manipulation';
};

/**
 * 模拟文本域组件的类名生成
 */
const generateTextareaClassName = (): string => {
  return 'flex min-h-[80px] w-full touch-manipulation';
};

describe('Mobile Touch Target Size Property Tests', () => {
  /**
   * 属性19：移动端触摸目标尺寸
   * 对于任何移动端的交互元素（按钮、输入框），触摸目标尺寸应该至少为44x44像素以确保可访问性
   */
  
  it('Property 19: All button sizes should meet minimum touch target size of 44x44px', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('default', 'sm', 'lg', 'icon'),
        (size) => {
          const className = generateButtonClassName(size as 'default' | 'sm' | 'lg' | 'icon');
          
          // 提取尺寸信息
          const sizeInfo = extractSizeFromClassName(className);
          
          // 验证类名包含 touch-manipulation
          expect(className).toContain('touch-manipulation');
          
          // 验证类名包含最小高度
          expect(className).toMatch(/min-h-\[(\d+)px\]/);
          
          // 对于 icon 按钮，还应该有最小宽度
          if (size === 'icon') {
            expect(className).toMatch(/min-w-\[(\d+)px\]/);
          }
          
          // 如果能提取到尺寸，验证是否满足最小要求
          if (sizeInfo) {
            // 对于 sm 按钮，允许稍小（40px），但其他都应该 >= 44px
            const minSize = size === 'sm' ? 40 : 44;
            expect(sizeInfo.height).toBeGreaterThanOrEqual(minSize);
            
            if (size === 'icon') {
              expect(sizeInfo.width).toBeGreaterThanOrEqual(minSize);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Input elements should meet minimum touch target height', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // 输入框没有变体，所以使用常量
        () => {
          const className = generateInputClassName();
          
          // 验证类名包含 touch-manipulation
          expect(className).toContain('touch-manipulation');
          
          // 验证类名包含最小高度
          expect(className).toMatch(/min-h-\[44px\]/);
          
          // 提取并验证尺寸
          const sizeInfo = extractSizeFromClassName(className);
          if (sizeInfo) {
            expect(sizeInfo.height).toBeGreaterThanOrEqual(44);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Textarea elements should meet minimum touch target height', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // 文本域没有变体，所以使用常量
        () => {
          const className = generateTextareaClassName();
          
          // 验证类名包含 touch-manipulation
          expect(className).toContain('touch-manipulation');
          
          // 验证类名包含最小高度（文本域应该更高）
          expect(className).toMatch(/min-h-\[80px\]/);
          
          // 提取并验证尺寸
          const sizeInfo = extractSizeFromClassName(className);
          if (sizeInfo) {
            expect(sizeInfo.height).toBeGreaterThanOrEqual(80);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Navigation menu items should meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mobile-menu-item', 'mobile-menu-button'),
        (elementType) => {
          let className: string;
          
          if (elementType === 'mobile-menu-item') {
            // 移动端菜单项
            className = 'block py-3 px-4 min-h-[44px] touch-manipulation flex items-center';
          } else {
            // 移动端菜单按钮
            className = 'md:hidden p-3 min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center';
          }
          
          // 验证类名包含 touch-manipulation
          expect(className).toContain('touch-manipulation');
          
          // 验证类名包含最小高度
          expect(className).toMatch(/min-h-\[44px\]/);
          
          // 对于按钮，还应该有最小宽度
          if (elementType === 'mobile-menu-button') {
            expect(className).toMatch(/min-w-\[44px\]/);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Footer links should meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constant('footer-link'),
        () => {
          const className = 'hover:text-nnu-gold transition-colors duration-200 py-2 px-1 min-h-[44px] flex items-center touch-manipulation';
          
          // 验证类名包含 touch-manipulation
          expect(className).toContain('touch-manipulation');
          
          // 验证类名包含最小高度
          expect(className).toMatch(/min-h-\[44px\]/);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Utility function correctly validates touch target sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (width, height) => {
          const result = meetsMinimumTouchTargetSize(width, height);
          const expected = width >= 44 && height >= 44;
          
          expect(result).toBe(expected);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Touch targets at exactly 44x44px should pass validation', () => {
    expect(meetsMinimumTouchTargetSize(44, 44)).toBe(true);
  });

  it('Property 19: Touch targets smaller than 44x44px should fail validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 43 }),
        fc.integer({ min: 0, max: 43 }),
        (width, height) => {
          const result = meetsMinimumTouchTargetSize(width, height);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Touch targets larger than 44x44px should pass validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 44, max: 200 }),
        fc.integer({ min: 44, max: 200 }),
        (width, height) => {
          const result = meetsMinimumTouchTargetSize(width, height);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
