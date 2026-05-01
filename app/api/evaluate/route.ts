import { NextRequest, NextResponse } from 'next/server';
import {
  EvaluationInputSchema,
  type EvaluationResult,
  type EvaluationType,
  type IssueSpan,
  type IssueType,
  type SentenceAnnotation,
} from '@/lib/types';
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
  temperature?: number;
  max_tokens: number;
  stream: boolean;
  reasoning_effort?: 'high' | 'max';
  thinking?: { type: 'enabled' | 'disabled' };
}

export interface ReasoningOptions {
  thinking?: 'enabled' | 'disabled';
  effort?: 'high' | 'max';
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
 * 生成默认的雷达维度标签（四六级标准）
 */
function getDefaultRadarLabels(evaluationType?: EvaluationType): [string, string, string, string] {
  if (evaluationType === 'translation') {
    // 四六级翻译标准：准确、通顺、词汇、句法
    return ['准确 (Accuracy)', '通顺 (Fluency)', '词汇 (Vocabulary)', '句法 (Syntax)'];
  }
  // 四六级写作标准：切题、丰富、连贯、规范
  return ['切题 (Relevance)', '丰富 (Variety)', '连贯 (Coherence)', '规范 (Accuracy)'];
}

/**
 * 校验并归一化 numeric_score：必须是 0-100 数字（接受字符串数字），
 * 否则返回 undefined（不污染响应）。
 */
function normalizeNumericScore(raw: unknown): number | undefined {
  const n = typeof raw === 'string' ? Number(raw) : (raw as number);
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  if (n < 0 || n > 100) return undefined;
  // 0-100 整数（允许小数但 round 一下，保持序列化稳定）
  return Math.round(n * 100) / 100;
}

const VALID_ISSUE_TYPES: ReadonlySet<IssueType> = new Set([
  'grammar',
  'spelling',
  'vocab',
  'style',
  'logic',
]);

/**
 * 给定 suggestion (正确拼写)，生成它的近邻拼写错误候选：
 * 1) 自身（万一原词本身没拼错只是 AI 误判）
 * 2) 删除任一位 (deletion)
 * 3) 重复任一位 (insertion of same letter)
 * 4) 相邻字母对调 (adjacent transposition)
 * 用于在原文里反查 spelling 错误的真实位置。
 */
function generateNearbyVariants(word: string): string[] {
  const variants = new Set<string>([word]);
  for (let i = 0; i < word.length; i++) {
    variants.add(word.slice(0, i) + word.slice(i + 1));
    variants.add(word.slice(0, i + 1) + word[i] + word.slice(i + 1));
  }
  for (let i = 0; i < word.length - 1; i++) {
    variants.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }
  return Array.from(variants).filter((v) => v.length >= 2);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 在 text 全文里搜索 suggestion 的近邻拼写错误，命中即返回真实 span；找不到返回 null。
 * 仅当 suggestion 是纯英文单词（含连字符 / 撇号）时才执行。
 */
function findCorrectedSpan(
  text: string,
  suggestion: string
): [number, number] | null {
  if (!/^[a-zA-Z'-]+$/.test(suggestion)) return null;
  const variants = generateNearbyVariants(suggestion).sort(
    (a, b) =>
      Math.abs(a.length - suggestion.length) -
      Math.abs(b.length - suggestion.length)
  );
  for (const v of variants) {
    const re = new RegExp(`\\b${escapeRegex(v)}\\b`);
    const m = text.match(re);
    if (m && m.index !== undefined) {
      return [m.index, m.index + v.length];
    }
  }
  return null;
}

/**
 * 从 issue.message 里抽取被引号包裹的字面短语。
 * 支持 ASCII 单/双引号 + 中文弯引号（U+2018/U+2019/U+201C/U+201D）。
 * AI 的 message 里通常会引用原文片段（例 "拼写错误：'wil'应为'will'"），
 * 即使字符 offset 算偏，引号内的字面词通常是对的，可以拿来反查真实位置。
 */
function extractQuotedPhrases(message: string): string[] {
  const out: string[] = [];
  const patterns = [
    /'([^']{2,})'/g,
    /"([^"]{2,})"/g,
    /‘([^‘’]{2,})’/g,
    /“([^“”]{2,})”/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(message)) !== null) {
      const phrase = m[1].trim();
      if (phrase.length >= 2 && !out.includes(phrase)) out.push(phrase);
    }
  }
  return out;
}

