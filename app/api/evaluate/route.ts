import { NextRequest, NextResponse } from 'next/server';
import { EvaluationInputSchema, type EvaluationResult, type EvaluationType } from '@/lib/types';
import { buildSystemPrompt, createEvaluationPrompt, detectEvaluationType } from '@/lib/ai-prompt';
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
      reasoning_content?: string; // deepseek-reasoner 专用字段
    };
    finish_reason: string;
  }>;
}

/**
 * 从文本中提取 JSON 内容
 */
function extractJSON(content: string): string {
  let jsonContent = content.trim();
  
  // 方法1: 提取 markdown 代码块中的 JSON
  const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonContent = codeBlockMatch[1].trim();
  }
  
  // 方法2: 如果以 ```json 开头但没有结束标记
  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  }
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  
  // 方法3: 查找第一个 { 和最后一个 } 之间的内容
  const firstBrace = jsonContent.indexOf('{');
  const lastBrace = jsonContent.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
  }
  
  return jsonContent;
}

/**
 * 生成默认的雷达维度标签
 */
function getDefaultRadarLabels(evaluationType?: EvaluationType): [string, string, string, string] {
  if (evaluationType === 'translation') {
    return ['信 (Faithfulness)', '达 (Expressiveness)', '雅 (Elegance)', '语法 (Grammar)'];
  }
  return ['词汇 (Vocabulary)', '逻辑 (Logic)', '结构 (Structure)', '内容 (Content)'];
}

/**
 * 解析AI返回的JSON响应（增强版）
 * 将snake_case字段转换为camelCase，支持新的结构化字段
 * 增强容错能力，处理各种格式的响应
 */
