# 🎓 四六级评分标准升级说明

## ✅ 升级完成

系统已成功从通用/考研评分标准升级到**四六级（CET-4/6）专业评分标准**！

## 🎯 核心特性

### 1. 专业的四六级阅卷标准
- ✅ 严格按照《全国大学英语四六级考试大纲》评分
- ✅ 采用 15 分制（S: 13-15分, A: 10-12分, B: 7-9分, C: <7分）
- ✅ 总体印象评分法（Global Scoring）

### 2. 精准的词汇升级建议
```
❌ I think it is very good
✅ It is widely acknowledged that it is exceedingly beneficial

AI 会明确指出：
- "think" 太简单 → 建议使用 "maintain", "argue", "contend"
- "very good" 太低幼 → 建议使用 "exceedingly beneficial", "highly positive"
```

### 3. 具体的句式改进指导
```
❌ Reading is important. It can help us.
✅ Reading, which plays an indispensable role in personal development, 
   significantly enhances our cognitive abilities.

AI 会展示：
- 如何将简单句合并为复杂句
- 如何使用定语从句、状语从句
- 如何使用非谓语动词结构
```

### 4. 严格的语法检查
```
零容忍基础错误：
❌ people's life becomes → ✅ people's lives become (主谓一致)
❌ do exercise → ✅ take exercise (中式英语)
❌ protect environment → ✅ protect the environment (冠词)
```

## 📊 雷达图维度

### 写作题（4个维度）
- **切题 (Relevance)** - 内容是否完全符合题目要求
- **丰富 (Variety)** - 词汇是否高级、句式是否多样
- **连贯 (Coherence)** - 是否使用连接词、逻辑是否清晰
- **规范 (Accuracy)** - 语法、拼写是否正确

### 翻译题（4个维度）
- **准确 (Accuracy)** - 是否准确还原原文含义
- **通顺 (Fluency)** - 表达是否流畅自然
- **词汇 (Vocabulary)** - 词汇选择是否恰当
- **句法 (Syntax)** - 句式结构是否正确

## 🧪 测试验证

### 快速验证
```bash
cd nnu-smartwrite
node verify-cet-standard.js
```

### 完整测试（4个测试用例）
```bash
node test-cet-evaluation.js
```

测试用例包括：
1. ✅ 写作题 - 简单句（词汇低幼）
2. ✅ 写作题 - 中式英语
3. ✅ 翻译题 - 四六级标准
4. ✅ 全文写作 - 四六级议论文

## 📁 修改的文件

### 核心文件
- `lib/ai-prompt.ts` - AI 提示词配置（四六级角色、评估标准）
- `app/api/evaluate/route.ts` - 评估 API（雷达图标签、模拟响应）

### 测试文件
- `test-cet-evaluation.js` - 完整测试套件
- `verify-cet-standard.js` - 快速验证脚本

### 文档文件
- `doc/四六级评分标准升级文档.md` - 详细升级说明
- `doc/评分标准对比.md` - 考研 vs 四六级对比
- `CET_UPGRADE_README.md` - 本文件

## 🚀 使用方法

### 1. 启动开发服务器
```bash
cd nnu-smartwrite
npm run dev
```

### 2. 访问评估页面
```
http://localhost:3000/evaluate
```

### 3. 输入内容进行评估

**写作题示例：**
```
题目要求: Write about the importance of reading.
学生句子: I think reading is very good.
```

**AI 评估结果：**
```
评分: B (7-9分)

不足:
- 词汇重复且低幼，连续使用'think'和'good'等基础词汇
- 句式过于简单，都是SVO结构，没有使用任何从句

润色建议:
It is widely acknowledged that reading plays an indispensable role 
in personal development, as it significantly enhances our cognitive 
abilities and broadens our horizons.

雷达图:
- 切题: 75/100
- 丰富: 45/100  ← 明确指出词汇和句式问题
- 连贯: 60/100
- 规范: 80/100
```