/**
 * 用 message 里引号包裹的字面短语在原文中反查真实 span。
 * 优先返回长度更长的短语（更具体、不易歧义）；找不到返回 null。
 */
function findSpanByQuotedPhrase(
  text: string,
  message: string
): [number, number] | null {
  const phrases = extractQuotedPhrases(message).sort(
    (a, b) => b.length - a.length
  );
  for (const p of phrases) {
    const idx = text.indexOf(p);
    if (idx >= 0) return [idx, idx + p.length];
  }
  return null;
}

/**
 * 校验单个 issue：
 * - type 必须在白名单
 * - span = [start, end] 满足 0 ≤ start < end ≤ text.length
 * - message 非空字符串
 * - 防御层：AI 的字符 offset 经常算偏。如果 AI 切出来的子串不在 message 引用的字面短语集合里，
 *   会优先用 message 里引号包裹的短语在原文反查 span；spelling 类还有 suggestion 近邻变体兜底。
 * 不合法时返回 null，由调用方丢弃。
 */
function normalizeIssue(raw: unknown, text: string): IssueSpan | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const type = typeof r.type === 'string' ? (r.type as string) : '';
  if (!VALID_ISSUE_TYPES.has(type as IssueType)) return null;

  const spanRaw = r.span;
  if (!Array.isArray(spanRaw) || spanRaw.length !== 2) return null;
  const startRaw = Number(spanRaw[0]);
  const endRaw = Number(spanRaw[1]);
  if (!Number.isFinite(startRaw) || !Number.isFinite(endRaw)) return null;
  if (!(startRaw >= 0 && endRaw > startRaw && endRaw <= text.length)) return null;

  const message = typeof r.message === 'string' ? r.message.trim() : '';
  if (!message) return null;

  const suggestion =
    typeof r.suggestion === 'string' && r.suggestion.trim()
      ? r.suggestion.trim()
      : undefined;

  let span: [number, number] = [Math.floor(startRaw), Math.floor(endRaw)];
  const sliced = text.slice(span[0], span[1]);

  // 通用兜底：用 message 里引号包裹的字面短语反查
  // 仅当 AI 切出来的子串本身不属于这些短语时才覆盖
  const quotedPhrases = extractQuotedPhrases(message);
  if (!quotedPhrases.includes(sliced)) {
    const bySnippet = findSpanByQuotedPhrase(text, message);
    if (bySnippet) {
      span = bySnippet;
    } else if (type === 'spelling' && suggestion) {
      // spelling 兜底：从 suggestion 反推 edit-distance-1 变体
      const variants = new Set(generateNearbyVariants(suggestion));
      if (!variants.has(sliced)) {
        const corrected = findCorrectedSpan(text, suggestion);
        if (corrected) span = corrected;
      }
    }
  }

  return {
    type: type as IssueType,
    span,
    message,
    suggestion,
  };
}

/**
 * 校验并归一化 sentence_annotations 数组。
 * - 任何非法 issue 被丢弃（不影响整句和其他 issue）
 * - sentenceIndex 非负；text 必须存在且非空
 */
