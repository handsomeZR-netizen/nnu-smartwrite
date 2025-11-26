import { z } from 'zod';

/**
 * 评估输入数据结构
 */
export interface EvaluationInput {
  directions: string;      // 题目要求
  essayContext: string;    // 文章语境
  studentSentence: string; // 学生答案
}

/**
 * 评估输入验证Schema
 */
export const EvaluationInputSchema = z.object({
  directions: z.string().trim().min(1, '题目要求不能为空').max(500, '题目要求不能超过500字符'),
  essayContext: z.string().trim().min(1, '文章语境不能为空').max(2000, '文章语境不能超过2000字符'),
  studentSentence: z.string().trim().min(1, '学生答案不能为空').max(1000, '学生答案不能超过1000字符'),
});

/**
 * 评估结果数据结构
 */
export interface EvaluationResult {
  score: 'S' | 'A' | 'B' | 'C';           // 等级评分
  isSemanticallyCorrect: boolean;         // 语义正确性标志
  analysis: string;                       // 详细分析文本
  polishedVersion: string;                // 润色建议
  radarScores?: {                         // 可选：雷达图数据
    vocabulary: number;    // 词汇 (0-100)
    grammar: number;       // 语法 (0-100)
    coherence: number;     // 连贯性 (0-100)
    structure: number;     // 结构 (0-100)
  };
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
