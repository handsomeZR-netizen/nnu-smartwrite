# 评测结果持久化功能

## 功能概述

评测页面现在支持自动保存和恢复评测结果，用户不会因为切换页面而丢失当前的评测内容。

## 核心功能

### 1. 自动保存 ✅
- **触发时机**：每次评测成功完成后
- **保存位置**：浏览器 localStorage (`nnu-current-evaluation`)
- **保存内容**：
  - 评测结果 (result)
  - 输入数据 (input)
  - 时间戳 (timestamp)

### 2. 自动恢复 ✅
- **触发时机**：页面加载时
- **恢复逻辑**：
  - 检查 localStorage 是否有保存的评测
  - 如果有，自动恢复到页面右侧
  - 用户可以继续查看上次的评测结果

### 3. 手动清空 ✅
- **位置**：评测结果卡片下方
- **按钮样式**：灰色边框，hover 变红色
- **图标**：Trash2（垃圾桶）
- **功能**：
  - 清空当前显示的评测结果
  - 删除 localStorage 中的保存数据
  - 重置页面状态

## 技术实现

### localStorage Key
```typescript
const CURRENT_EVALUATION_KEY = 'nnu-current-evaluation';
```

### 数据结构
```typescript
{
  result: EvaluationResult,
  input: EvaluationInput,
  timestamp: number
}
```

### 核心代码

#### 自动保存
```typescript
localStorage.setItem(CURRENT_EVALUATION_KEY, JSON.stringify({
  result: evaluationResult,
  input: input,
  timestamp: Date.now(),
}));
```

#### 自动恢复
```typescript
React.useEffect(() => {
  const saved = localStorage.getItem(CURRENT_EVALUATION_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.result && parsed.input) {
      setResult(parsed.result);
      setCurrentInput(parsed.input);
    }
  }
}, []);
```

#### 手动清空
```typescript
const handleReset = () => {
  setResult(null);
  setError(null);
  setCurrentInput(null);
  localStorage.removeItem(CURRENT_EVALUATION_KEY);
};
```

## 用户体验改进

### 场景 1：切换页面
- **之前**：用户点击"设置"后，评测结果消失
- **现在**：用户返回评测页面，结果自动恢复

### 场景 2：刷新页面
- **之前**：刷新后评测结果丢失
- **现在**：刷新后结果自动恢复

### 场景 3：多次评测
- **之前**：新评测会覆盖旧结果，无法对比
- **现在**：
  - 当前评测自动保存
  - 历史评测保存在历史记录中（最多 10 条）
  - 用户可以手动清空当前评测

### 场景 4：清空结果
- **之前**：没有清空按钮，只能刷新页面
- **现在**：点击"清空当前评测"按钮即可

## 与历史记录的关系

### 双重保存机制
1. **当前评测** (localStorage: `nnu-current-evaluation`)
   - 只保存最新的一次评测
   - 用于页面恢复
   - 可以手动清空

2. **历史记录** (localStorage: `nnu-evaluation-history`)
   - 保存最近 10 次评测
   - 用于历史查看
   - 在历史页面管理

### 数据流
```
评测成功
  ├─> 保存到当前评测 (自动)
  └─> 保存到历史记录 (自动)

用户清空
  └─> 只清空当前评测
      历史记录保持不变
```

## 注意事项

1. **浏览器兼容性**：使用 try-catch 包裹所有 localStorage 操作
2. **隐私模式**：某些浏览器的隐私模式可能禁用 localStorage
3. **数据大小**：localStorage 有 5-10MB 限制，当前实现不会超出
4. **跨标签页**：同一浏览器的不同标签页共享 localStorage

## 未来优化建议

1. 添加"恢复上次评测"的提示通知
2. 支持保存多个评测结果（标签页切换）
3. 添加"导出评测报告"功能
4. 支持云端同步（需要用户登录）
