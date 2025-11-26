# 🚀 快速部署到 Netlify

## 5 分钟部署指南

### 第 1 步：访问 Netlify
👉 打开 [https://app.netlify.com/](https://app.netlify.com/)

### 第 2 步：登录
- 点击 **"Log in with GitHub"**
- 授权 Netlify 访问你的 GitHub

### 第 3 步：导入项目
1. 点击 **"Add new site"** → **"Import an existing project"**
2. 选择 **"Deploy with GitHub"**
3. 找到并点击 `nnu-smartwrite` 仓库

### 第 4 步：配置环境变量 ⚠️ 重要！
在部署前，必须设置环境变量：

1. 找到 **"Environment variables"** 部分
2. 点击 **"Add environment variable"**
3. 添加：
   ```
   Key: DEEPSEEK_API_KEY
   Value: sk-你的DeepSeek密钥
   ```

**获取 DeepSeek API Key：**
- 访问：https://platform.deepseek.com/
- 注册并创建 API Key
- 复制密钥

### 第 5 步：部署
1. 点击 **"Deploy site"**
2. 等待 2-5 分钟
3. 完成！🎉

---

## 部署后测试

访问生成的网址（如：`your-site.netlify.app`），测试：

- ✅ 首页加载
- ✅ 点击"开始智能评估"
- ✅ 填入示例并评估
- ✅ 查看历史记录
- ✅ 打开设置页面

---

## 常见问题

### ❌ 构建失败
**解决**：检查 GitHub 仓库是否包含所有文件

### ❌ API 调用失败
**解决**：检查 `DEEPSEEK_API_KEY` 是否正确设置

### ❌ 页面空白
**解决**：查看浏览器控制台错误，检查环境变量

---

## 自定义域名（可选）

1. 进入 **"Domain settings"**
2. 点击 **"Add custom domain"**
3. 输入域名并配置 DNS

---

## 需要详细指南？
查看 [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

---

**祝部署成功！** 🎊
