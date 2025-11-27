# 📋 部署前检查清单

在部署到 Netlify 之前，请确保完成以下检查：

## ✅ 代码准备

- [ ] 所有代码已提交到 Git
  ```bash
  git status  # 确认没有未提交的更改
  ```

- [ ] 代码已推送到 GitHub
  ```bash
  git push origin main
  ```

- [ ] 本地构建成功
  ```bash
  npm run build
  ```

- [ ] 本地测试通过
  ```bash
  npm run dev
  # 访问 http://localhost:3000 测试所有功能
  ```

## ✅ 环境变量准备

- [ ] 已获取 DeepSeek API Key
  - 访问：https://platform.deepseek.com/
  - 注册账户
  - 创建 API Key
  - 复制密钥（格式：`sk-...`）

- [ ] 已准备好环境变量值
  ```
  DEEPSEEK_API_KEY=sk-你的密钥
  ```

## ✅ 配置文件检查

- [ ] `netlify.toml` 存在且配置正确
  ```bash
  cat netlify.toml  # 查看配置
  ```

- [ ] `package.json` 包含正确的构建脚本
  ```json
  {
    "scripts": {
      "build": "next build"
    }
  }
  ```

- [ ] `.gitignore` 包含敏感文件
  ```
  .env.local
  .env.production
  node_modules/
  .next/
  ```

## ✅ 依赖检查

- [ ] 所有依赖已安装
  ```bash
  npm install
  ```

- [ ] 没有安全漏洞（或已知晓）
  ```bash
  npm audit
  ```

- [ ] Node 版本兼容（推荐 v20）
  ```bash
  node --version
  ```

## ✅ 功能测试

在本地测试以下功能：

- [ ] 首页正常显示
- [ ] 评估功能可用
  - [ ] 可以输入题目和文章
  - [ ] 可以选中文本
  - [ ] AI 评估按钮可点击
  - [ ] 能获取评估结果
- [ ] 练习功能可用
  - [ ] 题目列表显示
  - [ ] 可以选择题目
  - [ ] 可以提交答案
- [ ] 历史记录功能
  - [ ] 可以查看历史
  - [ ] 可以删除记录
- [ ] 设置功能
  - [ ] 可以切换 API 类型
  - [ ] 可以保存设置

## ✅ 文件大小检查

- [ ] 构建产物大小合理（< 50MB）
  ```bash
  npm run build
  du -sh .next
  ```

- [ ] 没有超大文件
  ```bash
  find . -type f -size +10M
  ```

## ✅ 安全检查

- [ ] 没有硬编码的 API 密钥
  ```bash
  grep -r "sk-" --exclude-dir=node_modules --exclude-dir=.next
  ```

- [ ] `.env.local` 已添加到 `.gitignore`
  ```bash
  cat .gitignore | grep .env.local
  ```

- [ ] 敏感信息已移除
  - [ ] 没有个人信息
  - [ ] 没有测试数据
  - [ ] 没有调试代码

## ✅ 文档检查

- [ ] README.md 已更新
- [ ] 部署文档已准备
- [ ] 环境变量说明清晰

## ✅ GitHub 仓库检查

- [ ] 仓库是公开的（或 Netlify 有访问权限）
- [ ] 默认分支是 `main`
- [ ] 所有文件已推送

## 🚀 准备部署

如果以上所有项都已完成，你可以开始部署了！

### 快速部署步骤：

1. 访问 [Netlify](https://app.netlify.com/)
2. 登录并导入 GitHub 仓库
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 点击部署
5. 等待构建完成
6. 测试部署的网站

---

## 📝 部署后检查

部署成功后，请测试：

- [ ] 网站可以访问
- [ ] 所有页面正常加载
- [ ] API 调用成功
- [ ] 评估功能正常
- [ ] 没有控制台错误
- [ ] 移动端显示正常
- [ ] HTTPS 证书有效

---

## ❌ 如果部署失败

1. 查看 Netlify 构建日志
2. 检查环境变量设置
3. 确认 API Key 有效
4. 查看 [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) 的故障排除部分

---

**准备好了吗？开始部署吧！** 🎉
