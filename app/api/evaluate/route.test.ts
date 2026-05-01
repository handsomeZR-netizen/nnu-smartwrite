import { describe, it, expect, mock, beforeEach } from 'bun:test';
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

/**
 * 构造一个能同时被 .text() 和 .json() 读取的 fetch mock。
 * 路由实现里会先 await response.text() 再 JSON.parse，所以必须提供 text()。
 */
function mockDeepSeekResponse(content: string, opts: { ok?: boolean; status?: number } = {}) {
  const body = JSON.stringify({
    choices: [
      {
        message: { content },
        finish_reason: 'stop',
      },
    ],
  });
  return mock(async () => ({
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    text: async () => body,
    json: async () => JSON.parse(body),
  })) as unknown as typeof fetch;
}

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
          global.fetch = mockDeepSeekResponse(JSON.stringify(aiResponse));

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

    global.fetch = mockDeepSeekResponse(JSON.stringify(mockAIResponse));

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
   * 单元测试：API 密钥不暴露给客户端
   *
   * 当未配置 DEEPSEEK_API_KEY 时路由进入 mock 模式（避免硬性 500），
   * 但响应中绝不能泄露任何 API key 字面量。
   * 需求：8.3
   */
  it('should not expose API key in any response', async () => {
    // Temporarily remove API key (route 会回落到 mock 模式)
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

    // Mock 模式应当返回 200 + 占位数据（向用户提示 "测试模式"）
    expect(response.status).toBe(200);
    // 响应中不得出现任何形式的 key 字面量
    expect(responseText).not.toContain('DEEPSEEK_API_KEY');
    expect(responseText).not.toContain('sk-');

    // Restore API key
    process.env.DEEPSEEK_API_KEY = originalKey;
  });

  it('should handle DeepSeek API errors gracefully', async () => {
    // 注意：路由对 5xx 会重试 2 次，全部失败后才抛 API_ERROR
    global.fetch = mock(async () => ({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
      json: async () => ({}),
    })) as unknown as typeof fetch;

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
  }, 15000);

  /**
   * 单元测试：AI 返回非 JSON 文本时优雅降级
   *
   * 不再抛 500——路由会用 fallback 抽取或最小默认值，仍返回 200 给前端，
   * 让用户看到"AI 响应格式异常"的占位说明而不是错误页。
   */
  it('should fall back gracefully when AI returns malformed (non-JSON) text', async () => {
    global.fetch = mockDeepSeekResponse('This is not valid JSON');

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
    expect(['S', 'A', 'B', 'C']).toContain(data.score);
    expect(typeof data.analysis).toBe('string');
    expect(data.analysis.length).toBeGreaterThan(0);
  });

  /**
   * 单元测试：accepts numeric_score and sentence_annotations，校验非法 issue 被丢弃
   */
  it('should accept numeric_score and sentence_annotations and drop invalid spans', async () => {
    const aiResponse = {
      score: 'A',
      numeric_score: 87,
      is_semantically_correct: true,
      analysis: '整体不错。',
      polished_version: 'A polished English sentence.',
      sentence_annotations: [
        {
          sentence_index: 0,
          text: 'I wil go to school tomorrow.',
          issues: [
            // 合法：spelling，"wil" 在 [2, 5)
            { type: 'spelling', span: [2, 5], message: '应为 "will"', suggestion: 'will' },
            // 非法：span 超出 text.length
            { type: 'grammar', span: [0, 9999], message: 'bogus' },
            // 非法：未知 type
            { type: 'unknown_type', span: [0, 1], message: 'should be dropped' },
            // 非法：start === end
            { type: 'style', span: [3, 3], message: 'empty span' },
          ],
          comment: '注意将来时拼写。',
        },
        {
          // 非法：负数 sentence_index → 整句应被丢弃
          sentence_index: -1,
          text: 'should be dropped',
          issues: [],
        },
      ],
    };

    global.fetch = mockDeepSeekResponse(JSON.stringify(aiResponse));

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        directions: 'Write an essay',
        essayContext: 'About education',
        studentSentence: 'I wil go to school tomorrow.',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.numericScore).toBe(87);
    expect(Array.isArray(data.sentenceAnnotations)).toBe(true);
    expect(data.sentenceAnnotations).toHaveLength(1); // 负 index 那条被丢弃
    expect(data.sentenceAnnotations[0].sentenceIndex).toBe(0);
    expect(data.sentenceAnnotations[0].issues).toHaveLength(1);
    expect(data.sentenceAnnotations[0].issues[0].type).toBe('spelling');
    expect(data.sentenceAnnotations[0].issues[0].span).toEqual([2, 5]);
  });

  /**
   * 单元测试：numeric_score 越界时被丢弃
   */
  it('should drop numeric_score when out of [0,100]', async () => {
    const aiResponse = {
      score: 'B',
      numeric_score: 150, // 非法
      is_semantically_correct: true,
      analysis: 'ok',
      polished_version: 'ok',
    };

    global.fetch = mockDeepSeekResponse(JSON.stringify(aiResponse));

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        directions: 'Write',
        essayContext: 'ctx',
        studentSentence: 'a sentence',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.numericScore).toBeUndefined();
  });

  /**
   * 单元测试：rubric 与 scoreWeights 透传到 prompt builder（不报错即可）
   */
  it('should accept rubric and scoreWeights in body without error', async () => {
    const mockAIResponse = {
      score: 'A',
      is_semantically_correct: true,
      analysis: 'ok',
      polished_version: 'ok',
    };
    global.fetch = mockDeepSeekResponse(JSON.stringify(mockAIResponse));

    const request = new NextRequest('http://localhost:3000/api/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        directions: 'Write an essay',
        essayContext: 'ctx',
        studentSentence: 'a sentence',
        rubric: '内容 30 / 语言 40 / 结构 20 / 拼写 10',
        scoreWeights: { content: 30, language: 40, structure: 20, spelling: 10 },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe('A');
  });
});