## 💡 四六级评分特点

### 加分项（Flashpoints）
- ✅ 使用高级词汇（maintain, contend, exceedingly）
- ✅ 使用复杂句型（定语从句、状语从句、倒装、虚拟）
- ✅ 使用恰当的连接词（Moreover, Consequently, In brief）
- ✅ 句式多样（长短句结合、非谓语结构）

### 扣分项（Penalties）
- ❌ 跑题（最严重）
- ❌ 中式英语（do exercise, open the light）
- ❌ 严重语法错误（主谓不一致、时态错误）
- ❌ 词汇重复（think, good, bad 反复出现）
- ❌ 拼写错误

## 📈 评分标准

| 等级 | 分数 | 描述 | 特征 |
|------|------|------|------|
| **S** | 13-15分 | Excellent | 切题、表达清楚、连贯性好、基本无语法错误、句型丰富 |
| **A** | 10-12分 | Good | 切题、表达较清楚、较连贯、有少量语言错误 |
| **B** | 7-9分 | Average | 基本切题、表达不够清晰、勉强连贯、语言错误较多 |
| **C** | <7分 | Poor | 条理不清、思路紊乱、语言支离破碎、严重错误多 |

## 🎓 适用场景

### 最适合
- ✅ 本科生四六级备考
- ✅ 基础英语能力提升
- ✅ 词汇和句式训练
- ✅ 避免中式英语

### 也适用于
- ✅ 高中生英语写作
- ✅ 专升本英语考试
- ✅ 日常英语写作练习

## 🔧 配置说明

### API 配置
系统支持两种模式：

1. **正式模式**（需要 API Key）
   - 在 `.env.local` 中配置 `DEEPSEEK_API_KEY`
   - 或在设置页面配置自定义 API

2. **测试模式**（无需 API Key）
   - 自动返回模拟数据
   - 用于功能测试和演示

### 自定义 API
在设置页面可以配置：
- API Endpoint
- API Key
- API Model（推荐 `deepseek-chat`）

## 📚 相关文档

- [四六级评分标准升级文档](./doc/四六级评分标准升级文档.md) - 详细技术说明
- [评分标准对比](./doc/评分标准对比.md) - 考研 vs 四六级对比
- [技术文档](./doc/技术文档.md) - 系统架构说明

## ❓ 常见问题

### Q: 为什么选择四六级标准而不是考研标准？
A: 本科生是主要用户群体，四六级是刚需考试。四六级标准更注重语言规范性和句式多样性，更适合基础能力提升。

### Q: 评估结果准确吗？
A: 系统严格按照《全国大学英语四六级考试大纲》设计，评分标准与官方阅卷标准一致。但 AI 评估仅供参考，最终成绩以官方为准。

### Q: 可以切换回考研标准吗？
A: 可以。修改 `lib/ai-prompt.ts` 中的角色定义和评估维度即可。建议保留四六级标准作为默认，可以添加"评估模式切换"功能。

### Q: 如何提高评分？
A: 根据 AI 的具体建议：
1. 替换低幼词汇（think → maintain）
2. 改写简单句为从句
3. 使用连接词增强连贯性
4. 避免中式英语
5. 检查基础语法错误

## 🎉 升级亮点

相比之前的通用标准，四六级标准：

| 特点 | 优势 |
|------|------|
| **更具体** | 明确指出低幼词汇和简单句 |
| **更实用** | 直接用于四六级备考 |
| **更严格** | 零容忍基础语法错误 |
| **更贴合** | 符合本科生学习需求 |
| **更专业** | 基于官方阅卷标准 |

## 📞 技术支持

如有问题，请查看：
- 测试日志：运行 `node test-cet-evaluation.js`
- 系统日志：查看浏览器控制台
- API 日志：查看服务器终端输出

---

**升级日期：** 2025-11-27  
**系统版本：** v2.0 (CET Standard)  
**状态：** ✅ 已完成并测试通过
