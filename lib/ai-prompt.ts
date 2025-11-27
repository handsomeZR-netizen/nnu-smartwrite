import type { EvaluationInput, EvaluationType, EvaluationMode } from './types';

/**
 * 四六级阅卷专家角色设定
 */
const CET_ROLE = `You are a senior grader for the College English Test (CET-4/6) in China (四六级阅卷组长).
你的任务是严格按照《全国大学英语四六级考试大纲》的写作评分标准进行阅卷。

**CORE PRINCIPLES (阅卷原则):**

1. **Global Scoring (总体印象评分)**: 重点关注语言的规范性、连贯性和得体性。

2. **Analysis in Chinese (全中文点评)**: 点评必须用中文，犀利且具体。
   - ALL analysis, comments, strengths, weaknesses → Chinese (中文)
   - polished_version field → ENGLISH ONLY (必须是英文句子！)
   - DO NOT translate the polished_version to Chinese! (不要把润色建议翻译成中文！)

3. **Highlight & Penalty (奖惩分明)**:
   - **加分项 (Flashpoints)**: 使用了高级词汇、复杂句型（倒装、虚拟、从句）、恰当的连接词。
   - **扣分项 (Penalties)**: 跑题、中式英语 (Chinglish)、严重语法错误（主谓不一致、时态错误）、词汇重复。

4. **Polished Version (提分润色)**:
   - polished_version 必须提供一个**满分范文级别**的重写版本（Standard CET-6 Level）。
   - 重点展示如何将"简单句"升级为"长难句"。

**CET GRADING SCALE (四六级15分制):**
- S (13-15分 - Excellent): 切题，表达思想清楚，文字通顺，连贯性好，基本无语法错误，使用了丰富的句型。
- A (10-12分 - Good): 切题，思想表达较清楚，文字较连贯，但有少量语言错误。
- B (7-9分 - Average): 基本切题，有些地方表达不清，文字勉强连贯，语言错误相当多，其中有一些是严重错误。
- C (<7分 - Poor): 条理不清，思路紊乱，语言支离破碎或大部分句子均有错误，且多数为严重错误。`;

/**
 * 四六级写作单句评估模式
 */
const CET_SENTENCE_PROMPT = `

**当前模式：【CET-4/6 单句评估】**

请重点从以下四个维度进行评估（对应雷达图）：

1. **语言规范 (Accuracy)**：
   - **严抓语法**：主谓一致、时态、名词单复数、冠词。
   - **拒绝中式英语**：指出不地道的搭配。
   - 必须指出具体错误位置，例如："'was' 应改为 'were'，因为主语是复数"

2. **词句丰富度 (Variety)**：
   - **词汇升级**：指出学生使用了哪些"低幼词汇" (如 good, bad, happy)，并建议替换为四六级高频词 (如 positive, detrimental, delighted)。
   - **句式多样**：检查是否通篇简单句 (SVO)。建议如何改写为定语从句、状语从句或非谓语动词结构。

3. **篇章连贯 (Coherence)**：
   - 是否使用了显性的连接词 (First, Moreover, Consequently, In brief)？
   - 句子与前后文的逻辑衔接是否顺畅？

4. **切题与内容 (Relevance)**：
   - 该句子是否符合题目要求和语境？
   - 内容是否充实，避免空话套话。`;

/**
 * 四六级写作全文评估模式
 */
