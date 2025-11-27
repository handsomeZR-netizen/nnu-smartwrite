# AI 功能使用示例

## 📖 翻译题示例

### 输入
```
Directions: Translate the following Chinese sentence into English
Essay Context: 教育是社会发展的基石。
Student Sentence: Education is the cornerstone of social development.
```

### AI 响应
```json
{
  "score": "S",
  "is_semantically_correct": true,
  "evaluationType": "translation",
  "analysis_breakdown": {
    "strengths": [
      "Perfect translation of '基石' as 'cornerstone'",
      "Accurate use of 'social development'",
      "Natural English phrasing"
    ],
    "weaknesses": [],
    "context_match": "Excellent fit with the educational theme"
  },
  "polished_version": "Education is the cornerstone of social development.",
  "radar_dimensions": {
    "dim1": 98,
    "dim2": 95,
    "dim3": 92,
    "dim4": 100,
    "labels": ["信 (Faithfulness)", "达 (Expressiveness)", "雅 (Elegance)", "语法 (Grammar)"]
  },
  "reasoning_process": "The student's translation accurately captures the meaning of the original Chinese sentence. The word choice 'cornerstone' is an excellent metaphorical translation of '基石', demonstrating both semantic accuracy and stylistic elegance..."
}
```

---

## ✍️ 写作题示例

### 输入
```
Directions: Write a sentence about the importance of lifelong learning
Essay Context: In today's rapidly changing world, continuous education has become essential.
Student Sentence: Lifelong learning helps people adapt to new challenges and stay competitive.
```

### AI 响应
```json
{
  "score": "A",
  "is_semantically_correct": true,
  "evaluationType": "writing",
  "analysis_breakdown": {
    "strengths": [
      "Clear and concise expression",
      "Good use of 'adapt to' and 'stay competitive'",
      "Logical connection to the context"
    ],
    "weaknesses": [
      "Could use more sophisticated vocabulary (e.g., 'navigate' instead of 'adapt to')",
      "Sentence structure is somewhat simple"
    ],
    "context_match": "Directly addresses the theme of continuous education"
  },
  "polished_version": "Lifelong learning empowers individuals to navigate emerging challenges and maintain their competitive edge in an evolving landscape.",
  "radar_dimensions": {
    "dim1": 85,
    "dim2": 90,
    "dim3": 82,
    "dim4": 88,
    "labels": ["词汇 (Vocabulary)", "逻辑 (Logic)", "结构 (Structure)", "内容 (Content)"]
  },
  "reasoning_process": "The sentence demonstrates good understanding of the topic. The vocabulary is appropriate but could be more sophisticated. The logical flow is clear, connecting lifelong learning to adaptation and competitiveness..."
}
```

---

## 🔄 同义词接受示例

### 输入
```
Directions: Complete the sentence about social responsibility
Essay Context: Citizens should contribute to their communities.
Student Sentence: Everyone has a civic duty to help society.
```

### AI 响应
```json
{
  "score": "S",
  "is_semantically_correct": true,
  "analysis_breakdown": {
    "strengths": [
      "Excellent synonym: 'civic duty' = 'social responsibility'",
      "Strong verb choice: 'help society' = 'contribute to communities'",
      "Clear and direct expression"
    ],
    "weaknesses": [],
    "context_match": "Perfect alignment with the theme of community contribution"
  },
  "polished_version": "Everyone has a civic duty to help society.",
  "reasoning_process": "The student used 'civic duty' which is a perfect synonym for 'social responsibility'. This demonstrates understanding of semantic equivalence rather than just memorizing exact phrases..."
}
```

---

## 🎯 前端交互示例

### 1. 查看 AI 推理过程
```tsx
// 用户点击按钮
<button onClick={() => setShowReasoning(!showReasoning)}>
  {showReasoning ? '隐藏' : '查看'} AI 推理过程
</button>

// 展开后显示
{showReasoning && (
  <div className="reasoning-box">
    {result.reasoningProcess}
  </div>
)}
```

### 2. 雷达图交互
```tsx
// 点击雷达图维度
<RadarChart 
  dimensions={result.radarDimensions}
  onDimensionClick={(dimension) => {
    setSelectedDimension(dimension);
    // 高亮对应的分析部分
  }}
/>

// 高亮显示
{selectedDimension && (
  <div className="highlight">
    已选择维度: {selectedDimension}
  </div>
)}
```

### 3. 结构化反馈展示
```tsx
// 优点列表
<div className="strengths">
  <h4>✨ 优点</h4>
  <ul>
    {analysisBreakdown.strengths.map(item => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</div>

// 缺点列表
<div className="weaknesses">
  <h4>⚠️ 需要改进</h4>
  <ul>
    {analysisBreakdown.weaknesses.map(item => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</div>
```

---

## 🧪 测试用例

### 测试 1: 翻译题识别
```typescript
const input = {
  directions: "请将以下句子翻译成英文",
  essayContext: "...",
  studentSentence: "..."
};

const result = await evaluate(input);
expect(result.evaluationType).toBe('translation');
expect(result.radarDimensions.labels).toContain('信');
```

### 测试 2: 写作题识别
```typescript
const input = {
  directions: "Write a sentence about...",
  essayContext: "...",
  studentSentence: "..."
};

const result = await evaluate(input);
expect(result.evaluationType).toBe('writing');
expect(result.radarDimensions.labels).toContain('词汇');
```

### 测试 3: 结构化反馈
```typescript
const result = await evaluate(input);
expect(result.analysisBreakdown).toBeDefined();
expect(result.analysisBreakdown.strengths).toBeInstanceOf(Array);
expect(result.analysisBreakdown.weaknesses).toBeInstanceOf(Array);
expect(result.analysisBreakdown.contextMatch).toBeString();
```

---

## 💡 最佳实践

### 1. 提示词编写
- **明确任务类型**：在 directions 中使用 "translate" 或 "write"
- **提供充足语境**：essayContext 应包含足够的背景信息
- **避免歧义**：directions 应清晰明确

### 2. 结果解读
- **S 级**：可直接使用，无需修改
- **A 级**：语义正确，可参考润色建议优化表达
- **B 级**：需要修改，重点关注 weaknesses 列表
- **C 级**：需要重写，参考 polished_version

### 3. 雷达图使用
- **翻译题**：重点关注"信"（忠实度）
- **写作题**：平衡发展各维度
- **点击交互**：针对薄弱维度查看详细建议

---

## 🔗 相关资源

- [API 文档](./AI_PROMPT_OPTIMIZATION.md)
- [实施总结](./AI_UPGRADE_SUMMARY.md)
- [DeepSeek 官方文档](https://api-docs.deepseek.com/)

---

**更新日期**: 2025-11-26
