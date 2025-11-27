# Netlify 404 错误修复指南

## 问题描述
部署到 Netlify 后，所有页面都显示 404 错误。

## 根本原因
Next.js 应用在 Netlify 上需要使用 `@netlify/plugin-nextjs` 插件来正确处理路由和服务端渲染。

## ✅ 已修复

### 1. 更新 netlify.toml
添加 Next.js 插件：
```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 2. 更新 next.config.ts
移除 `output: 'standalone'` 配置（插件会自动处理）：
```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // 移除了 output: 'standalone'
  // ...其他配置
}
```

### 3. 简化配置
移除了不必要的重定向规则，让插件自动处理。

## 🚀 部署步骤

### 自动部署（推荐）
代码已推送到 GitHub，Netlify 会自动：
1. 检测到新的提交
2. 触发重新构建
3. 安装 `@netlify/plugin-nextjs` 插件
4. 正确部署 Next.js 应用

### 手动触发部署
如果自动部署没有触发：
1. 登录 Netlify 控制台
2. 进入你的网站
3. 点击 **"Deploys"** 标签
4. 点击 **"Trigger deploy"** → **"Deploy site"**

## 📋 验证清单

部署完成后，检查以下内容：

- [ ] 首页 (`/`) 正常显示
- [ ] 评估页面 (`/evaluate`) 可访问
- [ ] 练习页面 (`/practice`) 可访问
- [ ] 历史页面 (`/history`) 可访问
- [ ] 设置页面 (`/settings`) 可访问
- [ ] API 路由 (`/api/evaluate`) 正常工作
- [ ] 导航链接都能正常跳转

## 🔍 如果仍然出现 404

### 检查构建日志
1. 进入 Netlify 控制台
2. 点击 **"Deploys"** 标签
3. 点击最新的部署
4. 查看构建日志

### 常见问题

#### 1. 插件未安装
**症状**：构建日志中没有看到 `@netlify/plugin-nextjs`

**解决**：
- 确认 `netlify.toml` 中有插件配置
- 手动触发重新部署

#### 2. 环境变量缺失
**症状**：页面加载但 API 调用失败

**解决**：
- 检查 `DEEPSEEK_API_KEY` 是否设置
- 进入 **Site settings** → **Environment variables**

#### 3. 构建失败
**症状**：部署状态显示失败

**解决**：
- 查看构建日志中的错误信息
- 确认所有依赖都已安装
- 检查 Node 版本（应该是 20）

## 📚 相关文档

- [Netlify Next.js Plugin](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/overview/)
- [Netlify 部署指南](./NETLIFY_DEPLOYMENT.md)

## 🎯 预期结果

修复后，你应该能够：
- ✅ 访问所有页面
- ✅ 使用所有功能
- ✅ API 调用正常
- ✅ 路由跳转正常

## 💡 提示

如果部署成功但功能不正常：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签的错误信息
3. 查看 Network 标签的网络请求
4. 检查是否有 API 调用失败

---

**修复已完成，等待 Netlify 重新部署！** 🚀

预计部署时间：2-5 分钟