function normalizeSentenceAnnotations(raw: unknown): SentenceAnnotation[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: SentenceAnnotation[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;

    // 兼容 sentence_index / sentenceIndex
    const idxRaw = r.sentence_index ?? r.sentenceIndex;
    const idx = Number(idxRaw);
    if (!Number.isFinite(idx) || idx < 0) continue;

    const text = typeof r.text === 'string' ? r.text : '';
    if (!text) continue;

    const issuesRaw = Array.isArray(r.issues) ? r.issues : [];
    const issues: IssueSpan[] = [];
    for (const iss of issuesRaw) {
      const norm = normalizeIssue(iss, text);
      if (norm) issues.push(norm);
      if (issues.length >= 3) break; // 每句最多 3 条
    }

    const comment =
      typeof r.comment === 'string' && r.comment.trim() ? r.comment.trim() : undefined;

    out.push({
      sentenceIndex: Math.floor(idx),
      text,
      issues,
      comment,
    });
  }

  return out.length > 0 ? out : undefined;
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
    
    // 验证 polished_version 是否包含中文（这是错误的）
    if (polishedVersion && /[\u4e00-\u9fa5]/.test(polishedVersion)) {
      console.warn('⚠️ WARNING: polished_version contains Chinese characters, this is incorrect!');
      console.warn('   Content:', polishedVersion);
      console.warn('   This should be an English sentence, not Chinese!');
    }
    
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

    // 处理 numeric_score（百分制总分），无效则丢弃
    const numericScore = normalizeNumericScore(
      parsed.numeric_score ?? parsed.numericScore
    );

    // 处理 sentence_annotations（逐句批注），非法 issue 被丢弃
    const sentenceAnnotations = normalizeSentenceAnnotations(
      parsed.sentence_annotations ?? parsed.sentenceAnnotations
    );

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
      numericScore,
      sentenceAnnotations,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    console.error('Parse error:', error);

    // JSON.parse 失败时优雅降级：尝试从文本提取，不再 throw
    const fallbackResult = tryExtractFromText(content, evaluationType);
    if (fallbackResult) {
      console.log('Using fallback extraction result');
      return {
        ...fallbackResult,
        reasoningProcess: reasoningContent,
      };
    }

    // 兜底：返回一个最小可用的结果，避免 500
    console.warn('Falling back to minimal default result after parse failure');
    return {
      score: 'B',
      isSemanticallyCorrect: true,
      analysis: 'AI 响应格式异常，已使用默认评估结果。请稍后重试以获取完整评估。',
      polishedVersion: '',
      radarDimensions: {
        dim1: 70,
        dim2: 70,
        dim3: 70,
        dim4: 70,
        labels: getDefaultRadarLabels(evaluationType),
      },
      evaluationType,
      reasoningProcess: reasoningContent,
    };
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
  reasoningOpts?: ReasoningOptions,
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

  // 默认使用 deepseek-v4-flash 模型
  // 可选模型: deepseek-v4-flash, deepseek-chat, deepseek-coder, deepseek-reasoner
  const model = customAPIModel || 'deepseek-v4-flash';

  // 思考模式：默认启用，强度默认 high
  const thinkingType = reasoningOpts?.thinking ?? 'enabled';
  const effort = reasoningOpts?.effort ?? 'high';

  const requestBody: DeepSeekRequest = {
    model,
    messages,
    max_tokens: 2000,
    stream: false,
    thinking: { type: thinkingType },
  };
  // DeepSeek 约束：thinking=disabled 时不能同时传 reasoning_effort
  if (thinkingType === 'enabled') {
    requestBody.reasoning_effort = effort;
  } else {
    // 非思考模式保留低温 strict 指令遵循
    requestBody.temperature = 0.1;
  }

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
        return callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel, reasoningOpts, retryCount + 1);
      }
      
      // 处理服务器错误（5xx）- 可重试
      if (response.status >= 500 && response.status < 600 && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel, reasoningOpts, retryCount + 1);
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
    // 注意：绝对不能直接把 reasoning_content 当 analysis 暴露给前端——那会泄露模型链式思考过程。
    if (!content && reasoningContent) {
      const jsonMatch = reasoningContent.match(/\{[\s\S]*"score"[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      } else {
        // 没找到结构化 JSON：返回最小可用结果 + 提示用户切换到极速模式重试，不要泄露 reasoning_content。
        content = JSON.stringify({
          score: 'B',
          is_semantically_correct: true,
          analysis:
            '本次评测未能解析出结构化结果。这通常发生在思考模式（深度思考 / 极致）时模型超出输出长度。建议切换到「极速」模式或将思考强度调回「标准」后重新评测。',
          polished_version: '',
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
      analysis: '【测试模式 - 四六级翻译标准】翻译整体准确，表达流畅。建议：可以使用更地道的英文表达，避免中式英语。',
      analysisBreakdown: {
        strengths: [
          '准确传达了原文含义，没有遗漏关键信息',
          '语法正确无误，时态使用恰当',
          '用词基本恰当，符合英语表达习惯'
        ],
        weaknesses: [
          '部分表达略显生硬，如可以将 "very good" 改为 "exceedingly beneficial"',
          '句式较为简单，可以尝试使用从句增加句式多样性'
        ],
        contextMatch: '符合四六级翻译题的语域要求，表达较为正式'
      },
      polishedVersion: '【测试模式】This is a polished version of your translation with more sophisticated vocabulary and varied sentence structures.',
      radarDimensions: {
        dim1: 90,
        dim2: 85,
        dim3: 82,
        dim4: 88,
        labels: ['准确 (Accuracy)', '通顺 (Fluency)', '词汇 (Vocabulary)', '句法 (Syntax)']
      },
      evaluationType: 'translation',
      reasoningProcess: '【测试模式】按照四六级翻译标准，首先检查了译文的准确性，然后评估了表达的流畅度和词汇句法的质量...'
    };
  } else {
    return {
      score: 'A',
      isSemanticallyCorrect: true,
      analysis: '【测试模式 - 四六级写作标准】作文切题，内容充实，语言较为规范。建议：进一步提升词汇丰富度，使用更多高级词汇和复杂句型。',
      analysisBreakdown: {
        strengths: [
          '切题性好，完全符合题目要求',
          '使用了一些连接词（如 First, Moreover），逻辑较为连贯',
          '基本没有严重的语法错误，主谓一致、时态使用正确'
        ],
        weaknesses: [
          '词汇较为简单，多次使用 "think"、"good" 等低幼词汇，建议替换为 "maintain"、"positive" 等四六级高频词',
          '句式单一，多为简单句（SVO），建议改写为定语从句或状语从句，如 "I think it is good" 可改为 "It is widely acknowledged that..."',
          '部分表达存在中式英语痕迹'
        ],
        contextMatch: '符合四六级议论文的格式要求，语域恰当'
      },
      polishedVersion: '【测试模式】This is a polished version with advanced vocabulary (e.g., "maintain" instead of "think") and complex sentence structures (e.g., subordinate clauses and non-finite verbs).',
      radarDimensions: {
        dim1: 88,
        dim2: 82,
        dim3: 85,
        dim4: 90,
        labels: ['切题 (Relevance)', '丰富 (Variety)', '连贯 (Coherence)', '规范 (Accuracy)']
      },
      evaluationType: 'writing',
      reasoningProcess: '【测试模式】按照四六级写作标准，首先检查了切题性和内容完整性，然后重点分析了词汇和句式的丰富度，最后评估了语言规范性...'
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
    const reasoningOpts: ReasoningOptions | undefined =
      body.reasoning && typeof body.reasoning === 'object'
        ? {
            thinking:
              body.reasoning.thinking === 'disabled' ? 'disabled' : 'enabled',
            effort: body.reasoning.effort === 'max' ? 'max' : 'high',
          }
        : undefined;

    // 可选：自定义评分细则（rubric）与维度权重（scoreWeights, 总和应 ≈ 100）
    const rubric: string | undefined =
      typeof body.rubric === 'string' && body.rubric.trim() ? body.rubric : undefined;
    let scoreWeights: Record<string, number> | undefined;
    if (body.scoreWeights && typeof body.scoreWeights === 'object' && !Array.isArray(body.scoreWeights)) {
      const cleaned: Record<string, number> = {};
      for (const [k, v] of Object.entries(body.scoreWeights as Record<string, unknown>)) {
        const n = typeof v === 'string' ? Number(v) : (v as number);
        if (typeof n === 'number' && Number.isFinite(n)) cleaned[k] = n;
      }
      if (Object.keys(cleaned).length > 0) scoreWeights = cleaned;
    }
    
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
    
    // 获取评估模式和类型
    const mode = cleanedInput.mode || 'sentence';
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
      // 构建动态系统提示词（传入模式和类型 + 可选 rubric / 权重）
      const systemPrompt = buildSystemPrompt(mode, evaluationType, rubric, scoreWeights);

      // 构建消息
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: createEvaluationPrompt(cleanedInput) },
      ];
      
      // 调用DeepSeek API（支持自定义配置，默认使用 deepseek-reasoner）
      const aiResponse = await callDeepSeekAPI(messages, customAPIKey, customAPIEndpoint, customAPIModel, reasoningOpts);
      
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