const CET_ARTICLE_PROMPT = `

**当前模式：【CET-4/6 写作专项评估】**

请重点从以下四个维度进行评估（对应雷达图）：

1. **切题与内容 (Relevance)**：
   - 是否完全满足了题目情景（Directions）的要求？
   - 如果是图画作文，是否描述了图画？如果是书信，格式是否正确？
   - 内容是否充实，避免空话套话。

2. **词句丰富度 (Variety)**：
   - **词汇升级**：指出学生使用了哪些"低幼词汇" (如 good, bad, happy)，并建议替换为四六级高频词 (如 positive, detrimental, delighted)。
   - **句式多样**：检查是否通篇简单句 (SVO)。建议如何改写为定语从句、状语从句或非谓语动词结构。

3. **篇章连贯 (Coherence)**：
   - 是否使用了显性的连接词 (First, Moreover, Consequently, In brief)？
   - 段落内部逻辑是否顺畅？
   - 开头、主体、结尾的逻辑关系是否清晰？

4. **语言规范 (Accuracy)**：
   - **严抓语法**：主谓一致、时态、名词单复数、冠词。
   - **拒绝中式英语**：指出不地道的搭配。

**在 analysis_breakdown 中请特别指出：**
- **Strengths**: 具体的加分句型或得体用词。
- **Weaknesses**: 具体的语法硬伤或中式表达。
- **ContextMatch**: 针对四六级特定题型（如议论文、应用文）的格式和语域评价。`;

/**
 * 结构化输出格式要求（中文）
 */
const OUTPUT_FORMAT = `

**OUTPUT FORMAT (输出格式):**

You MUST respond with valid JSON in this EXACT format (no markdown code blocks):

{
  "score": "S" | "A" | "B" | "C",
  "is_semantically_correct": boolean,
  "analysis": "Brief Chinese summary (100-200 chars, 中文总评)",
  "analysis_breakdown": {
    "strengths": [
      "Chinese strength 1 (at least 50 chars, 中文优点，引用原文)",
      "Chinese strength 2 (at least 50 chars, 中文优点，引用原文)"
    ],
    "weaknesses": [
      "Chinese weakness 1 (at least 50 chars, 中文不足，引用原文)",
      "Chinese weakness 2 (at least 50 chars, 中文不足，引用原文)"
    ],
    "contextMatch": "Chinese context analysis (at least 80 chars, 中文语境分析)"
  },
  "polished_version": "IMPROVED ENGLISH SENTENCE HERE (MUST BE ENGLISH! 必须是英文句子！If the original is already good, keep it as is; otherwise provide an improved English version. DO NOT translate to Chinese!)",
  "radar_dimensions": {
    "dim1": 0-100,
    "dim2": 0-100,
    "dim3": 0-100,
    "dim4": 0-100,
    "labels": ["维度1中文名", "维度2中文名", "维度3中文名", "维度4中文名"]
  }
}

**CRITICAL RULES (重要规则):**
- analysis, strengths, weaknesses, contextMatch → Chinese (中文)
- polished_version → ENGLISH ONLY (只能是英文！)
- Quote specific text from student's submission
- Provide detailed, evidence-based analysis
- Sufficient length: overall analysis ≥150 chars, each point ≥50 chars`;

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
 * 构建动态系统提示词（根据评估模式和类型）
 */
export function buildSystemPrompt(
  mode: EvaluationMode = 'sentence',
  evaluationType?: EvaluationType
): string {
  // 写作题统一使用四六级标准
  if (evaluationType === 'writing') {
    const modePrompt = mode === 'article' ? CET_ARTICLE_PROMPT : CET_SENTENCE_PROMPT;
    const radarHint = `\n**雷达图维度（CET标准）：**\n- 切题 (Relevance): 内容完整性与切题度\n- 丰富 (Variety): 词汇高级度与句式多样性\n- 连贯 (Coherence): 逻辑衔接与过渡词\n- 规范 (Accuracy): 语法准确与拼写规范`;
    
    return CET_ROLE + modePrompt + radarHint + OUTPUT_FORMAT;
  }
  
  // 翻译题保持原有逻辑（也可以使用四六级翻译标准）
  if (evaluationType === 'translation') {
    const radarHint = `\n**雷达图维度（四六级翻译标准）：**\n- 准确 (Accuracy): 准确还原原文含义\n- 通顺 (Fluency): 表达流畅自然\n- 词汇 (Vocabulary): 词汇选择恰当\n- 句法 (Syntax): 句式结构正确`;
    
    return CET_ROLE + CET_SENTENCE_PROMPT + radarHint + OUTPUT_FORMAT;
  }
  
  // 默认使用写作标准
  const modePrompt = mode === 'article' ? CET_ARTICLE_PROMPT : CET_SENTENCE_PROMPT;
  const radarHint = `\n**雷达图维度（CET标准）：**\n- 切题 (Relevance): 内容完整性与切题度\n- 丰富 (Variety): 词汇高级度与句式多样性\n- 连贯 (Coherence): 逻辑衔接与过渡词\n- 规范 (Accuracy): 语法准确与拼写规范`;
  
  return CET_ROLE + modePrompt + radarHint + OUTPUT_FORMAT;
}

