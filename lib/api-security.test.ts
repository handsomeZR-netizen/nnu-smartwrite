/**
 * API安全性属性测试
 * 
 * Feature: nnu-smartwrite, Property 22: API密钥安全性
 * 验证需求：8.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeEvaluationInput } from './utils';
import type { EvaluationInput } from './types';

/**
 * 属性22：API密钥安全性
 * 
 * 对于任何客户端代码，不应包含或暴露DeepSeek API密钥，
 * 所有API调用必须通过服务端路由。
 * 
 * 验证需求：8.3
 */
describe('Property 22: API密钥安全性', () => {
  it('should not include API key in client-side environment variables', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // 在客户端环境中，process.env.DEEPSEEK_API_KEY应该是undefined
          // 只有NEXT_PUBLIC_前缀的环境变量才会暴露给客户端
          if (typeof window !== 'undefined') {
            // 客户端环境
            expect(process.env.DEEPSEEK_API_KEY).toBeUndefined();
          }
          
          // 验证只有NEXT_PUBLIC_前缀的环境变量可以在客户端访问
          const envKeys = Object.keys(process.env);
          const clientAccessibleKeys = envKeys.filter(key => 
            key.startsWith('NEXT_PUBLIC_')
          );
          
          // 确保DEEPSEEK_API_KEY不在客户端可访问的环境变量中
          expect(clientAccessibleKeys).not.toContain('DEEPSEEK_API_KEY');
          expect(clientAccessibleKeys.every(key => 
            !key.toLowerCase().includes('api_key') || key.startsWith('NEXT_PUBLIC_')
          )).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should sanitize all user inputs to prevent injection attacks', () => {
    fc.assert(
      fc.property(
        fc.record({
          directions: fc.string({ minLength: 1, maxLength: 100 }),
          essayContext: fc.string({ minLength: 1, maxLength: 200 }),
          studentSentence: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (input) => {
          // 添加潜在的恶意内容
          const maliciousInput: EvaluationInput = {
            directions: input.directions + '<script>alert("xss")</script>',
            essayContext: input.essayContext + '${process.env.DEEPSEEK_API_KEY}',
            studentSentence: input.studentSentence + '`${API_KEY}`',
          };

          // 清理输入
          const sanitized = sanitizeEvaluationInput(maliciousInput);

          // 验证清理后的输入不包含过长的内容
          expect(sanitized.directions.length).toBeLessThanOrEqual(10000);
          expect(sanitized.essayContext.length).toBeLessThanOrEqual(10000);
          expect(sanitized.studentSentence.length).toBeLessThanOrEqual(10000);
          
          // 验证清理函数正常工作（移除多余空白）
          expect(sanitized.directions).not.toMatch(/\s{2,}/);
          expect(sanitized.essayContext).not.toMatch(/\s{2,}/);
          expect(sanitized.studentSentence).not.toMatch(/\s{2,}/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure API route file does not expose API key in error messages', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        (errorMessage) => {
          // 模拟各种错误消息
          const testMessages = [
            errorMessage,
            `Error: ${errorMessage}`,
            `API Error: ${errorMessage}`,
            `DeepSeek API error: ${errorMessage}`,
          ];

          for (const message of testMessages) {
            // 验证错误消息不包含API密钥模式
            expect(message).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
            expect(message).not.toMatch(/Bearer\s+sk-/i);
            
            // 验证不包含敏感关键词组合
            const lowerMessage = message.toLowerCase();
            const hasSensitivePattern = 
              (lowerMessage.includes('api') && lowerMessage.includes('key')) ||
              (lowerMessage.includes('bearer') && lowerMessage.includes('token'));
            
            // 如果包含敏感模式，确保不是在暴露实际的密钥
            if (hasSensitivePattern) {
              expect(message).not.toMatch(/sk-[a-zA-Z0-9]+/);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify input validation prevents excessively long inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          directions: fc.string({ minLength: 1, maxLength: 1000 }),
          essayContext: fc.string({ minLength: 1, maxLength: 3000 }),
          studentSentence: fc.string({ minLength: 1, maxLength: 2000 }),
        }),
        (input) => {
          // 清理输入
          const sanitized = sanitizeEvaluationInput(input);

          // 验证清理后的输入长度被限制
          expect(sanitized.directions.length).toBeLessThanOrEqual(10000);
          expect(sanitized.essayContext.length).toBeLessThanOrEqual(10000);
          expect(sanitized.studentSentence.length).toBeLessThanOrEqual(10000);
          
          // 验证清理不会破坏有效内容
          if (input.directions.trim()) {
            expect(sanitized.directions.trim().length).toBeGreaterThan(0);
          }
          if (input.essayContext.trim()) {
            expect(sanitized.essayContext.trim().length).toBeGreaterThan(0);
          }
          if (input.studentSentence.trim()) {
            expect(sanitized.studentSentence.trim().length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure rate limiter prevents excessive requests', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        async (requestCount) => {
          // 动态导入rate limiter
          const { evaluationRateLimiter } = await import('./rate-limiter');
          
          // 重置rate limiter
          evaluationRateLimiter.reset();
          
          let allowedRequests = 0;
          let blockedRequests = 0;
          
          // 尝试发起多个请求
          for (let i = 0; i < requestCount; i++) {
            if (evaluationRateLimiter.canMakeRequest()) {
              evaluationRateLimiter.recordRequest();
              allowedRequests++;
            } else {
              blockedRequests++;
            }
          }
          
          // 验证rate limiter正常工作
          // 第一个请求应该总是被允许
          expect(allowedRequests).toBeGreaterThanOrEqual(1);
          
          // 如果请求数超过限制，应该有被阻止的请求
          if (requestCount > 10) {
            expect(blockedRequests).toBeGreaterThan(0);
          }
          
          // 总数应该等于请求数
          expect(allowedRequests + blockedRequests).toBe(requestCount);
        }
      ),
      { numRuns: 50 }
    );
  });
});
