# Netlify 部署指南

## 方法一：通过 Netlify 网站部署（推荐）

### 步骤 1：准备工作
确保你的代码已经推送到 GitHub：
```bash
git add .
git commit -m "准备部署到 Netlify"
git push origin main
```

### 步骤 2：登录 Netlify
1. 访问 [Netlify](https://www.netlify.com/)
2. 点击 "Sign up" 或 "Log in"
3. 选择 "GitHub" 登录（推荐）

### 步骤 3：导入项目
1. 登录后，点击 **"Add new site"** → **"Import an existing project"**
2. 选择 **"Deploy with GitHub"**
3. 授权 Netlify 访问你的 GitHub 账户
4. 在仓库列表中找到 `nnu-smartwrite`
5. 点击该仓库

### 步骤 4：配置构建设置
Netlify 会自动检测到 Next.js 项目，但请确认以下设置：

- **Branch to deploy**: `main`
- **Build command**: `bun install --frozen-lockfile && bun run build`
- **Publish directory**: `.next`
- **Node version**: `20`

这些设置已经在 `netlify.toml` 中配置好了，通常不需要手动修改。

### 步骤 5：配置环境变量
这是**最重要**的一步！

1. 在部署设置页面，找到 **"Environment variables"** 部分
2. 点击 **"Add environment variable"**
3. 添加以下变量：

#### 必需的环境变量：
```
DEEPSEEK_API_KEY = sk-your-deepseek-api-key-here
```

#### 可选的环境变量：
```
NEXT_PUBLIC_APP_URL = https://your-site-name.netlify.app
```

**获取 DeepSeek API Key：**
- 访问 [DeepSeek 官网](https://platform.deepseek.com/)
- 注册/登录账户
- 进入 API Keys 页面
- 创建新的 API Key
- 复制密钥并粘贴到 Netlify

### 步骤 6：开始部署
1. 点击 **"Deploy site"** 按钮
2. 等待构建完成（通常需要 2-5 分钟）
3. 构建成功后，你会看到一个临时域名，如：`random-name-123456.netlify.app`

### 步骤 7：测试网站
1. 点击生成的域名访问你的网站
2. 测试主要功能：
   - 首页加载
   - 评估功能
   - 练习功能
   - 历史记录
   - 设置页面

### 步骤 8：自定义域名（可选）
1. 在 Netlify 控制台，进入 **"Domain settings"**
2. 点击 **"Add custom domain"**
3. 输入你的域名（如：`smartwrite.yourdomain.com`）
4. 按照提示配置 DNS 记录

---

## 方法二：使用 Netlify CLI 部署

### 安装 Netlify CLI
```bash
bun install -g netlify-cli
```

### 登录 Netlify
```bash
netlify login
```

### 初始化项目
```bash
cd nnu-smartwrite
netlify init
```

按照提示选择：
1. **Create & configure a new site**
2. 选择你的团队
3. 输入网站名称（可选）
4. 确认构建命令和发布目录

### 配置环境变量
```bash
netlify env:set DEEPSEEK_API_KEY "sk-your-api-key-here"
```

### 部署
```bash
netlify deploy --prod
```

---

## 常见问题解决

### 1. 构建失败：找不到模块
**解决方案**：
```bash
# 清理并重新安装依赖
rm -rf node_modules bun.lock
bun install
git add bun.lock
git commit -m "更新依赖"
git push
```

### 2. API 调用失败
**检查清单**：
- ✅ 确认 `DEEPSEEK_API_KEY` 环境变量已设置
- ✅ 确认 API Key 有效且有余额
- ✅ 检查 Netlify Functions 日志

**查看日志**：
1. 进入 Netlify 控制台
2. 点击 **"Functions"** 标签
3. 查看函数调用日志

### 3. 页面 404 错误
**原因**：Next.js 路由配置问题

**解决方案**：
确保 `netlify.toml` 中有正确的重定向规则（已配置）

### 4. 环境变量不生效
**解决方案**：
1. 重新检查环境变量名称（区分大小写）
2. 重新部署网站：
   ```bash
   # 在 Netlify 控制台点击 "Trigger deploy" → "Deploy site"
   ```

### 5. 构建超时
**解决方案**：
- 升级到 Netlify Pro 计划（构建时间更长）
- 或优化构建过程，减少依赖

---

## 部署后的配置

### 1. 设置自动部署
Netlify 默认会在你推送代码到 `main` 分支时自动部署。

**禁用自动部署**（如果需要）：
1. 进入 **"Site settings"** → **"Build & deploy"**
2. 找到 **"Build settings"**
3. 点击 **"Edit settings"**
4. 关闭 **"Auto publishing"**

### 2. 配置部署通知
1. 进入 **"Site settings"** → **"Build & deploy"** → **"Deploy notifications"**
2. 添加通知（Email、Slack、Webhook 等）

### 3. 启用 HTTPS
Netlify 自动为所有网站提供免费的 HTTPS 证书（Let's Encrypt）。

**检查 HTTPS 状态**：
1. 进入 **"Domain settings"** → **"HTTPS"**
2. 确认证书状态为 **"Active"**

### 4. 性能优化
1. 启用 **Asset Optimization**：
   - 进入 **"Site settings"** → **"Build & deploy"** → **"Post processing"**
   - 启用 **"Bundle CSS"** 和 **"Minify CSS"**
   - 启用 **"Minify JS"**
   - 启用 **"Pretty URLs"**

2. 启用 **Netlify Edge**（CDN）：
   - 默认已启用，无需配置

---

## 监控和维护

### 查看部署历史
1. 进入 Netlify 控制台
2. 点击 **"Deploys"** 标签
3. 查看所有部署记录

### 回滚到之前的版本
1. 在 **"Deploys"** 页面找到要回滚的版本
2. 点击该部署
3. 点击 **"Publish deploy"**

### 查看分析数据
1. 进入 **"Analytics"** 标签（需要 Pro 计划）
2. 查看访问量、性能指标等

---

## 成本说明

### 免费计划包含：
- ✅ 100 GB 带宽/月
- ✅ 300 分钟构建时间/月
- ✅ 自动 HTTPS
- ✅ 持续部署
- ✅ 表单处理（100 次提交/月）
- ✅ 无限网站

### 升级到 Pro（$19/月）：
- 更多带宽和构建时间
- 更快的构建速度
- 高级分析
- 密码保护
- 更多团队成员

---

## 快速部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 已登录 Netlify
- [ ] 已导入 GitHub 仓库
- [ ] 已设置 `DEEPSEEK_API_KEY` 环境变量
- [ ] 构建设置正确（已在 netlify.toml 中配置）
- [ ] 点击部署按钮
- [ ] 等待构建完成
- [ ] 测试网站功能
- [ ] （可选）配置自定义域名

---

## 需要帮助？

- 📚 [Netlify 官方文档](https://docs.netlify.com/)
- 💬 [Netlify 社区论坛](https://answers.netlify.com/)
- 📧 [Netlify 支持](https://www.netlify.com/support/)

---

## 下一步

部署成功后，你可以：
1. 分享你的网站链接
2. 配置自定义域名
3. 设置 Google Analytics
4. 添加更多功能
5. 优化 SEO

祝部署顺利！🚀
