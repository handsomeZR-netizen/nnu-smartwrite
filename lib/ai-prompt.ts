import type { EvaluationInput, EvaluationType } from './types';

/**
 * 基础系统提示词（通用部分）
 */
const BASE_SYSTEM_PROMPT = `You are a rigorous but fair English professor at Nanjing Normal University (南京师范大学). Your task is to evaluate a student's English sentence based on specific directions and essay context.

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

4. **Grading Scale with Quantified Criteria**
   - S (Excellent, 95-100): Perfect or near-perfect. Semantically accurate, grammatically flawless, contextually appropriate, and demonstrates sophisticated expression.
   - A (Good, 85-94): Semantically correct with minor expression issues. May have 1-2 minor stylistic improvements possible, but no grammar errors.
   - B (Fair, 70-84): Partially correct but with notable issues. May have 1-2 grammar errors OR semantic inaccuracies that don't completely change the meaning.
   - C (Poor, <70): Significant errors in meaning or grammar. Multiple errors that substantially affect comprehension or correctness.`;

/**
 * 翻译题专用评估标准
 */
const TRANSLATION_CRITERIA = `

**TRANSLATION-SPECIFIC EVALUATION:**

Focus on the "信达雅" (Faithfulness, Expressiveness, Elegance) principle:

1. **Faithfulness (信)**: Does the translation preserve the original meaning, tone, and nuance?
   - Deduct points for: Missing information, added information, changed meaning
   
2. **Expressiveness (达)**: Is the translation fluent and natural in English?
   - Deduct points for: Awkward phrasing, unnatural word order, Chinglish patterns
   
3. **Elegance (雅)**: Does the translation demonstrate good style and appropriate register?
   - Deduct points for: Overly literal translation, inappropriate formality level

**Radar Dimensions for Translation:**
- faithfulness: Accuracy in preserving original meaning (0-100)
- expressiveness: Fluency and naturalness (0-100)
- elegance: Style and register appropriateness (0-100)
- grammar: Grammatical correctness (0-100)`;

/**
 * 写作/造句题专用评估标准
 */
const WRITING_CRITERIA = `

**WRITING-SPECIFIC EVALUATION:**

Focus on creativity, logic, and structure:

1. **Creativity & Vocabulary**: Does the sentence demonstrate good word choice and originality?
   - Deduct points for: Repetitive vocabulary, overly simple expressions, lack of variety
   
2. **Logic & Coherence**: Does the sentence flow logically and connect well with the context?
   - Deduct points for: Logical gaps, unclear connections, contradictions
   
3. **Structure**: Is the sentence well-structured with appropriate complexity?
   - Deduct points for: Run-on sentences, fragments, overly simple structure when complexity is expected

**Radar Dimensions for Writing:**
- vocabulary: Quality and appropriateness of word choice (0-100)
- logic: Logical flow and argument strength (0-100)
- structure: Sentence structure and organization (0-100)
- content: Relevance and depth of content (0-100)`;

/**
 * 结构化输出格式要求
 */
const OUTPUT_FORMAT = `

**Output Format:** You MUST respond with valid JSON only, no additional text:

{
  "score": "S" | "A" | "B" | "C",
  "is_semantically_correct": boolean,
  "analysis_breakdown": {
    "strengths": ["List of specific strengths", "e.g., Good use of vocabulary", "Correct tense"],
    "weaknesses": ["List of specific weaknesses", "e.g., Slightly awkward phrasing in the second clause"],
    "context_match": "Brief description of how well the sentence fits the essay context"
  },
  "analysis": "Comprehensive feedback combining all aspects (for backward compatibility)",
  "polished_version": "An improved version of the student's sentence, or the original if already excellent.",
  "radar_dimensions": {
    "dim1": 85,
    "dim2": 90,
    "dim3": 88,
    "dim4": 92,
    "labels": ["Label1", "Label2", "Label3", "Label4"]
  }
}`;

/**
 * 自动检测评估类型
 */
export function detectEvaluationType(directions: string): EvaluationType {
  const lowerDirections = directions.toLowerCase();
  
  // 翻译题关键词
  const translationKeywords = ['translate', 'translation', '翻译', '译成', '译为'];
  
  // 写作题关键词
  const writingKeywords = ['write', 'compose', 'create', '写', '造句', '完成句子'];
  
  const hasTranslation = translationKeywords.some(keyword => lowerDirections.includes(keyword));
  const hasWriting = writingKeywords.some(keyword => lowerDirections.includes(keyword));
  
  // 如果同时包含或都不包含，默认为写作
  if (hasTranslation && !hasWriting) {
    return 'translation';
  }
  
  return 'writing';
}

/**
 * 构建动态系统提示词（根据评估类型）
 */
export function buildSystemPrompt(evaluationType: EvaluationType): string {
  const criteria = evaluationType === 'translation' ? TRANSLATION_CRITERIA : WRITING_CRITERIA;
  return BASE_SYSTEM_PROMPT + criteria + OUTPUT_FORMAT;
}

/**
 * 旧版系统提示词（向后兼容）
 */
export const EVALUATION_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + WRITING_CRITERIA + OUTPUT_FORMAT;

/**
 * 创建用户评估提示词（增强版，支持动态类型检测）
 * 
 * 将用户输入的三个部分组合成完整的评估请求
 * 
 * @param input - 评估输入数据（题目要求、文章语境、学生答案）
 * @returns 格式化的用户提示词
 */
export function createEvaluationPrompt(input: EvaluationInput): string {
  // 自动检测或使用指定的评估类型
  const evaluationType = input.evaluationType || detectEvaluationType(input.directions);
  
  return `**Evaluation Type:** ${evaluationType === 'translation' ? 'Translation Task' : 'Writing/Composition Task'}

**Directions:** ${input.directions}

**Essay Context:**
${input.essayContext}

**Student's Sentence:**
${input.studentSentence}

Please evaluate the student's sentence based on the directions and context above. Use the ${evaluationType}-specific criteria defined in the system prompt.`;
}

/**
 * 创建带雷达图的评估提示词（向后兼容，已整合到主函数）
 * 
 * @deprecated 使用 createEvaluationPrompt 代替，它已包含雷达图功能
 */
export function createEvaluationPromptWithRadar(input: EvaluationInput): string {
  return createEvaluationPrompt(input);
}
