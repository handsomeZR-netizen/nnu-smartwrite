import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EvaluationInput, ValidationError } from "./types";
import { EvaluationInputSchema } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 验证评估输入数据
 * 
 * 检查所有必填字段是否存在且符合长度限制
 * 
 * @param input - 待验证的评估输入
 * @returns 验证错误数组，如果为空则表示验证通过
 */
export function validateInput(input: Partial<EvaluationInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证directions字段
  if (!input.directions || !input.directions.trim()) {
    errors.push({ field: 'directions', message: '请输入题目要求' });
  } else if (input.directions.length > 500) {
    errors.push({ field: 'directions', message: '题目要求不能超过500字符' });
  }

  // 验证essayContext字段
  if (!input.essayContext || !input.essayContext.trim()) {
    errors.push({ field: 'essayContext', message: '请输入文章语境' });
  } else if (input.essayContext.length > 2000) {
    errors.push({ field: 'essayContext', message: '文章语境不能超过2000字符' });
  }

  // 验证studentSentence字段
  if (!input.studentSentence || !input.studentSentence.trim()) {
    errors.push({ field: 'studentSentence', message: '请输入你的答案' });
  } else if (input.studentSentence.length > 1000) {
    errors.push({ field: 'studentSentence', message: '学生答案不能超过1000字符' });
  }

  return errors;
}

/**
 * 使用Zod验证评估输入
 * 
 * 提供更严格的类型验证和错误消息
 * 
 * @param input - 待验证的评估输入
 * @returns 验证结果对象，包含success标志和错误信息
 */
export function validateInputWithZod(input: unknown): {
  success: boolean;
  data?: EvaluationInput;
  errors?: ValidationError[];
} {
  const result = EvaluationInputSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ValidationError[] = result.error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, errors };
}

/**
 * 清理用户输入文本
 * 
 * 移除多余的空白字符，但保留必要的换行和段落结构
 * 
 * @param text - 待清理的文本
 * @returns 清理后的文本
 */
export function sanitizeInput(text: string): string {
  if (!text) return '';

  return text
    .trim() // 移除首尾空白
    .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
    .replace(/\n\s*\n/g, '\n') // 移除多余的空行
    .slice(0, 10000); // 防止超长输入
}

/**
 * 清理评估输入对象
 * 
 * 对输入对象的所有字段进行清理
 * 
 * @param input - 待清理的评估输入
 * @returns 清理后的评估输入
 */
export function sanitizeEvaluationInput(
  input: EvaluationInput
): EvaluationInput {
  return {
    directions: sanitizeInput(input.directions),
    essayContext: sanitizeInput(input.essayContext),
    studentSentence: sanitizeInput(input.studentSentence),
  };
}

/**
 * 检查输入是否完整
 * 
 * 快速检查所有必填字段是否非空
 * 
 * @param input - 待检查的评估输入
 * @returns 如果所有字段都非空则返回true
 */
export function isInputComplete(input: Partial<EvaluationInput>): boolean {
  return !!(
    input.directions?.trim() &&
    input.essayContext?.trim() &&
    input.studentSentence?.trim()
  );
}

/**
 * 格式化错误消息
 * 
 * 将验证错误数组转换为用户友好的错误消息字符串
 * 
 * @param errors - 验证错误数组
 * @returns 格式化的错误消息
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  
  return errors.map((err) => `• ${err.message}`).join('\n');
}

/**
 * 生成唯一ID
 * 
 * 使用时间戳和随机数生成简单的唯一标识符
 * 
 * @returns UUID格式的字符串
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 格式化时间戳
 * 
 * 将时间戳转换为可读的日期时间字符串
 * 
 * @param timestamp - Unix时间戳（毫秒）
 * @returns 格式化的日期时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 截断文本
 * 
 * 如果文本超过指定长度，则截断并添加省略号
 * 
 * @param text - 待截断的文本
 * @param maxLength - 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * 获取评分等级的颜色类名
 * 
 * 根据评分等级返回对应的Tailwind CSS类名
 * 
 * @param score - 评分等级 (S/A/B/C)
 * @returns Tailwind CSS类名字符串
 */
export function getScoreColor(score: string): string {
  switch (score) {
    case 'S':
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 'A':
      return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
    case 'B':
      return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    case 'C':
      return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    default:
      return 'bg-gray-300 text-gray-700';
  }
}

/**
 * 获取评分等级的文本描述
 * 
 * @param score - 评分等级 (S/A/B/C)
 * @returns 评分等级的中文描述
 */
export function getScoreLabel(score: string): string {
  switch (score) {
    case 'S':
      return '优秀';
    case 'A':
      return '良好';
    case 'B':
      return '中等';
    case 'C':
      return '需改进';
    default:
      return '未知';
  }
}
