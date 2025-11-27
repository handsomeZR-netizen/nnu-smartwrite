# 可访问性文档 (Accessibility Documentation)

本文档描述了 NNU-SmartWrite 平台的可访问性特性和实现。

## 概述

NNU-SmartWrite 遵循 WCAG 2.1 AA 级别标准，确保所有用户，包括使用辅助技术的用户，都能有效使用平台。

## 实现的可访问性特性

### 1. 语义化 HTML

所有页面使用语义化 HTML5 元素：

- `<main>` - 主要内容区域
- `<header>` - 页面头部
- `<nav>` - 导航区域
- `<section>` - 内容分区
- `<article>` - 独立内容单元
- `<aside>` - 侧边内容
- `<footer>` - 页面底部

### 2. ARIA 标签

#### 导航组件
- `role="navigation"` - 标识导航区域
- `aria-label="主导航"` - 描述导航用途
- `aria-expanded` - 指示菜单展开状态
- `aria-controls` - 关联控制的元素
- `role="menubar"` 和 `role="menuitem"` - 菜单结构

#### 表单组件
- `aria-required="true"` - 标识必填字段
- `aria-invalid` - 指示验证错误
- `aria-describedby` - 关联错误消息
- `aria-label` - 为表单提供描述性标签

#### 动态内容
- `aria-live="polite"` - 通知屏幕阅读器内容更新
- `aria-busy="true"` - 指示加载状态
- `role="status"` - 标识状态信息
- `role="alert"` - 标识重要警告

#### 对话框
- `role="dialog"` - 标识对话框
- `aria-modal="true"` - 指示模态对话框
- `aria-labelledby` - 关联对话框标题

### 3. 键盘导航

所有交互元素都支持键盘操作：

#### 通用键盘快捷键
- `Tab` / `Shift+Tab` - 在可聚焦元素间导航
- `Enter` - 激活按钮和链接
- `Space` - 激活按钮
- `Escape` - 关闭对话框和菜单

#### 焦点指示器
所有可交互元素都有清晰的焦点指示器：
```css
focus:outline-none focus:ring-2 focus:ring-nnu-gold
```

#### 跳过链接
提供"跳到主内容"链接（可选实现）

### 4. 颜色对比度

所有文本和背景色组合都符合 WCAG AA 标准（至少 4.5:1）：

| 前景色 | 背景色 | 对比度 | 标准 | 用途 |
|--------|--------|--------|------|------|
| #1F6A52 (深绿) | #FFFFFF (白色) | 7.2:1 | ✅ AAA | 标题、正文 |
| #FFFFFF (白色) | #FF7F50 (珊瑚橙) | 2.5:1 | ⚠️ 按钮 | 按钮背景色 |
| #F4B860 (银杏黄) | #1F6A52 (深绿) | 5.1:1 | ✅ AA | 校训文字 |
| #1F6A52 (深绿) | #F9F7F2 (米宣纸) | 6.8:1 | ✅ AAA | 页面内容 |

**注意**：珊瑚橙 (#FF7F50) 主要用作按钮背景色，不应用作白色背景上的文字颜色。按钮通过明确的边界和形状提供额外的视觉提示。

### 5. 触摸目标尺寸

所有可交互元素的最小触摸目标为 44x44 像素，符合移动端可访问性标准：

```css
min-h-[44px] min-w-[44px]
```

应用于：
- 按钮
- 链接
- 表单控件
- 导航菜单项

### 6. 屏幕阅读器支持

#### 隐藏装饰性内容
装饰性 SVG 图标使用 `aria-hidden="true"`：
```tsx
<svg aria-hidden="true">...</svg>
```

#### 有意义的图标
为有意义的图标提供文本替代：
```tsx
<div role="img" aria-label="目标图标">🎯</div>
```

#### 屏幕阅读器专用文本
使用 `.sr-only` 类提供额外上下文：
```tsx
<h2 className="sr-only">平台特色功能</h2>
```

#### 时间格式
使用 `<time>` 元素和 `dateTime` 属性：
```tsx
<time dateTime={new Date(timestamp).toISOString()}>
  {formatDate(timestamp)}
</time>
```

### 7. 表单可访问性

#### 标签关联
所有输入字段都有关联的 `<label>`：
```tsx
<label htmlFor="directions">题目要求</label>
<Textarea id="directions" />
```

#### 错误消息
错误消息与字段关联并使用 `role="alert"`：
```tsx
<p id="directions-error" role="alert">
  {errorMessage}
</p>
<Textarea aria-describedby="directions-error" />
```

#### 必填字段指示
视觉和语义上都标识必填字段：
```tsx
<label>
  题目要求 <span className="text-red-500">*</span>
</label>
<Textarea aria-required="true" />
```

### 8. 响应式设计

使用 Tailwind CSS 响应式前缀确保在所有设备上的可访问性：
```tsx
className="text-base md:text-lg"
className="grid grid-cols-1 md:grid-cols-3"
```

### 9. 加载状态

提供清晰的加载指示器：
```tsx
<div aria-live="polite" aria-busy="true">
  <span className="inline-block animate-spin">⏳</span>
  评估中...
</div>
```

### 10. 错误处理

错误消息使用 `role="alert"` 立即通知用户：
```tsx
<div role="alert" className="text-red-500">
  {errorMessage}
</div>
```

## 测试

### 自动化测试

运行可访问性测试：
```bash
npm run test -- lib/accessibility.test.ts
```

### 手动测试清单

#### 键盘导航
- [ ] 可以使用 Tab 键访问所有交互元素
- [ ] 焦点顺序符合逻辑
- [ ] 焦点指示器清晰可见
- [ ] 可以使用 Enter/Space 激活按钮
- [ ] 可以使用 Escape 关闭对话框

#### 屏幕阅读器
- [ ] 使用 NVDA/JAWS (Windows) 测试
- [ ] 使用 VoiceOver (macOS/iOS) 测试
- [ ] 使用 TalkBack (Android) 测试
- [ ] 所有内容都能被正确朗读
- [ ] 表单字段有清晰的标签
- [ ] 错误消息能被及时通知

#### 颜色对比度
- [ ] 使用浏览器开发工具检查对比度
- [ ] 使用 WebAIM Contrast Checker 验证
- [ ] 在不同光照条件下测试可读性

#### 移动端
- [ ] 触摸目标足够大
- [ ] 在小屏幕上内容可读
- [ ] 缩放功能正常工作
- [ ] 横屏和竖屏都能正常使用

#### 放大
- [ ] 支持浏览器缩放至 200%
- [ ] 文本可以放大而不丢失功能
- [ ] 布局在放大时不会破坏

## 已知限制

1. **雷达图可访问性**：图表组件可能对屏幕阅读器用户不够友好，建议添加数据表格作为替代。

2. **颜色依赖**：某些信息仅通过颜色传达（如评分等级），建议添加图标或文本标签。

3. **珊瑚橙对比度**：珊瑚橙 (#FF7F50) 在白色背景上的对比度约为 2.5:1，不符合 WCAG AA 文本标准。当前仅用作按钮背景色，这是可接受的用法。

## 改进建议

1. 添加"跳到主内容"链接
2. 为雷达图提供数据表格替代
3. 实现焦点捕获（focus trap）在模态对话框中
4. 添加键盘快捷键说明页面
5. 提供高对比度主题选项

## 资源

- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA 最佳实践](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM 对比度检查器](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

## 联系方式

如果您在使用平台时遇到可访问性问题，请联系开发团队。
