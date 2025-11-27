# 🚀 立即部署指南

## 已完成的修复

✅ **API 端点已修复**
- 默认端点：`https://api.deepseek.com/v1`
- 自动添加 `/chat/completions` 路径
- 支持自定义完整 URL 或基础 URL

## 推送到 GitHub

如果网络连接正常，运行：

```bash
git push origin main
```

如果推送失败，可以稍后重试或检查网络连接。

---

## 部署到 Netlify（3 步骤）

### 步骤 1：访问 Netlify
👉 https://app.netlify.com/

### 步骤 2：导入项目
1. 点击 **"Add new site"** → **"Import an existing project"**
2. 选择 **"Deploy with GitHub"**
3. 找到 `nnu-smartwrite` 仓库并点击

### 步骤 3：配置环境变量
⚠️ **重要！** 必须设置以下环境变量：

```
DEEPSEEK_API_KEY = sk-你的密钥
```

**获取 API Key：**
1. 访问 https://platform.deepseek.com/
2. 注册/登录
3. 创建 API Key
4. 复制并粘贴到 Netlify

### 步骤 4：部署
点击 **"Deploy site"** 按钮，等待 2-5 分钟。

---

## 部署后测试

访问生成的网址，测试以下功能：

- ✅ 首页加载
- ✅ 评估功能（选中文本并评估）
- ✅ 练习功能
- ✅ 历史记录
- ✅ 设置页面

---

## API 配置说明

### 云端 API（默认）
- 使用平台提供的 DeepSeek API
- 在 Netlify 设置 `DEEPSEEK_API_KEY` 环境变量

### 自定义 API
用户可以在设置页面配置自己的 API：
- API Key
- API Endpoint（可选，支持基础 URL）
- 模型名称（可选）

---

## 故障排除

### 构建失败
- 检查 GitHub 仓库是否包含所有文件
- 查看 Netlify 构建日志

### API 调用失败
- 确认 `DEEPSEEK_API_KEY` 已正确设置
- 检查 API Key 是否有效
- 查看 Netlify Functions 日志

### 页面空白
- 打开浏览器控制台查看错误
- 检查环境变量配置

---

## 需要帮助？

查看详细文档：
- [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) - 完整部署指南
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署
- [PRE_DEPLOY_CHECKLIST.md](./PRE_DEPLOY_CHECKLIST.md) - 部署前检查

---

**准备好了吗？开始部署吧！** 🎉
