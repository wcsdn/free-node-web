# NewsTerminal 组件使用说明

## 📦 文件说明

- `NewsTerminal.tsx` - 主组件（内联样式版本）
- `NewsTerminal-CSSModules.tsx` - CSS Modules 版本
- `NewsTerminal.module.css` - CSS Modules 样式文件
- `NewsTerminal-Example.tsx` - 使用示例

## 🚀 快速开始

### 1. 复制文件到你的 React 项目

将以下文件复制到你的项目中：

```bash
# 复制到 /Users/a12345/h5/free-node-web/src/components/
cp NewsTerminal.tsx /Users/a12345/h5/free-node-web/src/components/
```

或者如果使用 CSS Modules：

```bash
cp NewsTerminal-CSSModules.tsx /Users/a12345/h5/free-node-web/src/components/NewsTerminal.tsx
cp NewsTerminal.module.css /Users/a12345/h5/free-node-web/src/components/
```

### 2. 在你的页面中使用

```tsx
import React from 'react';
import NewsTerminal from './components/NewsTerminal';

function App() {
  return (
    <div className="App">
      <NewsTerminal />
    </div>
  );
}

export default App;
```

## 🎨 功能特性

### ✅ 已实现功能

- ✅ 自动从 Worker API 获取数据
- ✅ 黑客终端风格界面（绿色字符）
- ✅ 打字机效果逐行显示
- ✅ 显示前10条新闻
- ✅ 中英文双语显示
- ✅ Loading 状态处理
- ✅ Error 状态处理
- ✅ 自动滚动到底部
- ✅ 响应式设计
- ✅ 光标闪烁动画

### 🎯 视觉效果

- 终端窗口样式（红黄绿三个按钮）
- 绿色字符 (#00ff00)
- 黑色背景 (#000)
- 打字机效果（每行100ms）
- 光标闪烁动画
- 自定义滚动条

## 🔧 配置选项

### 修改 API 地址

在组件中找到这一行：

```tsx
const response = await fetch('https://news.free-node.xyz/api/news');
```

改成你的 Worker 地址：

```tsx
const response = await fetch('https://你的域名.workers.dev/api/news');
```

### 修改显示数量

找到这一行：

```tsx
const top10 = data.items.slice(0, 10);
```

改成你想要的数量：

```tsx
const top10 = data.items.slice(0, 20); // 显示20条
```

### 修改打字速度

找到这一行：

```tsx
}, 100); // 每100ms显示一行
```

改成你想要的速度：

```tsx
}, 50);  // 更快
}, 200); // 更慢
```

## 🎨 自定义样式

### 修改颜色

```css
/* 改变终端颜色 */
color: #00ff00;  /* 绿色 */
color: #00ffff;  /* 青色 */
color: #ff00ff;  /* 紫色 */
color: #ffff00;  /* 黄色 */
```

### 修改字体

```css
font-family: 'Courier New', 'Monaco', monospace;
/* 或者 */
font-family: 'Fira Code', 'Consolas', monospace;
```

## 📱 响应式设计

组件已经包含响应式设计，在移动设备上会自动调整：

- 字体大小自动缩小
- 内边距自动调整
- 最小高度适配移动端

## 🐛 常见问题

### 1. TypeScript 类型错误

如果遇到 "找不到模块 './NewsTerminal.module.css'" 错误：

**方法1：使用提供的类型声明文件**
```bash
# 确保复制了 NewsTerminal.module.css.d.ts 文件
cp NewsTerminal.module.css.d.ts /Users/a12345/h5/free-node-web/src/components/
```

**方法2：添加全局类型声明**
```bash
# 复制 global.d.ts 到 src 目录
cp global.d.ts /Users/a12345/h5/free-node-web/src/
```

**方法3：在 tsconfig.json 中添加**
```json
{
  "compilerOptions": {
    "types": ["node"],
    "moduleResolution": "node"
  },
  "include": ["src/**/*", "src/**/*.d.ts"]
}
```

### 2. CORS 错误

如果遇到 CORS 错误，确保你的 Worker 已经设置了正确的 CORS 头：

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### 2. 数据不显示

检查：
- Worker API 是否正常运行
- 浏览器控制台是否有错误
- 网络请求是否成功

### 3. 样式不生效

如果使用 CSS Modules 版本，确保：
- 文件名是 `.module.css`
- 正确导入了样式文件
- 使用 `className={styles.xxx}` 而不是 `className="xxx"`

## 🔄 数据刷新

组件会在挂载时自动获取数据。如果需要手动刷新：

```tsx
// 添加刷新按钮
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  // ... 获取数据的代码
}, [refreshKey]); // 依赖 refreshKey

// 刷新按钮
<button onClick={() => setRefreshKey(prev => prev + 1)}>
  刷新
</button>
```

## 📊 数据格式

API 返回的数据格式：

```json
{
  "items": [
    {
      "rank": 1,
      "title": "Show HN: My Project",
      "titleCn": "展示项目：我的项目",
      "url": "https://example.com"
    }
  ],
  "timestamp": 1234567890,
  "updateTime": "2024-11-26 14:30:00"
}
```

## 🎯 下一步优化

可以考虑添加的功能：

- [ ] 添加刷新按钮
- [ ] 添加主题切换（绿色/蓝色/紫色）
- [ ] 添加字体大小调节
- [ ] 添加打字速度调节
- [ ] 添加全屏模式
- [ ] 添加分享功能
- [ ] 添加收藏功能
- [ ] 添加搜索过滤

## 📝 License

MIT
