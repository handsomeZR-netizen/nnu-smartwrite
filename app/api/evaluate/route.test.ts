import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as fc from 'fast-check';

/**
 * Feature: nnu-smartwrite, Property 5: API响应格式一致性
 * 
 * 属性测试：验证API响应格式的一致性
 * 
 * 对于任何来自评估引擎的响应，必须包含以下字段：
 * - score（S/A/B/C之一）
 * - isSemanticallyCorrect（布尔值）
 * - analysis（非空字符串）
 * - polishedVersion（字符串）
 * 
 * 验证需求：2.4, 9.5, 10.5
 */

// Mock环境变量
beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = 'test-api-key';
});

// 生成有效的评估输入
const validEvaluationInputArb = fc.record({
  directions: fc.string({ minLength: 1, maxLength: 500 }),
  essayContext: fc.string({ minLength: 1, maxLength: 2000 }),
  studentSentence: fc.string({ minLength: 1, maxLength: 1000 }),
});

// 生成有效的AI响应
const validAIResponseArb = fc.record({
  score: fc.constantFrom('S', 'A', 'B', 'C'),
  is_semantically_correct: fc.boolean(),
  analysis: fc.string({ minLength: 1, maxLength: 500 }),
  polished_version: fc.string({ minLength: 1, maxLength: 1000 }),
  radar_scores: fc.option(
    fc.record({
      vocabulary: fc.integer({ min: 0, max: 100 }),
      grammar: fc.integer({ min: 0, max: 100 }),
      coherence: fc.integer({ min: 0, max: 100 }),
      structure: fc.integer({ min: 0, max: 100 }),
    }),
    { nil: undefined }
  ),
});

describe('API Route - Property-Based Tests', () => {
  /**
   * Feature: nnu-smartwrite, Property 5: API响应格式一致性
   */
  it('should always return valid response format for any valid input', async () => {
    await fc.assert(
      fc.asyncProperty(
        validEvaluationInputArb,
        validAIResponseArb,
        async (input, aiResponse) => {
          // Mock fetch to return our generated AI response
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify(aiResponse),
                  },
                  finish_reason: 'stop',
                },
              ],
            }),
          });

          // Create mock request
          const request = new NextRequest('http://localhost:3000/api/evaluate', {
            method: 'POST',
            body: JSON.stringify(input),
          });

          // Call the API
          const response = await POST(request);
          const data = await response.json();

          // Verify response format
          expect(['S', 'A', 'B', 'C']).toContain(data.score);
          expect(typeof data.isSemanticallyCorrect).toBe('boolean');
          expect(typeof data.analysis).toBe('string');
          expect(data.analysis.length).toBeGreaterThan(0);
          expect(typeof data.polishedVersion).toBe('string');
          expect(typeof data.timestamp).toBe('number');

          // If radar scores are present, verify their format
          if (data.radarScores) {
            expect(typeof data.radarScores.vocabulary).toBe('number');
            expect(data.radarScores.vocabulary).toBeGreaterThanOrEqual(0);
            expect(data.radarScores.vocabulary).toBeLessThanOrEqual(100);
            
            expect(typeof data.radarScores.grammar).toBe('number');
            expect(data.radarScores.grammar).toBeGreaterThanOrEqual(0);
            expect(data.radarScores.grammar).toBeLessThanOrEqual(100);
            
            expect(typeof data.radarScores.coherence).toBe('number');
            expect(data.radarScores.coherence).toBeGreaterThanOrEqual(0);
            expect(data.radarScores.coherence).toBeLessThanOrEqual(100);
            
            expect(typeof data.radarScores.structure).toBe('number');
            expect(data.radarScores.structure).toBeGreaterThanOrEqual(0);
            expect(data.radarScores.structure).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('API Route - Unit Tests', () => {
  /**
   * 单元测试：验证/api/evaluate端点正确处理请求
   * 需求：8.3, 9.2
   */
  it('should handle valid evaluation request correctly', async () => {
    const mockAIResponse = {
      score: 'A',
      is_semantically_correct: true,
      analysis: 'Good job! Your sentence is semantically correct.',
      polished_version: 'Your sentence is excellent.',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAIResponse),
            },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const validInput = {
      directions: 'Translate the sentence',
      essayContext: 'This is about education',
      studentSentence: 'Adult education is important',
    };

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(validInput),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe('A');
    expect(data.isSemanticallyCorrect).toBe(true);
    expect(data.analysis).toBe('Good job! Your sentence is semantically correct.');
    expect(data.polishedVersion).toBe('Your sentence is excellent.');
    expect(data.timestamp).toBeDefined();
  });

  /**
   * 单元测试：验证错误响应格式
   * 需求：8.3, 9.2
   */
  it('should return error response for invalid input', async () => {
    const invalidInput = {
      directions: '',
      essayContext: 'Some context',
      studentSentence: 'Some sentence',
    };

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(invalidInput),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('INVALID_INPUT');
    expect(data.message).toContain('输入数据验证失败');
    expect(data.retryable).toBe(false);
  });

  it('should return error response for missing fields', async () => {
    const incompleteInput = {
      directions: 'Some directions',
      essayContext: 'Some context',
      // studentSentence is missing
    };

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(incompleteInput),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('INVALID_INPUT');
    expect(data.retryable).toBe(false);
  });

  /**
   * 单元测试：验证API密钥不暴露给客户端
   * 需求：8.3
   */
  it('should not expose API key in error responses', async () => {
    // Temporarily remove API key
    const originalKey = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const validInput = {
      directions: 'Translate the sentence',
      essayContext: 'This is about education',
      studentSentence: 'Adult education is important',
    };

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(validInput),
    });

    const response = await POST(request);
    const data = await response.json();
    const responseText = JSON.stringify(data);

    expect(response.status).toBe(500);
    expect(data.error).toBe('CONFIG_ERROR');
    expect(responseText).not.toContain('DEEPSEEK_API_KEY');
    expect(responseText).not.toContain('sk-');
    expect(data.message).not.toContain('DEEPSEEK_API_KEY');

    // Restore API key
    process.env.DEEPSEEK_API_KEY = originalKey;
  });

  it('should handle DeepSeek API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    const validInput = {
      directions: 'Translate the sentence',
      essayContext: 'This is about education',
      studentSentence: 'Adult education is important',
    };

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(validInput),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('API_ERROR');
    expect(data.retryable).toBe(true);
  });

  it('should handle malformed AI response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const validInput = {
      directions: 'Translate the sentence',
      essayContext: 'This is about education',
      studentSentence: 'Adult education is important',
    };

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(validInput),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('PARSE_ERROR');
    expect(data.retryable).toBe(true);
  });
});