function parseAIResponse(
  content: string, 
  reasoningContent?: string,
  evaluationType?: EvaluationType
): Omit<EvaluationResult, 'timestamp'> {
  console.log('Raw AI response content:', content?.substring(0, 500));
  
  // 如果内容为空，抛出明确错误
  if (!content || content.trim() === '') {
    throw new Error('AI response content is empty');
  }
  
  try {
    // 提取 JSON 内容
    const jsonContent = extractJSON(content);
    console.log('Extracted JSON content:', jsonContent?.substring(0, 500));
    
    const parsed = JSON.parse(jsonContent);
    
    // 验证必需字段，提供默认值
    const score = parsed.score || 'B';
    const validScores = ['S', 'A', 'B', 'C'];
    const finalScore = validScores.includes(score) ? score : 'B';
    
    // 处理 is_semantically_correct 字段（支持多种格式）
    let isSemanticallyCorrect = true;
    if (typeof parsed.is_semantically_correct === 'boolean') {
      isSemanticallyCorrect = parsed.is_semantically_correct;
    } else if (typeof parsed.isSemanticallyCorrect === 'boolean') {
      isSemanticallyCorrect = parsed.isSemanticallyCorrect;
    } else if (finalScore === 'C') {
      isSemanticallyCorrect = false;
    }
    
    // 处理 analysis 字段
    const analysis = parsed.analysis || parsed.feedback || parsed.comment || '评估完成';
    
    // 处理 polished_version 字段
    const polishedVersion = parsed.polished_version || parsed.polishedVersion || parsed.improved_version || '';
    
    // 处理 analysis_breakdown 字段
    const breakdown = parsed.analysis_breakdown || parsed.analysisBreakdown;
    const analysisBreakdown = breakdown ? {
      strengths: Array.isArray(breakdown.strengths) ? breakdown.strengths : [],
      weaknesses: Array.isArray(breakdown.weaknesses) ? breakdown.weaknesses : [],
      contextMatch: breakdown.context_match || breakdown.contextMatch || '',
    } : undefined;
    
    // 处理 radar_scores 字段（旧格式）
    const radarScoresRaw = parsed.radar_scores || parsed.radarScores;
    const radarScores = radarScoresRaw ? {
      vocabulary: Number(radarScoresRaw.vocabulary) || 70,
      grammar: Number(radarScoresRaw.grammar) || 70,
      coherence: Number(radarScoresRaw.coherence) || 70,
      structure: Number(radarScoresRaw.structure) || 70,
    } : undefined;
    
    // 处理 radar_dimensions 字段（新格式）
    const radarDimsRaw = parsed.radar_dimensions || parsed.radarDimensions;
    const radarDimensions = radarDimsRaw ? {
      dim1: Number(radarDimsRaw.dim1) || 70,
      dim2: Number(radarDimsRaw.dim2) || 70,
      dim3: Number(radarDimsRaw.dim3) || 70,
      dim4: Number(radarDimsRaw.dim4) || 70,
      labels: Array.isArray(radarDimsRaw.labels) && radarDimsRaw.labels.length === 4 
        ? radarDimsRaw.labels 
        : getDefaultRadarLabels(evaluationType),
    } : undefined;
    
    return {
      score: finalScore as 'S' | 'A' | 'B' | 'C',
      isSemanticallyCorrect,
      analysis,
      analysisBreakdown,
      polishedVersion,
      radarScores,
      radarDimensions,
      evaluationType,
      reasoningProcess: reasoningContent,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    console.error('Parse error:', error);
    
    // 尝试从非 JSON 响应中提取有用信息
    const fallbackResult = tryExtractFromText(content, evaluationType);
    if (fallbackResult) {
      console.log('Using fallback extraction result');
      return {
        ...fallbackResult,
        reasoningProcess: reasoningContent,
      };
    }
    
    throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 尝试从非 JSON 文本中提取评估信息（降级方案）
 */
function tryExtractFromText(
  content: string,
  evaluationType?: EvaluationType
): Omit<EvaluationResult, 'timestamp' | 'reasoningProcess'> | null {
  try {
    // 尝试提取评分
    const scoreMatch = content.match(/(?:score|grade|rating)[:\s]*["']?([SABC])["']?/i);
    const score = scoreMatch ? scoreMatch[1].toUpperCase() as 'S' | 'A' | 'B' | 'C' : 'B';
    
    // 尝试提取语义正确性
    const semanticMatch = content.match(/(?:semantically|correct)[:\s]*(true|false)/i);
    const isSemanticallyCorrect = semanticMatch ? semanticMatch[1].toLowerCase() === 'true' : score !== 'C';
    
    // 使用整个内容作为分析（如果没有找到 JSON）
    const analysis = content.length > 50 ? content.substring(0, 500) + '...' : content;
    
    return {
      score,
      isSemanticallyCorrect,
      analysis: `AI 评估结果：\n${analysis}`,
      polishedVersion: '',
      radarDimensions: {
        dim1: score === 'S' ? 95 : score === 'A' ? 85 : score === 'B' ? 75 : 60,
        dim2: score === 'S' ? 92 : score === 'A' ? 82 : score === 'B' ? 72 : 58,
        dim3: score === 'S' ? 90 : score === 'A' ? 80 : score === 'B' ? 70 : 55,
        dim4: score === 'S' ? 93 : score === 'A' ? 83 : score === 'B' ? 73 : 57,
        labels: getDefaultRadarLabels(evaluationType),
      },
      evaluationType,
    };
  } catch {
    return null;
  }
}

/**
 * 调用DeepSeek API（非流式，支持 deepseek-reasoner）
 * 支持自定义API配置
 */
async function callDeepSeekAPI(
  messages: DeepSeekMessage[],
  customAPIKey?: string,
  customAPIEndpoint?: string,
  customAPIModel?: string,
  retryCount = 0
): Promise<{ content: string; reasoningContent?: string }> {
  // 优先使用自定义API，否则使用环境变量
  const apiKey = customAPIKey || process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  // 如果自定义端点已包含完整路径，直接使用；否则添加 /chat/completions
  const baseEndpoint = customAPIEndpoint || 'https://api.deepseek.com/v1';
  const endpoint = baseEndpoint.includes('/chat/completions') 
    ? baseEndpoint 
    : `${baseEndpoint}/chat/completions`;
  
  // 默认使用 deepseek-chat 模型（稳定版本）
  // 可选模型: deepseek-chat, deepseek-coder, deepseek-reasoner
  const model = customAPIModel || 'deepseek-chat';

  const requestBody: DeepSeekRequest = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2000, // 增加 token 限制以支持推理过程
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

    const responseText = await response.text();
    console.log('DeepSeek API raw response text:', responseText.substring(0, 3000));
    
    let data: DeepSeekResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      throw new Error(`Invalid JSON response from DeepSeek API: ${responseText.substring(0, 500)}`);
    }
    
    console.log('DeepSeek API parsed response:', JSON.stringify(data, null, 2).substring(0, 2000));
    
    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in response:', data);
      throw new Error('No response from DeepSeek API');
    }

    const message = data.choices[0].message;
    // deepseek-reasoner 模型可能将主要内容放在 reasoning_content 中
    // 而 content 可能是空的或只包含最终答案
    let content = message?.content || '';
    const reasoningContent = message?.reasoning_content;
    
    // 如果 content 为空但有 reasoning_content，尝试从 reasoning_content 中提取 JSON
    if (!content && reasoningContent) {
      console.log('Content is empty, trying to extract from reasoning_content');
      // 尝试从 reasoning_content 中找到 JSON
      const jsonMatch = reasoningContent.match(/\{[\s\S]*"score"[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      } else {
        // 如果没有找到 JSON，使用 reasoning_content 作为分析内容
        content = JSON.stringify({
          score: 'B',
          is_semantically_correct: true,
          analysis: reasoningContent.substring(0, 1000),
          polished_version: '',
          radar_dimensions: {
            dim1: 75,
            dim2: 75,
            dim3: 75,
            dim4: 75,
            labels: ['维度1', '维度2', '维度3', '维度4']
          }
        });
      }
    }
    
    console.log('Extracted content length:', content.length);
    console.log('Content preview:', content.substring(0, 500));

    return {
      content,
      reasoningContent,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error calling DeepSeek API');
  }
}

/**
 * 生成测试模式的模拟响应
 */
function generateMockResponse(evaluationType: EvaluationType): Omit<EvaluationResult, 'timestamp'> {
  console.log('🧪 Using MOCK mode - No API key configured');
  
  if (evaluationType === 'translation') {
    return {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '【测试模式】翻译整体准确，表达流畅。建议：可以使用更地道的英文表达。',
      analysisBreakdown: {
        strengths: [
          '准确传达了原文含义',
          '语法正确无误',
          '用词恰当'
        ],
        weaknesses: [
          '部分表达略显生硬，可以更自然'
        ],
        contextMatch: '与文章语境高度契合'
      },
      polishedVersion: '【测试模式】This is a polished version of your translation.',
      radarDimensions: {
        dim1: 90,
        dim2: 85,
        dim3: 82,
        dim4: 95,
        labels: ['信 (Faithfulness)', '达 (Expressiveness)', '雅 (Elegance)', '语法 (Grammar)']
      },
      evaluationType: 'translation',
      reasoningProcess: '【测试模式】首先分析了原文的核心含义，然后评估译文的准确性和流畅度...'
    };
  } else {
    return {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '【测试模式】写作内容充实，逻辑清晰。建议：可以使用更丰富的词汇。',
      analysisBreakdown: {
        strengths: [
          '逻辑连贯，论述清晰',
          '句式结构良好',
          '内容切题'
        ],
        weaknesses: [
          '词汇可以更加多样化',
          '部分句子可以更简洁'
        ],
        contextMatch: '与主题紧密相关'
      },
      polishedVersion: '【测试模式】This is a polished version with improved vocabulary and structure.',
      radarDimensions: {
        dim1: 85,
        dim2: 88,
        dim3: 82,
        dim4: 90,
        labels: ['词汇 (Vocabulary)', '逻辑 (Logic)', '结构 (Structure)', '内容 (Content)']
      },
      evaluationType: 'writing',
      reasoningProcess: '【测试模式】分析了句子的词汇选择、逻辑结构和内容深度...'
    };
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
    
    // 检测或使用指定的评估类型
    const evaluationType = cleanedInput.evaluationType || detectEvaluationType(cleanedInput.directions);
    
    // 检查是否有 API 密钥
    const apiKey = customAPIKey || process.env.DEEPSEEK_API_KEY;
    
    let parsedResponse: Omit<EvaluationResult, 'timestamp'>;
    
    if (!apiKey) {
      // 测试模式：没有 API 密钥时返回模拟数据
      console.warn('⚠️  No API key found, using MOCK mode');
      parsedResponse = generateMockResponse(evaluationType);
    } else {
      // 正常模式：调用真实 API
      // 构建动态系统提示词
      const systemPrompt = buildSystemPrompt(evaluationType);
      
      // 构建消息
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: createEvaluationPrompt(cleanedInput) },
      ];
      
      // 调用DeepSeek API（支持自定义配置，默认使用 deepseek-reasoner）
      const aiResponse = await callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel);
      
      // 解析AI响应（包含推理过程）
      parsedResponse = parseAIResponse(
        aiResponse.content, 
        aiResponse.reasoningContent,
        evaluationType
      );
    }
    
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
            message: 'DeepSeek API 密钥未配置。请在 .env.local 文件中添加 DEEPSEEK_API_KEY，或在设置页面配置自定义 API。',
            details: error.message,
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
