import { z } from 'zod';

/**
 * 评估类型：翻译题 vs 写作题
 */
export type EvaluationType = 'translation' | 'writing';

/**
 * 评估模式：单句分析 vs 全文分析
 */
export type EvaluationMode = 'sentence' | 'article';

/**
 * 评估输入数据结构
 */
export interface EvaluationInput {
  directions: string;      // 题目要求
  essayContext: string;    // 文章语境
  studentSentence: string; // 学生答案（可以是句子或全文）
  evaluationType?: EvaluationType; // 可选：评估类型（默认自动检测）
  mode?: EvaluationMode;   // 可选：评估模式（默认为 sentence）
}

/**
 * 评估输入验证Schema
 */
export const EvaluationInputSchema = z.object({
  directions: z.string().trim().min(1, '题目要求不能为空').max(500, '题目要求不能超过500字符'),
  essayContext: z.string().trim().max(2000, '文章语境不能超过2000字符'), // 全文模式下可以为空
  studentSentence: z.string().trim().min(1, '学生答案不能为空').max(1000, '学生答案不能超过1000字符'),
  evaluationType: z.enum(['translation', 'writing']).optional(),
  mode: z.enum(['sentence', 'article']).optional().default('sentence'),
});

/**
 * 结构化分析反馈
 */
export interface AnalysisBreakdown {
  strengths: string[];      // 优点列表
  weaknesses: string[];     // 缺点列表
  contextMatch: string;     // 语境契合度描述
}

/**
 * 动态雷达图维度（根据评估类型）
 */
export interface RadarDimensions {
  dim1: number;             // 维度1分数 (0-100)
  dim2: number;             // 维度2分数 (0-100)
  dim3: number;             // 维度3分数 (0-100)
  dim4: number;             // 维度4分数 (0-100)
  labels: [string, string, string, string]; // 维度标签
}

/**
 * 评估结果数据结构（增强版）
 */
export interface EvaluationResult {
  score: 'S' | 'A' | 'B' | 'C';           // 等级评分
  isSemanticallyCorrect: boolean;         // 语义正确性标志
  analysis: string;                       // 详细分析文本（向后兼容）
  analysisBreakdown?: AnalysisBreakdown;  // 结构化分析（新增）
  polishedVersion: string;                // 润色建议
  radarScores?: {                         // 可选：雷达图数据（传统格式）
    vocabulary: number;    // 词汇 (0-100)
    grammar: number;       // 语法 (0-100)
    coherence: number;     // 连贯性 (0-100)
    structure: number;     // 结构 (0-100)
  };
  radarDimensions?: RadarDimensions;      // 可选：动态雷达图维度（新增）
  evaluationType?: EvaluationType;        // 评估类型
  reasoningProcess?: string;              // 推理过程（来自deepseek-reasoner）
  timestamp: number;                      // 评估时间戳
}

/**
 * 雷达图分数验证Schema
 */
export const RadarScoresSchema = z.object({
  vocabulary: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  coherence: z.number().min(0).max(100),
  structure: z.number().min(0).max(100),
});

/**
 * 评估结果验证Schema
 */
export const EvaluationResultSchema = z.object({
  score: z.enum(['S', 'A', 'B', 'C']),
  isSemanticallyCorrect: z.boolean(),
  analysis: z.string().min(1, '分析内容不能为空'),
  polishedVersion: z.string(),
  radarScores: RadarScoresSchema.optional(),
  timestamp: z.number(),
});

/**
 * 历史记录数据结构
 */
export interface HistoryRecord {
  id: string;                    // 唯一标识符
  input: EvaluationInput;        // 原始输入
  result: EvaluationResult;      // 评估结果
  createdAt: number;             // 创建时间戳
}

/**
 * 历史记录验证Schema
 */
export const HistoryRecordSchema = z.object({
  id: z.string().uuid('ID必须是有效的UUID'),
  input: EvaluationInputSchema,
  result: EvaluationResultSchema,
  createdAt: z.number(),
});

/**
 * 练习题目数据结构
 */
export interface PracticeQuestion {
  id: string;
  type: 'translation' | 'writing' | 'completion';
  title: string;
  directions: string;
  essayContext: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * 练习题目验证Schema
 */
export const PracticeQuestionSchema = z.object({
  id: z.string().min(1, '题目ID不能为空'),
  type: z.enum(['translation', 'writing', 'completion']),
  title: z.string().min(1, '题目标题不能为空'),
  directions: z.string().min(1, '题目要求不能为空'),
  essayContext: z.string().min(1, '文章语境不能为空'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

/**
 * 验证错误数据结构
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API错误响应数据结构
 */
export interface APIError {
  error: string;           // 错误类型
  message: string;         // 用户友好的错误消息
  code?: number;           // HTTP状态码
  retryable: boolean;      // 是否可重试
}

/**
 * API错误响应验证Schema
 */
export const APIErrorSchema = z.object({
  error: z.string().min(1, '错误类型不能为空'),
  message: z.string().min(1, '错误消息不能为空'),
  code: z.number().optional(),
  retryable: z.boolean(),
});

/**
 * localStorage历史记录存储结构
 */
export interface HistoryStorage {
  records: HistoryRecord[];
  version: string;
}

/**
 * localStorage历史记录存储验证Schema
 */
export const HistoryStorageSchema = z.object({
  records: z.array(HistoryRecordSchema).max(10, '历史记录最多保存10条'),
  version: z.string(),
});
