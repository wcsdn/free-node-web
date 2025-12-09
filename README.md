# FREE-NODE Web3 Matrix Terminal

🎬 黑客帝国风格的 Web3 终端入口，采用 React + TypeScript + RainbowKit 构建的赛博朋克个人主页。

## ✨ 核心特性

### 🌧️ Matrix 字符雨背景
- 动态下落的字符流（95% 英文数字，5% 日文中文）
- 每列字符大小随机变化（85%-115%）
- 下落速度差异化（0.3-2.8 倍速）
- Canvas 渲染优化，流畅的视觉效果

### ⌨️ 打字机动画
- 页面中心逐行打印欢迎文字
- "Wake up, Neo.."
- "The Matrix has you..."
- "Follow the white rabbit."
- 光标闪烁效果

### 🎯 CRT 显示器特效
- 扫描线动画
- 屏幕噪点效果
- 绿色荧光字体
- 复古终端美学

### 🐰 赛博机械兔子 (CyberRabbit)
- 4 种风格切换（经典/几何/极简/黑客）
- 黑客风格：胸口呼吸的红色爱心 ❤️
- 肚子显示 "I LOVE YOU" 带闪烁动画
- 耳朵摆动、手臂挥动、眼睛眨动
- 绿色荧光特效
- SVG 动画实现

### 🌹 赛博玫瑰 (CyberRose)
- 机械风格玫瑰装饰
- 呼吸光效动画
- 赛博朋克美学元素

### 🔐 Web3 钱包连接
- 自定义 "Open Door" 按钮（黑客风格）
- 支持多种钱包（MetaMask、WalletConnect 等）
- RainbowKit 集成，深色主题定制
- 显示钱包地址、网络、余额
- ENS 域名支持
- 游客模式提示

### 💎 VIP 内容区
- 连接钱包后解锁
- 黑客风格卡片设计
- ETH 余额验证（≥ 0.01 ETH）
- USDT 资产显示
- 独家内容展示

### 💰 捐赠模块 (DonateButton)
- 迷你机械兔子（带呼吸爱心）
- "Feed the Rabbit" 主题
- 一键捐赠 0.001 ETH
- 交易状态实时显示
- 呼吸光效按钮
- 成功/失败音效反馈

### 📰 Hacker News 终端
- 实时获取 Hacker News 热榜
- 黑客终端风格界面（红黄绿三色按钮）
- 逐行打印新闻内容（打字机效果）
- 中英文双语显示
- 点击标题跳转原文
- 加载更多功能（分页加载）
- 自动滚动和光标闪烁
- 备用数据机制

### 📧 Ghost Mail（幽灵信箱）
- VIP 专属功能
- 支付 0.001 ETH 解锁
- 访问权限验证
- 邮件终端界面
- 与后端 API 集成

### 📁 个人档案 (Profile)
- **项目档案馆 (Project Archives)**
  - 机密文件风格的项目展示
  - 卡片式布局，支持展开/收起
  - 显示项目状态（ACTIVE/WIP/ARCHIVED）
  - 技术栈标签展示
  - GitHub 和 Demo 链接
  - "TOP SECRET" 水印效果

- **技能树雷达图 (Skill Radar)**
  - 六边形雷达图可视化技能水平
  - 使用 Recharts 库渲染
  - 神经网络风格设计
  - 技能进度条动画
  - 支持前端、后端、区块链、DevOps、设计、安全等维度

- **执行日志时间轴 (Execution Log)**
  - 垂直时间轴展示个人经历
  - 里程碑、升级、当前任务等不同类型标记
  - 悬停动画效果
  - 当前任务脉冲动画

### 🎵 音效系统
- 按钮 hover 音效（机械滋滋声）
- 点击音效
- 成功/错误提示音
- 背景白噪音（Server Room Hum）
- 可开关控制
- 使用 use-sound 库

### ⚙️ 设置面板
- 机械代码风格弹窗
- 居中显示，背景遮罩
- 语言切换（中文/English）
- 音效开关
- 背景音开关
- 设置持久化存储

### 🌐 多语言支持 (i18n)
- 中英文无缝切换
- 所有组件完整翻译
- 语言偏好持久化存储
- 独立的翻译文件管理（en.ts / zh.ts）

### 🔒 留言板 (Guestbook)
- 钱包签名留言系统
- 首次签名，后续免签（localStorage 记录）
- 回复功能（单层回复）
- 管理员删除功能（单条/全部）
- XSS 安全防护（sanitize 工具）
- 紧凑显示，优化移动端
- 头像表情自动生成
- 实时轮询更新

