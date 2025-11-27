# NNU-SmartWrite 部署指南

## 部署到 Netlify

### 前置要求

1. Netlify 账号
2. DeepSeek API 密钥
3. GitHub 仓库（推荐）

### 部署步骤

#### 1. 准备代码

确保所有代码已提交到 Git 仓库：

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. 连接到 Netlify

1. 登录 [Netlify](https://app.netlify.com/)
2. 点击 "Add new site" → "Import an existing project"
3. 选择你的 Git 提供商（GitHub/GitLab/Bitbucket）
4. 授权 Netlify 访问你的仓库
5. 选择 `nnu-smartwrite` 仓库

#### 3. 配置构建设置

Netlify 会自动检测 `netlify.toml` 配置文件，但请确认以下设置：

- **Base directory**: `nnu-smartwrite`
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20

#### 4. 设置环境变量

在 Netlify 项目设置中添加以下环境变量：

**Site configuration → Environment variables**

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DEEPSEEK_API_KEY` | `sk-xxxxx...` | DeepSeek API 密钥（必需） |
| `NEXT_PUBLIC_APP_URL` | `https://your-site.netlify.app` | 应用的公开 URL |
| `NODE_VERSION` | `20` | Node.js 版本 |

**重要提示**：
- `DEEPSEEK_API_KEY` 必须保密，不要提交到代码仓库
- 环境变量更新后需要重新部署才能生效

#### 5. 部署

点击 "Deploy site" 按钮开始部署。

首次部署通常需要 2-5 分钟。

#### 6. 验证部署

部署完成后：

1. 访问 Netlify 提供的 URL（如 `https://your-site.netlify.app`）
2. 测试以下功能：
   - ✅ 首页加载正常
   - ✅ 导航栏显示校徽和链接
   - ✅ 评估表单可以提交
   - ✅ API 调用成功返回结果
   - ✅ 历史记录保存和读取
   - ✅ 练习题加载正常

### 自定义域名（可选）

1. 在 Netlify 项目设置中选择 "Domain management"
2. 点击 "Add custom domain"
3. 输入你的域名（如 `smartwrite.nnu.edu.cn`）
4. 按照提示配置 DNS 记录

### 持续部署

Netlify 会自动监听 Git 仓库的变化：

- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到其他分支 → 创建预览部署

## 环境变量说明

### 必需的环境变量

#### `DEEPSEEK_API_KEY`

DeepSeek API 的认证密钥。

**获取方式**：
1. 访问 [DeepSeek 平台](https://platform.deepseek.com/)
2. 注册/登录账号
3. 在 API Keys 页面创建新密钥
4. 复制密钥（只显示一次，请妥善保存）

**格式**：`sk-` 开头的字符串

**安全提示**：
- ⚠️ 不要将密钥提交到代码仓库
- ⚠️ 不要在客户端代码中使用
- ⚠️ 定期轮换密钥
- ⚠️ 监控 API 使用量

### 可选的环境变量

#### `NEXT_PUBLIC_APP_URL`

应用的公开访问 URL。

**默认值**：`http://localhost:3000`（开发环境）

**生产环境示例**：`https://nnu-smartwrite.netlify.app`

**用途**：
- 生成绝对 URL
- 配置 CORS
- 社交媒体分享链接

## 安全配置

### HTTP 安全头

`netlify.toml` 和 `next.config.ts` 已配置以下安全头（符合需求 8.3）：

| 安全头 | 值 | 作用 |
|--------|-----|------|
| `X-Frame-Options` | `DENY` | 防止点击劫持攻击 |
| `X-Content-Type-Options` | `nosniff` | 防止 MIME 类型嗅探 |
| `X-XSS-Protection` | `1; mode=block` | 启用 XSS 过滤器 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 控制 Referrer 信息 |
| `Content-Security-Policy` | 见配置文件 | 限制资源加载来源 |
| `Strict-Transport-Security` | `max-age=63072000` | 强制 HTTPS |

### API 密钥保护

- ✅ API 密钥存储在服务端环境变量
- ✅ 所有 AI 调用通过 Next.js API Routes
- ✅ 客户端代码不包含任何密钥
- ✅ `.gitignore` 排除 `.env.local`

### 内容安全策略 (CSP)

CSP 配置允许以下来源：

- **脚本**：同源 + 内联脚本（Next.js 需要）
- **样式**：同源 + 内联样式（Tailwind CSS 需要）
- **图片**：同源 + data: URLs + HTTPS
- **连接**：同源 + DeepSeek API (`https://api.deepseek.com`)

## 性能优化

### 构建优化

`next.config.ts` 已配置：

- ✅ `output: 'standalone'` - 独立输出模式
- ✅ `swcMinify: true` - 使用 SWC 压缩
- ✅ `compress: true` - 启用 Gzip 压缩
- ✅ `productionBrowserSourceMaps: false` - 禁用 source maps

### 图片优化

- ✅ 自动转换为 AVIF/WebP 格式
- ✅ 响应式图片尺寸
- ✅ 延迟加载
- ✅ 60 秒缓存 TTL

### 缓存策略

静态资源缓存配置（在 `netlify.toml` 中）：

- **静态文件** (`/static/*`): 1 年缓存
- **JavaScript** (`/*.js`): 1 年缓存
- **CSS** (`/*.css`): 1 年缓存

## 监控和调试

### Netlify 日志

查看部署和运行时日志：

1. 进入 Netlify 项目
2. 选择 "Deploys" 查看构建日志
3. 选择 "Functions" 查看 API 函数日志

### 常见问题

#### 1. 构建失败

**错误**：`npm install` 失败

**解决**：
- 检查 `package.json` 依赖版本
- 确认 Node 版本为 20
- 尝试添加 `NPM_FLAGS = "--legacy-peer-deps"`

#### 2. API 调用失败

**错误**：评估功能不工作

**解决**：
- 检查 `DEEPSEEK_API_KEY` 是否正确设置
- 查看 Functions 日志确认错误信息
- 验证 API 密钥是否有效且有余额

#### 3. 环境变量未生效

**错误**：应用无法读取环境变量

**解决**：
- 确认变量名拼写正确
- 客户端变量必须以 `NEXT_PUBLIC_` 开头
- 更新环境变量后需要重新部署

#### 4. 404 错误

**错误**：刷新页面后出现 404

**解决**：
- 检查 `netlify.toml` 中的重定向配置
- 确认 SPA fallback 规则已配置

## 回滚部署

如果新部署出现问题：

1. 进入 Netlify 项目的 "Deploys" 页面
2. 找到之前的稳定版本
3. 点击 "Publish deploy" 回滚

## 成本估算

### Netlify 免费套餐

- ✅ 100 GB 带宽/月
- ✅ 300 分钟构建时间/月
- ✅ 125,000 次函数调用/月

### DeepSeek API

- 按 token 使用量计费
- 建议设置使用限额
- 监控每日消耗

## 下一步

部署成功后，可以考虑：

1. 配置自定义域名
2. 设置 SSL 证书（Netlify 自动提供）
3. 配置 CDN 加速
4. 添加分析工具（Google Analytics 等）
5. 设置错误监控（Sentry 等）

## 支持

如有问题，请联系：

- 技术支持：[support@example.com]
- 文档：[项目 README.md](./README.md)
- 问题追踪：GitHub Issues