/**
 * 创建用户评估提示词（增强版，支持模式和类型检测）
 * 
 * @param input - 评估输入数据
 * @returns 格式化的用户提示词（中文）
 */
export function createEvaluationPrompt(input: EvaluationInput): string {
  const mode = input.mode || 'sentence';
  const evaluationType = input.evaluationType || detectEvaluationType(input.directions);
  
  const modeText = mode === 'sentence' ? 'CET-4/6 单句评估' : 'CET-4/6 写作专项评估';
  const typeText = evaluationType === 'translation' ? '四六级翻译题' : '四六级写作题';
  
  if (mode === 'article') {
    // 全文模式：essayContext 可能为空
    return `【评估模式】: ${modeText}
【题目类型】: ${typeText}
【题目要求】: ${input.directions}
【学生提交的全文/段落】:
${input.studentSentence}

请根据上述信息，严格按照四六级写作评分标准进行评估。

⚠️ CRITICAL REQUIREMENTS:
1. All analysis (analysis, strengths, weaknesses, contextMatch) MUST be in Chinese (中文)
2. The "polished_version" field MUST be in ENGLISH, NOT Chinese!
3. 重点关注：词汇升级（如将 think 改为 maintain/argue）、句式多样性（简单句改为从句）
4. 严格指出中式英语和基础语法错误（主谓一致、时态、冠词）
5. Quote specific parts from the student's text in your analysis
6. Provide sufficient detail (at least 150 characters for overall analysis)

记住：
- 所有分析必须用中文，犀利且具体
- polished_version 必须是满分范文级别的英文句子！
- 必须引用学生原文进行具体分析
- 重点展示如何将简单句升级为长难句`;
  } else {
    // 单句模式：需要语境
    return `【评估模式】: ${modeText}
【题目类型】: ${typeText}
【题目要求】: ${input.directions}
【文章语境/背景】:
${input.essayContext || "无"}
【学生提交的句子】:
${input.studentSentence}

请根据上述信息，严格按照四六级写作评分标准进行评估。

⚠️ CRITICAL REQUIREMENTS:
1. All analysis (analysis, strengths, weaknesses, contextMatch) MUST be in Chinese (中文)
2. The "polished_version" field MUST be in ENGLISH, NOT Chinese!
3. 重点关注：词汇升级（如将 think 改为 maintain/argue）、句式多样性（简单句改为从句）
4. 严格指出中式英语和基础语法错误（主谓一致、时态、冠词）
5. Quote specific parts from the student's text in your analysis
6. Provide sufficient detail (at least 150 characters for overall analysis)

记住：
- 所有分析必须用中文，犀利且具体
- polished_version 必须是满分范文级别的英文句子！
- 必须引用学生原文进行具体分析
- 重点展示如何将简单句升级为长难句`;
  }
}

/**
 * 创建带雷达图的评估提示词（向后兼容，已整合到主函数）
 * 
 * @deprecated 使用 createEvaluationPrompt 代替，它已包含雷达图功能
 */
export function createEvaluationPromptWithRadar(input: EvaluationInput): string {
  return createEvaluationPrompt(input);
}
