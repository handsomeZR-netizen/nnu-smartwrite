# NNU-SmartWrite (南师智评)

AI驱动的英语写作评价平台，专为南京师范大学学生设计。

## 项目简介

NNU-SmartWrite 是一个基于 DeepSeek 大语言模型的英语写作评估系统，提供语义级别的评价而非传统的精确匹配。系统接受同义词和逻辑等价表达，为学生提供更公平、更智能的写作反馈。

### 核心特性

- 🎯 **上下文感知评估**：基于题目要求、文章语境和学生答案的三维输入
- 🔄 **同义词识别**：接受语义等价的表达方式
- 📊 **多维度反馈**：等级评分、详细分析、润色建议和雷达图可视化
- 🎨 **南师大视觉主题**：融入校徽、校训和品牌色彩体系
- 💾 **本地历史记录**：使用 localStorage 保存最近10次评测
- 📱 **移动端优化**：响应式设计支持碎片化学习

## 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI组件**: shadcn/ui
- **AI引擎**: DeepSeek API (V3/R1)
- **图表**: Recharts
- **验证**: Zod

## 开始使用

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.local.example .env.local
```

2. 在 `.env.local` 中配置 DeepSeek API 密钥：
```
DEEPSEEK_API_KEY=your_api_key_here
```

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
nnu-smartwrite/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── practice/          # 练习大厅页面
│   ├── history/           # 历史记录页面
│   └── layout.tsx         # 全局布局
├── components/
│   ├── ui/                # shadcn/ui 基础组件
│   └── nnu/               # 南师大特色组件
├── lib/
│   ├── types.ts           # TypeScript 类型定义
│   ├── utils.ts           # 工具函数
│   ├── storage.ts         # localStorage 封装
│   └── ai-prompt.ts       # AI Prompt 模板
├── data/
│   └── practice-questions.json  # 静态题库数据
└── public/                # 静态资源
```

## 南师大主题色彩

- **深绿色** (#1F6A52): 导航栏、主标题
- **暖珊瑚橙** (#FF7F50): CTA按钮、强调元素
- **青瓷绿** (#5DB090): 辅助色
- **银杏黄** (#F4B860): 校训展示
- **米宣纸色** (#F9F7F2): 页面背景

## 开发指南

详细的设计文档和需求文档请参考 `.kiro/specs/nnu-smartwrite/` 目录。

## 部署

### 部署到 Netlify

本项目已配置好 Netlify 部署。详细步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

**快速部署**：

1. 将代码推送到 GitHub
2. 在 Netlify 导入项目
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 点击部署

**部署前检查**：

使用 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 确保所有配置正确。

### 环境变量

生产环境需要以下环境变量：

- `DEEPSEEK_API_KEY` (必需): DeepSeek API 密钥
- `NEXT_PUBLIC_APP_URL` (推荐): 应用的公开 URL

### 安全配置

项目已配置以下安全措施（符合需求 8.3）：

- ✅ API 密钥服务端保护
- ✅ HTTP 安全头（X-Frame-Options, CSP 等）
- ✅ 输入验证和清理
- ✅ 客户端速率限制

## 测试

```bash
# 运行所有测试
npm run test

# 运行测试并监听变化
npm run test:watch

# 运行测试 UI
npm run test:ui
```

## 代码质量

```bash
# 检查代码质量
npm run lint

# 格式化代码
npm run format
```

## License

MIT
