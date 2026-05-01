# Nnu Smartwrite

<!-- PORTFOLIO-SNAPSHOT:START -->
<p align="left">
  <img src="https://img.shields.io/badge/category-Education%20technology%20project-blue" alt="Category" />
  <img src="https://img.shields.io/badge/status-Public%20portfolio%20artifact-2ea44f" alt="Status" />
</p>

> DeepSeek-powered English writing assessment system with semantic scoring, CET-style evaluation, and teacher-facing feedback flows.

## Project Snapshot

- Category: Education technology project
- Stack: TypeScript, deepseek, education-technology, english-writing, llm, nextjs
- Status: Public portfolio artifact

## What This Demonstrates

- Presents the project with a clear purpose, technology stack, and review path.
- Shows applied AI workflow design in a concrete product or learning scenario.
- Demonstrates frontend delivery, deployment awareness, and user-facing product structure.

## Quick Start

```bash
bun install && bun run build
```

<!-- PORTFOLIO-SNAPSHOT:END -->

## Original Documentation

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

> 本项目目前以**本地开发**为主，无需云服务、无需部署平台账号，只需要一个 DeepSeek API key。

### 1. 环境配置

复制环境变量模板，并填入你的 DeepSeek API key（[申请地址](https://platform.deepseek.com/)）：

```bash
cp .env.local.example .env.local
```

打开 `.env.local`，把 `DEEPSEEK_API_KEY` 这一行后面填上你自己的密钥：

```
DEEPSEEK_API_KEY=sk-xxxxxxxx...
```

> ⚠️ `.env.local` 已在 `.gitignore` 中，**不会**被提交到仓库。绝不要把真实 key 写进任何会被 git 追踪的文件。

### 2. 安装依赖

```bash
bun install
```

### 3. 启动开发服务器

```bash
bun dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用，包括评测、追问聊天、注册/登录、个人中心等所有功能。

### 4. 本地构建（可选）

如果想验证生产构建是否能跑：

```bash
bun run build
bun start
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

## 部署（待定）

项目目前**以本地开发为主**，部署平台尚未选定。

仓库里保留了 `netlify.toml` 和 `doc/` 下的 `DEPLOYMENT*.md`、`NETLIFY_DEPLOYMENT.md`、`.netlify-deploy-guide.md` 等历史配置文档作为参考。后续如果选定 Netlify、Vercel 或自托管，再启用对应配置即可，不需要修改主代码。

生产环境必需的环境变量：

- `DEEPSEEK_API_KEY`（必需）：DeepSeek API 密钥，仅服务端读取
- `NEXT_PUBLIC_APP_URL`（推荐）：应用对外公开的 URL

### 安全配置

项目已具备以下安全特性（与部署平台无关）：

- ✅ API 密钥仅在服务端 API Routes 中读取，不会暴露给浏览器
- ✅ HTTP 安全头（X-Frame-Options、CSP 等，见 `next.config.ts`）
- ✅ 服务端输入验证（Zod schemas）
- ✅ 客户端速率限制

## 测试

```bash
# 运行所有测试
bun test

# 运行测试并监听变化
bun test --watch
```

## 代码质量

```bash
# 检查代码质量
bun run lint

# 格式化代码
bun run format
```

## License

MIT
