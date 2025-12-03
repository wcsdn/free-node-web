# FREE-NODE Web3 Matrix Terminal

🎬 黑客帝国风格的终端入口页面，采用 React + TypeScript 构建。

## ✨ 特性

### 🌧️ Matrix 字符雨背景
- 动态下落的字符流（95% 英文数字，5% 日文中文）
- 每列字符大小随机变化（85%-115%）
- 下落速度差异化（0.3-2.8 倍速）
- 优化的密度和间距，视觉效果更佳

### ⌨️ 打字机动画
- 页面中心逐行打印欢迎文字
- "Wake up, Neo.."
- "The Matrix has you..."
- 光标闪烁效果

### 🎯 CRT 显示器特效
- 扫描线动画
- 屏幕噪点效果
- 绿色荧光字体
- 复古终端美学

### 📰 Hacker News 终端
- 实时获取 Hacker News 热榜 TOP 10
- 黑客终端风格界面（红黄绿三色按钮）
- 逐行打印新闻内容
- 中英文双语显示
- 自动滚动和光标闪烁

### 🎨 交互按钮
- 三个幽灵按钮（带扫描线特效）
- 悬停发光效果
- 响应式设计

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

1. 复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

2. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com/) 注册并创建项目

3. 获取 Project ID 并填入 `.env` 文件：

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

> **注意：** `.env` 文件包含敏感信息，已被 `.gitignore` 忽略，不会提交到 Git 仓库。

### 本地开发

```bash
npm run dev
```

项目将在 http://localhost:5173 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

### 部署到 Cloudflare Pages

```bash
# 快速部署
npm run deploy

# 部署到生产环境
npm run deploy:prod

# 部署到预览环境
npm run deploy:preview
```

详细部署说明请查看 [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 📦 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **CSS3** - 动画和特效
- **Canvas API** - Matrix 字符雨渲染
- **RainbowKit** - Web3 钱包连接 UI
- **wagmi** - React Hooks for Ethereum
- **viem** - TypeScript Ethereum 接口

## 🎨 组件说明

### MatrixRain.tsx
Matrix 字符雨背景组件，使用 Canvas 实现：
- 字符集：英文字母、数字、符号、少量日文中文
- 列间距：2 倍字体大小
- 行间距：1.5 倍字体大小
- 拖尾效果：透明度 0.15

### NewsTerminal.tsx
黑客终端风格的新闻展示组件：
- API 地址：`https://news.free-node.xyz/api/news`
- 打字速度：100ms/行
- 显示数量：TOP 10
- 自动滚动到底部

### App.tsx
主应用组件，整合所有功能：
- 打字机动画控制
- 按钮显示逻辑
- 布局和样式

## 🎯 自定义配置

### 修改字符雨密度

编辑 `src/MatrixRain.tsx`：

```typescript
// 调整列数（当前为 50% 密度）
const calculatedColumns = Math.floor(canvas.width / fontSize / 2 * 1.05);

// 调整行间距
const y = drops[i] * fontSize * 1.5; // 数值越大间距越大
```

### 修改打字机文案

编辑 `src/App.tsx`：

```typescript
const LINES = [
  '> Wake up, free node space...',
  '> The Matrix has you...'
];
```

### 修改新闻 API

编辑 `src/components/NewsTerminal.tsx`：

```typescript
const response = await fetch('你的API地址');
```

## 🌐 部署

### 自动部署（推荐）

项目已配置 GitHub Actions 自动部署：

1. 推送代码到 `main` 分支自动触发生产部署
2. 创建 Pull Request 自动创建预览部署
3. 需要配置 GitHub Secrets（详见 [DEPLOYMENT.md](./docs/DEPLOYMENT.md)）

### 手动部署

```bash
npm run deploy:prod
```

### Cloudflare Pages 配置

⚠️ **重要：** 如果你的 Cloudflare Pages 项目之前使用 Create React App，需要更新配置：

- 构建命令：`npm run build`
- 输出目录：**`dist`**（不是 `build`）
- Node.js 版本：18+

详细配置步骤请查看 [CLOUDFLARE_SETUP.md](./docs/CLOUDFLARE_SETUP.md)

### 其他平台

支持部署到任何静态网站托管平台：
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

详细部署指南请查看 [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 📱 响应式设计

- 桌面端：完整体验
- 移动端：自动调整字体大小和间距
- 平板：优化布局

## 🔧 开发说明

详细的项目结构说明请查看 [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

### 项目结构

```
free-node-web/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动部署
├── docs/
│   ├── DEPLOYMENT.md             # 部署指南
│   └── SETUP_COMPLETE.md         # 配置完成总结
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── scripts/
│   └── deploy.sh                 # 快速部署脚本
├── src/
│   ├── components/
│   │   ├── CyberRabbit.tsx       # 赛博兔子组件
│   │   ├── CyberRabbit.css
│   │   ├── MatrixRain.tsx        # Matrix 字符雨
│   │   ├── NewsTerminal.tsx      # 新闻终端组件
│   │   └── NewsTerminal.css
│   ├── config/
│   │   └── wagmiConfig.ts        # Web3 配置
│   ├── App.tsx                   # 主应用
│   ├── App.css
│   ├── index.tsx                 # 入口文件
│   └── index.css
├── .env.example                  # 环境变量示例
├── package.json
├── tsconfig.json
├── vite.config.mjs
├── wrangler.toml                 # Cloudflare Pages 配置
└── README.md
```

### Git 提交规范

- `feat:` 新功能
- `fix:` 修复 bug
- `style:` 样式调整
- `refactor:` 重构
- `docs:` 文档更新

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
https://free-node.xyz
## 📧 联系方式

- GitHub: [@wcsdn](https://github.com/wcsdn)
- Email: 362179571@qq.com

---

⚡ Powered by React & Matrix

