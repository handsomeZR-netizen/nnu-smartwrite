# 设置功能说明

## 新增功能

### 1. 设置页面
- 访问路径：`/settings`
- 导航栏新增"设置"图标和链接
- 支持桌面端和移动端

### 2. API 配置

#### 云端 API（默认）
- 使用平台提供的 DeepSeek API
- 无需配置，开箱即用
- 适合快速体验和测试

#### 自定义 API
- 支持使用自己的 API 密钥
- 配置项：
  - **API Key**（必填）：你的 DeepSeek API 密钥
  - **API Endpoint**（可选）：自定义 API 地址，默认使用 DeepSeek 官方地址
  - **模型名称**（可选）：自定义模型，默认使用 `deepseek-chat`

#### 支持的 API 格式
- DeepSeek API（推荐）
- OpenAI 兼容格式
- 其他兼容 Chat Completions 的 API

### 3. 丰富的示例案例库

#### 10个精选示例
1. 社会责任感 - 翻译题
2. 科技与生活 - 翻译题
3. 教育改革 - 翻译题
4. 环境保护 - 写作题
5. 文化交流 - 写作题
6. 职业发展 - 翻译题
7. 健康生活 - 写作题
8. 人工智能伦理 - 翻译题
9. 城市化进程 - 翻译题
10. 代际关系 - 写作题

#### 示例切换功能
- **填入示例**：一键填入当前示例
- **换一个**：随机切换到下一个示例
- 显示当前示例标题

### 4. API 状态提示

在评估表单顶部显示当前使用的 API 类型：
- 🔑 **使用自定义 API**（橙色）
- ☁️ **使用云端 API**（绿色）

## 使用方法

### 配置自定义 API

1. 点击导航栏的"设置"
2. 选择"自定义 API"
3. 输入你的 API Key
4. （可选）配置自定义 Endpoint 和模型
5. 点击"保存设置"

### 切换示例案例

1. 在评估页面，点击"换一个"按钮
2. 系统会自动切换到下一个示例
3. 点击"填入示例"将示例内容填入表单

### 重置设置

1. 进入设置页面
2. 点击"重置设置"按钮
3. 确认后恢复默认配置

## 数据安全

- API 密钥存储在浏览器本地存储（localStorage）
- 不会上传到服务器
- 仅在调用 API 时通过 HTTPS 传输
- 可随时删除或重置

## 技术实现

### 本地存储结构
```typescript
{
  api: {
    useCustomAPI: boolean,
    customAPIKey?: string,
    customAPIEndpoint?: string,
    customAPIModel?: string
  },
  lastUpdated: number
}
```

### API 调用流程
1. 前端检查是否使用自定义 API
2. 如果使用自定义 API，将配置传递给后端
3. 后端优先使用自定义配置，否则使用环境变量
4. 调用相应的 API 端点

## 文件结构

```
nnu-smartwrite/
├── app/
│   └── settings/
│       └── page.tsx              # 设置页面
├── lib/
│   └── settings.ts               # 设置管理模块
├── data/
│   └── sample-cases.json         # 示例案例库
└── components/
    └── nnu/
        └── evaluation-form.tsx   # 更新的评估表单
```

## 未来扩展

- [ ] 支持更多 AI 模型（GPT-4, Claude 等）
- [ ] 添加 API 使用统计
- [ ] 支持导入/导出设置
- [ ] 添加更多示例案例
- [ ] 支持自定义示例案例