### 🎨 UI 组件系统
- **ActionButton**: 浮动操作按钮（Profile/News/Ghost Mail/Settings）
- **Backdrop**: 模态框背景遮罩
- **Toast**: 消息提示系统
- **Footer**: 页脚组件（快速链接、法律信息、免责声明）
- **GlobalModals**: 全局模态框管理

### 🔄 Context 状态管理
- **LanguageContext**: 语言切换
- **SoundContext**: 音效控制
- **ToastContext**: 消息提示
- **ModalContext**: 模态框管理
- **RouterContext**: 路由导航

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

项目使用 WalletConnect 进行钱包连接，Project ID 已硬编码在 `src/features/web3/config.ts` 中。

如需使用自己的 Project ID：
1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com/) 注册并创建项目
2. 修改 `src/features/web3/config.ts` 中的 `projectId` 字段

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
# 完整部署（构建+发布）
npm run deploy              # 预览环境
npm run deploy:prod         # 生产环境

# 仅发布（不构建，适合构建已完成的情况）
npm run pub                 # 预览环境
npm run pub:prod            # 生产环境
```

### 其他部署命令

```bash
# 部署 Ghost Mail Worker
npm run deploy:mail

# 部署 News Server Worker
npm run deploy:news

# 初始化 Ghost Mail 数据库
npm run db:init
```

## 📦 技术栈

### 前端框架
- **React 18.2** - UI 框架
- **TypeScript 5.9** - 类型安全
- **Vite 5.4** - 快速构建工具
- **Recharts 3.5** - 数据可视化（雷达图）

### 状态管理
- **Zustand 5.0** - 轻量级状态管理
- **React Context** - 全局状态共享

### Web3 集成
- **RainbowKit 2.2.9** - Web3 钱包连接 UI
- **wagmi 2.12.0** - React Hooks for Ethereum
- **viem 2.40.3** - TypeScript Ethereum 接口
- **TanStack Query 5.90** - 数据获取和缓存

### 音效系统
- **use-sound 5.0** - React Hook for sound effects
- **Howler.js** - 音频播放引擎

### 样式和动画
- **CSS3** - 动画和特效
- **CSS Modules** - 组件级样式隔离
- **Canvas API** - Matrix 字符雨渲染
- **SVG 动画** - 机械兔子和玫瑰动效

### 网络请求
- **openapi-fetch 0.15** - 类型安全的 API 客户端
- **Axios** - HTTP 请求库

### 部署
- **Cloudflare Pages** - 静态网站托管
- **Cloudflare Workers** - 后端 API（Ghost Mail / News Server）
- **Wrangler 4.51** - Cloudflare 部署工具

### 开发工具
- **ESLint** - 代码检查
- **TypeScript** - 类型检查
- **Vite** - 开发服务器和构建工具

### 支持的区块链网络
- **Ethereum Mainnet** - 主网
- **Polygon** - 侧链
- **Base** - Layer 2

## 🚀 部署

### 自动部署（推荐）

项目已配置 GitHub Actions 自动部署：

1. 推送代码到 `main` 分支自动触发生产部署
2. 创建 Pull Request 自动创建预览部署
3. 需要配置 GitHub Secrets：`CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`

### 手动部署

```bash
npm run deploy:prod
```

### Cloudflare Pages 配置

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node.js 版本：18+
- 环境变量：无需配置（Project ID 已硬编码）

### 其他平台

支持部署到任何静态网站托管平台：
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 📱 响应式设计

- 桌面端：完整体验，所有动画和特效
- 移动端：自动调整字体大小和间距，优化触摸交互
- 平板：优化布局，适配中等屏幕

## 🔧 项目结构

```
free-node-web/
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions 自动部署
├── .kiro/
│   └── specs/                        # 功能规格文档
│       └── architecture-optimization/ # 架构优化规格
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── scripts/
│   └── performance-test.mjs          # 性能测试脚本
├── src/
│   ├── config/                       # 全局配置
│   │   ├── constants.ts              # 常量（地址、API 端点等）
│   │   ├── env.ts                    # 环境变量配置
│   │   └── i18n/                     # 国际化配置
│   │       ├── index.ts
│   │       ├── translations/
│   │       │   ├── en.ts             # 英文翻译
│   │       │   └── zh.ts             # 中文翻译
│   │       └── types.ts
│   ├── features/                     # 功能模块（按功能组织）
│   │   ├── donation/                 # 捐赠功能
│   │   │   └── components/
│   │   │       └── DonateButton/
│   │   ├── ghost-mail/               # Ghost Mail 功能
│   │   │   ├── components/
│   │   │   │   ├── AccessGuard/
│   │   │   │   └── MailTerminal/
│   │   │   └── GhostMailPage/
│   │   ├── guestbook/                # 留言板功能
│   │   │   ├── components/
│   │   │   │   └── Guestbook/
│   │   │   └── utils/
│   │   │       └── sanitize.ts       # XSS 防护
│   │   ├── news/                     # Hacker News 功能
│   │   │   └── NewsPage/
│   │   ├── profile/                  # 个人档案功能
│   │   │   ├── components/
│   │   │   │   ├── ProjectArchives/
│   │   │   │   ├── SkillRadar/
│   │   │   │   └── ExecutionLog/
│   │   │   ├── ProfilePage/
│   │   │   └── config.ts             # 个人信息配置
│   │   ├── settings/                 # 设置面板
│   │   │   ├── index.tsx
│   │   │   └── styles.css
│   │   └── web3/                     # Web3 功能
│   │       ├── components/
│   │       │   └── VipContent/
│   │       └── config.ts             # Wagmi 配置
│   ├── services/                     # 服务层（API 调用）
│   │   ├── api/                      # API 客户端
│   │   │   ├── client.ts             # 基础 HTTP 客户端
│   │   │   └── types.ts              # API 类型定义
│   │   ├── ghost-mail/               # Ghost Mail 服务
│   │   │   └── index.ts
│   │   └── news/                     # News 服务
│   │       └── index.ts
│   ├── shared/                       # 共享组件和工具
│   │   ├── components/               # 通用 UI 组件
│   │   │   ├── ActionButton/         # 浮动操作按钮
│   │   │   ├── Backdrop/             # 背景遮罩
│   │   │   ├── CyberRabbit/          # 机械兔子
│   │   │   ├── CyberRose/            # 机械玫瑰
│   │   │   ├── ErrorBoundary/        # 错误边界
│   │   │   ├── Footer/               # 页脚
│   │   │   ├── Loading/              # 加载组件
│   │   │   ├── MatrixRain/           # Matrix 字符雨
│   │   │   ├── Toast/                # 消息提示
│   │   │   ├── ui/                   # UI 组件库
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Input/
│   │   │   │   └── Modal/
│   │   │   └── index.ts
│   │   ├── contexts/                 # React Context
│   │   │   ├── LanguageContext.tsx   # 语言切换
│   │   │   ├── ModalContext.tsx      # 模态框管理
│   │   │   ├── RouterContext.tsx     # 路由导航
│   │   │   ├── SoundContext.tsx      # 音效控制
│   │   │   └── ToastContext.tsx      # 消息提示
│   │   ├── hooks/                    # 自定义 Hooks
│   │   │   ├── useLanguage.ts        # 语言切换 Hook
│   │   │   └── useSoundEffect.ts     # 音效 Hook
│   │   ├── layouts/                  # 布局组件
│   │   │   └── GlobalModals/         # 全局模态框
│   │   └── utils/                    # 工具函数
│   │       ├── errorHandler.ts       # 错误处理
│   │       ├── globalAPI.ts          # 全局 API
│   │       ├── performance.ts        # 性能监控
│   │       └── soundEffects.ts       # 音效管理
│   ├── stores/                       # 状态管理（Zustand）
│   │   └── useAppStore.ts            # 应用全局状态
│   ├── styles/                       # 全局样式系统
│   │   ├── base/                     # 基础样式
│   │   │   ├── animations.css        # 动画定义
│   │   │   ├── reset.css             # CSS 重置
│   │   │   └── typography.css        # 字体排版
│   │   ├── themes/                   # 主题变量
│   │   │   └── variables.css         # CSS 变量
│   │   └── utilities/                # 工具类
│   │       ├── effects.css           # 特效类
│   │       ├── layout.css            # 布局类
│   │       └── spacing.css           # 间距类
│   ├── types/                        # TypeScript 类型定义
│   │   ├── api.ts                    # API 类型
│   │   ├── ghost-mail.ts             # Ghost Mail 类型
│   │   └── index.ts                  # 类型导出
│   ├── App.tsx                       # 主应用组件
│   ├── App.css                       # 主应用样式
│   ├── index.tsx                     # 应用入口
│   ├── index.css                     # 全局样式入口
│   └── global.d.ts                   # 全局类型声明
├── .gitignore
├── ARCHITECTURE.md                   # 架构文档
├── CHANGELOG.md                      # 变更日志
├── PERFORMANCE_ANALYSIS.md           # 性能分析文档
├── index.html                        # HTML 模板
├── package.json                      # 依赖和脚本
├── tsconfig.json                     # TypeScript 配置
├── tsconfig.node.json                # Node TypeScript 配置
├── vite.config.mjs                   # Vite 配置
├── wrangler.toml                     # Cloudflare 配置
└── README.md
```

## 🎯 核心配置文件

### `src/config/constants.ts`
全局常量配置，包括：
- `TREASURY_ADDRESS`: 收款地址
- `ADMIN_ADDRESS`: 管理员地址
- `PAYMENT_AMOUNTS`: 支付金额配置
- `API_ENDPOINTS`: API 端点配置

### `src/features/web3/config.ts`
Web3 配置，包括：
- WalletConnect Project ID
- 支持的区块链网络
- 钱包存储配置

### `src/features/profile/config.ts`
个人信息配置，包括：
- 项目列表
- 技能树数据
- 时间轴数据

## 🛠️ 开发指南

### 添加新功能模块

1. 在 `src/features/` 下创建新文件夹
2. 按照现有结构组织组件和样式
3. 在 `src/i18n/` 中添加翻译
4. 在 `App.tsx` 或相应页面中引入

### 修改个人信息

编辑 `src/features/profile/config.ts` 和 `src/config/constants.ts`

### 添加新语言

1. 在 `src/i18n/` 下创建新的语言文件（如 `ja.ts`）
2. 在 `translations.ts` 中注册新语言
3. 更新 `Language` 类型定义

### Git 提交规范

- `feat:` 新功能
- `fix:` 修复 bug
- `style:` 样式调整
- `refactor:` 重构
- `docs:` 文档更新
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具相关

## 🔒 安全特性

- **XSS 防护**: 留言板使用 sanitize 工具过滤危险内容
- **钱包签名验证**: 首次留言需要钱包签名验证身份
- **管理员权限**: 基于钱包地址的管理员权限控制
- **本地存储**: 敏感数据不上传服务器，仅存储在浏览器

## 🎨 自定义配置

### 修改收款地址

编辑 `src/config/constants.ts`:
```typescript
export const TREASURY_ADDRESS = '0xYourAddress' as const;
```

### 修改个人信息

编辑 `src/features/profile/config.ts`:
```typescript
export const profileConfig = {
  projects: [...],  // 项目列表
  skills: {...},    // 技能数据
  timeline: [...],  // 时间轴
};
```

### 修改 API 端点

编辑 `src/config/constants.ts`:
```typescript
export const API_ENDPOINTS = {
  NEWS: 'https://your-news-api.com',
  GHOST_MAIL: 'https://your-ghost-mail-api.com',
} as const;
```

## 🐛 已知问题

- Matrix 字符雨在低性能设备上可能卡顿（可通过降低密度优化）
- 移动端部分动画效果可能不流畅
- 留言板数据存储在 localStorage，清除浏览器数据会丢失

## 🏗️ 架构特点

### 模块化设计
- **功能模块化**：按功能划分的 features 目录结构
- **组件复用**：共享组件库和 UI 组件系统
- **服务层分离**：独立的 API 服务层
- **类型安全**：完整的 TypeScript 类型定义

### 性能优化
- **代码分割**：按路由和功能动态加载
- **React.memo**：组件级别的性能优化
- **Canvas 优化**：Matrix 字符雨的高效渲染
- **性能监控**：内置性能监控工具

### 状态管理
- **Zustand**：轻量级全局状态管理
- **Context API**：功能级状态共享
- **LocalStorage**：持久化存储

### 错误处理
- **ErrorBoundary**：React 错误边界
- **全局错误处理**：统一的错误处理机制
- **Toast 提示**：用户友好的错误提示

## 🚧 开发计划

- [x] 架构优化和代码重构
- [x] 性能监控系统
- [x] 组件库建设
- [x] 状态管理优化（Zustand）
- [ ] 后端数据库集成（替代 localStorage）
- [ ] 更多区块链网络支持
- [ ] NFT 展示功能
- [ ] 更多主题风格切换
- [ ] 单元测试和 E2E 测试

## 📄 License

MIT License - 自由使用和修改

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！

## 📧 联系方式

- 个人主页: [https://free-node.xyz](https://free-node.xyz)
- GitHub: [@wcsdn](https://github.com/wcsdn)
- Email: 362179571@qq.com

## 🙏 致谢

- [RainbowKit](https://www.rainbowkit.com/) - 优秀的 Web3 钱包连接组件
- [wagmi](https://wagmi.sh/) - 强大的 React Hooks for Ethereum
- [Recharts](https://recharts.org/) - 简洁的 React 图表库
- [Cloudflare Pages](https://pages.cloudflare.com/) - 快速的静态网站托管

---

⚡ Powered by React + Web3 + Matrix

🎬 Wake up, Neo... The Matrix has you...

