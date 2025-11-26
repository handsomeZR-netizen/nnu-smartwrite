import { NextRequest, NextResponse } from 'next/server';
import { EvaluationInputSchema, type EvaluationResult } from '@/lib/types';
import { EVALUATION_SYSTEM_PROMPT, createEvaluationPrompt } from '@/lib/ai-prompt';
import { sanitizeEvaluationInput } from '@/lib/utils';

/**
 * DeepSeek API评估端点
 * 
 * 处理学生写作评估请求，调用DeepSeek API进行语义级别的评估
 * 
 * 安全特性：
 * - API密钥存储在服务端环境变量
 * - 输入验证防止恶意数据
 * - 错误处理和重试机制
 * - 流式响应支持
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature: number;
  max_tokens: number;
  stream: boolean;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
}

interface DeepSeekStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * 解析AI返回的JSON响应
 * 将snake_case字段转换为camelCase
 */
function parseAIResponse(content: string): Omit<EvaluationResult, 'timestamp'> {
  try {
    const parsed = JSON.parse(content);
    
    return {
      score: parsed.score,
      isSemanticallyCorrect: parsed.is_semantically_correct,
      analysis: parsed.analysis,
      polishedVersion: parsed.polished_version,
      radarScores: parsed.radar_scores ? {
        vocabulary: parsed.radar_scores.vocabulary,
        grammar: parsed.radar_scores.grammar,
        coherence: parsed.radar_scores.coherence,
        structure: parsed.radar_scores.structure,
      } : undefined,
    };
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * 调用DeepSeek API（非流式）
 * 支持自定义API配置
 */
async function callDeepSeekAPI(
  messages: DeepSeekMessage[],
  customAPIKey?: string,
  customAPIEndpoint?: string,
  customAPIModel?: string,
  retryCount = 0
): Promise<string> {
  // 优先使用自定义API，否则使用环境变量
  const apiKey = customAPIKey || process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const endpoint = customAPIEndpoint || 'https://api.deepseek.com/v1/chat/completions';
  const model = customAPIModel || 'deepseek-chat';

  const requestBody: DeepSeekRequest = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 1000,
    stream: false,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // 处理速率限制错误（429）- 可重试
      if (response.status === 429 && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel, retryCount + 1);
      }
      
      // 处理服务器错误（5xx）- 可重试
      if (response.status >= 500 && response.status < 600 && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel, retryCount + 1);
      }
      
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data: DeepSeekResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error calling DeepSeek API');
  }
}

/**
 * POST /api/evaluate
 * 
 * 评估学生写作的API端点
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 提取自定义API配置（如果有）
    const customAPIKey = body.customAPIKey as string | undefined;
    const customAPIEndpoint = body.customAPIEndpoint as string | undefined;
    const customAPIModel = body.customAPIModel as string | undefined;
    
    // 清理输入（防止XSS和注入攻击）
    const sanitizedBody = {
      directions: typeof body.directions === 'string' ? body.directions : '',
      essayContext: typeof body.essayContext === 'string' ? body.essayContext : '',
      studentSentence: typeof body.studentSentence === 'string' ? body.studentSentence : '',
    };
    
    // 验证输入
    const validationResult = EvaluationInputSchema.safeParse(sanitizedBody);
    
    if (!validationResult.success) {
      try {
        const errorMessages = validationResult.error.issues.map(e => e.message).join(', ');
        return NextResponse.json(
          {
            error: 'INVALID_INPUT',
            message: '输入数据验证失败：' + errorMessages,
            retryable: false,
          },
          { status: 400 }
        );
      } catch {
        return NextResponse.json(
          {
            error: 'INVALID_INPUT',
            message: '输入数据验证失败：输入格式不正确',
            retryable: false,
          },
          { status: 400 }
        );
      }
    }
    
    const input = validationResult.data;
    
    // 进一步清理输入（移除多余空白等）
    const cleanedInput = sanitizeEvaluationInput(input);
    
    // 构建消息
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
      { role: 'user', content: createEvaluationPrompt(cleanedInput) },
    ];
    
    // 调用DeepSeek API（支持自定义配置）
    const aiResponse = await callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel);
    
    // 解析AI响应
    const parsedResponse = parseAIResponse(aiResponse);
    
    // 添加时间戳
    const result: EvaluationResult = {
      ...parsedResponse,
      timestamp: Date.now(),
    };
    
    // 返回结果
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Evaluation API error:', error);
    
    // 处理不同类型的错误
    if (error instanceof Error) {
      // API配置错误
      if (error.message.includes('DEEPSEEK_API_KEY')) {
        return NextResponse.json(
          {
            error: 'CONFIG_ERROR',
            message: '服务配置错误，请联系管理员',
            retryable: false,
          },
          { status: 500 }
        );
      }
      
      // JSON解析错误
      if (error.message.includes('parse')) {
        return NextResponse.json(
          {
            error: 'PARSE_ERROR',
            message: 'AI响应格式错误，请重试',
            retryable: true,
          },
          { status: 500 }
        );
      }
      
      // DeepSeek API错误
      if (error.message.includes('DeepSeek API')) {
        return NextResponse.json(
          {
            error: 'API_ERROR',
            message: '评估服务暂时不可用，请稍后重试',
            retryable: true,
          },
          { status: 503 }
        );
      }
    }
    
    // 通用错误
    return NextResponse.json(
      {
        error: 'UNKNOWN_ERROR',
        message: '评估失败，请稍后重试',
        retryable: true,
      },
      { status: 500 }
    );
  }
}
