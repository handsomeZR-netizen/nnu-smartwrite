# DeepSeek API 密钥配置指南

## 🔑 获取 API 密钥

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API 密钥
5. 复制密钥（格式：`sk-xxxxxx`）

## ⚙️ 配置方式

### 方式 1：环境变量配置（推荐）

1. 在项目根目录找到 `.env.local` 文件
2. 添加你的 API 密钥：

```bash
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

3. 保存文件并重启开发服务器

### 方式 2：设置页面配置

1. 访问 http://localhost:3000/settings
2. 在"自定义 API 配置"部分填写：
   - API 密钥：你的 DeepSeek API 密钥
   - API 端点（可选）：`https://api.deepseek.com/v1`
   - 模型名称（可选）：`deepseek-reasoner`
3. 点击"保存设置"

## 🧪 测试模式

如果没有配置 API 密钥，系统会自动进入**测试模式**：
- ✅ 返回模拟评估结果
- ✅ 可以测试所有前端功能
- ⚠️ 评估结果为固定的示例数据
- ⚠️ 不会调用真实的 AI 模型

测试模式的响应会标注 `【测试模式】` 前缀。

## 🔍 验证配置

配置完成后，访问评估页面并提交一个测试：

1. 访问 http://localhost:3000/evaluate
2. 填写表单并提交
3. 检查结果：
   - ✅ 如果看到 `【测试模式】` 标记 → 使用模拟数据
   - ✅ 如果没有标记 → 使用真实 API

## ❌ 常见问题

### 问题 1: 500 错误
**原因**: API 密钥未配置或配置错误

**解决方案**:
1. 检查 `.env.local` 文件中的密钥格式
2. 确保密钥以 `sk-` 开头
3. 重启开发服务器

### 问题 2: API 调用失败
**原因**: 网络问题或 API 配额用尽

**解决方案**:
1. 检查网络连接
2. 访问 DeepSeek 控制台查看 API 使用情况
3. 确认账户余额充足

### 问题 3: 响应格式错误
**原因**: 模型返回的 JSON 格式不正确

**解决方案**:
1. 尝试切换到 `deepseek-chat` 模型
2. 检查提示词是否正确
3. 查看服务器日志获取详细错误信息

## 📊 API 使用建议

- **开发阶段**: 使用测试模式或少量 API 调用
- **测试阶段**: 配置真实 API 密钥进行完整测试
- **生产环境**: 确保 API 密钥安全存储在环境变量中

## 🔒 安全提示

⚠️ **重要**: 
- 不要将 API 密钥提交到 Git 仓库
- `.env.local` 文件已在 `.gitignore` 中
- 生产环境使用环境变量而非硬编码

## 📚 相关文档

- [DeepSeek API 文档](https://api-docs.deepseek.com/)
- [DeepSeek-Reasoner 指南](https://api-docs.deepseek.com/guides/reasoning_model)
- [项目 AI 优化文档](./AI_PROMPT_OPTIMIZATION.md)

---

**更新日期**: 2025-11-26
