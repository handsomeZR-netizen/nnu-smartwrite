import type { EvaluationInput } from './types';

/**
 * DeepSeek AI评估系统提示词
 * 
 * 这是系统最关键的部分，决定了AI评估的准确性和公平性。
 * 
 * 核心原则：
 * 1. 接受同义词和逻辑等价表达
 * 2. 基于语义正确性评估
 * 3. 提供建设性反馈
 * 4. 使用明确的评分标准
 */
export const EVALUATION_SYSTEM_PROMPT = `You are a rigorous but fair English professor at Nanjing Normal University (南京师范大学). Your task is to evaluate a student's English sentence based on specific directions and essay context.

**CRITICAL RULES:**

1. **Accept Synonyms and Logical Equivalents**
   - If the standard answer is "social responsibility", accept "social obligation", "community duty", or "civic responsibility"
   - If the standard is "adult education", accept "lifelong learning" or "continuing education"
   - If the standard is "It is common that...", accept "It is ordinary that..." or "It is usual that..."

2. **Evaluate Semantic Correctness**
   - Check if the student's sentence conveys the same meaning as expected
   - Consider grammar, tone, tense, and logical coherence with the essay context
   - Accept different sentence structures if the meaning is preserved

3. **Provide Constructive Feedback**
   - Explain specifically why a synonym works or doesn't work
   - Point out grammar or tense errors if present
   - Suggest improvements in the polished version

4. **Grading Scale**
   - S (Excellent): Perfect or near-perfect, semantically accurate with good expression
   - A (Good): Semantically correct with minor expression issues
   - B (Fair): Partially correct but with notable grammar or semantic issues
   - C (Poor): Significant errors in meaning or grammar

**Output Format:** You MUST respond with valid JSON only, no additional text:

{
  "score": "S" | "A" | "B" | "C",
  "is_semantically_correct": boolean,
  "analysis": "Detailed feedback explaining the evaluation. If synonyms are used, explicitly mention them. If there are errors, point them out specifically.",
  "polished_version": "An improved version of the student's sentence, or the original if already excellent."
}`;

/**
 * 创建用户评估提示词
 * 
 * 将用户输入的三个部分组合成完整的评估请求
 * 
 * @param input - 评估输入数据（题目要求、文章语境、学生答案）
 * @returns 格式化的用户提示词
 */
export function createEvaluationPrompt(input: EvaluationInput): string {
  return `**Directions:** ${input.directions}

**Essay Context:**
${input.essayContext}

**Student's Sentence:**
${input.studentSentence}

Please evaluate the student's sentence based on the directions and context above.`;
}

/**
 * 创建带雷达图的评估提示词（用于写作类型题目）
 * 
 * @param input - 评估输入数据
 * @returns 包含雷达图要求的提示词
 */
export function createEvaluationPromptWithRadar(input: EvaluationInput): string {
  return `**Directions:** ${input.directions}

**Essay Context:**
${input.essayContext}

**Student's Sentence:**
${input.studentSentence}

Please evaluate the student's sentence based on the directions and context above.

Additionally, provide radar chart scores (0-100) for the following dimensions:
- vocabulary: Quality and appropriateness of word choice
- grammar: Grammatical accuracy and correctness
- coherence: Logical flow and connection of ideas
- structure: Sentence structure and organization

Include these scores in your JSON response under the "radar_scores" field.`;
}
