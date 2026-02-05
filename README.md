# FREE-NODE Web3 Matrix Terminal

🎬 黑客帝国风格的 Web3 赛博朋克个人主页

**Live Demo**: [https://free-node.xyz](https://free-node.xyz)

---

## 这是什么？

一个基于 **React + TypeScript + Cloudflare 全家桶** 的全栈 Web3 项目，包含：

- 🖥️ 赛博朋克风格前端（Matrix 字符雨、CRT 终端特效、SVG 动画）
- 🔗 Web3 钱包集成（RainbowKit + wagmi，多链支持）
- ☁️ Serverless 后端（6 个 Cloudflare Workers 微服务）
- 🤖 AI 对话系统（DeepSeek V3 流式代理）
- 💬 实时聊天室（WebSocket + Durable Objects）
- 📧 临时邮箱服务（Email Routing + D1）
- 📡 IoT 监控中心（实时传感器数据 + Recharts 趋势图）

---

## 技术亮点

### 🔥 Cloudflare 全家桶实战

| 服务 | 技术栈 | 功能 |
|------|--------|------|
| **Ghost Mail** | Workers + D1 + Email Routing | 临时邮箱系统，批量注册收发验证码，定时清理 |
| **Ghost Live** | Workers + Durable Objects + WebSocket | 实时聊天室，全站在线人数统计，消息广播 |
| **Ghost Oracle** | Workers + DeepSeek API + SSE | AI 对话代理，流式响应，Turnstile 人机验证 |
| **Ghost Core** | Workers + D1 | 中央用户服务，分级配额，邀请系统，任务系统 |
| **Ghost IoT** | Workers + D1 + Hono + Service Binding | IoT 传感器数据采集，实时广播到聊天室 |
| **News Server** | Workers + KV + Cron + Google Translate | Web3 新闻爬虫，多源聚合，定时推送，幽灵情报站(全球热点监控) |

### 🎯 核心技术实现

- **WebSocket 聊天室**: Durable Objects 实现有状态连接，支持昵称、入场/离场通知、实时消息广播
- **邮件收发系统**: Cloudflare Email Routing 接收邮件 → Workers 解析存储 → D1 持久化，支持敏感词过滤
- **AI 流式对话**: DeepSeek V3 API 代理，SSE 流式透传，用户分级限流（游客/觉醒者/VIP）
- **用户分级体系**: IP 用户 → 钱包用户 → VIP，配额递增，邀请码奖励机制
- **新闻爬虫**: 定时爬取 BlockBeats/TechFlow/金色财经，智能分类，去重入库
- **IoT 数据采集**: Hono 框架 REST API，D1 存储，Service Binding 实时广播
- **IoT 监控前端**: WebSocket 实时数据推送，Recharts 双轴趋势图，温度过热警告
- **幽灵情报站**: 22个RSS源全球热点监控，70+地点关键词识别，Google Translate API自动翻译，3D地球可视化，定时爬虫(30分钟)

### 🎨 前端特效

- **Matrix 字符雨**: Canvas 渲染，随机字符大小/速度，流畅 60fps
- **CyberRabbit**: 4 种风格 SVG 动画，呼吸爱心，眨眼/挥手动效
- **CRT 终端**: 扫描线、噪点、荧光字体，复古显示器美学
- **打字机效果**: 逐字输出，光标闪烁，AI 对话流式渲染

---

## 技术栈

```
前端: React 18 + TypeScript + Vite 5 + Zustand
Web3: RainbowKit + wagmi + viem (ETH/Polygon/Base)
后端: Cloudflare Workers + D1 + KV + Durable Objects
AI:   DeepSeek V3 + Turnstile 人机验证
部署: Cloudflare Pages + GitHub Actions
```

---

## 项目结构

```
src/
├── features/           # 功能模块
│   ├── exchanges/      # 交易所活动聚合
│   ├── ghost-mail/     # 临时邮箱
│   ├── guestbook/      # 钱包签名留言板
│   ├── iot/            # IoT 监控中心（实时数据 + 趋势图表）
│   ├── news/           # Hacker News 终端
│   ├── profile/        # 个人档案（项目/技能雷达/时间轴）
│   ├── quests/         # 任务系统
│   ├── situation-monitor/ # 幽灵情报站（全球热点监控 + 3D地球）
│   └── web3/           # 钱包连接 & VIP
├── shared/
│   ├── components/     # MatrixRain / CyberRabbit / Toast / LiveCounter
│   ├── popup/          # ChatPopup(AI对话) / GhostChat(聊天室)
│   └── hooks/          # useWalletAuth / useSoundEffect
├── services/           # API 服务层
└── stores/             # Zustand 状态管理

workers/                # Cloudflare Workers 后端
├── ghost-core/         # 用户中心 (D1)
├── ghost-mail/         # 邮件服务 (D1 + Email Routing)
├── ghost-live/         # 聊天室 (Durable Objects + WebSocket)
├── ghost-oracle/       # AI 代理 (DeepSeek + SSE)
├── ghost-iot/          # IoT 传感器 (Hono + D1 + Service Binding)
└── news-server/        # 新闻爬虫 (KV + Cron)
```

---

## 快速开始

### 1. 环境配置

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

必需的环境变量：
- `VITE_WALLETCONNECT_PROJECT_ID`: 从 [WalletConnect Cloud](https://cloud.walletconnect.com/) 获取
- `VITE_TURNSTILE_SITE_KEY`: 从 [Cloudflare Turnstile](https://dash.cloudflare.com/) 获取

### 2. 安装依赖

```bash
npm install && npm run dev          # 本地开发
npm run deploy:prod                 # 部署前端
npm run deploy:workers              # 部署所有 Workers
```

## Workers 微服务

| 服务 | 域名 | 功能 | 文档 |
|------|------|------|------|
| ghost-core | core.free-node.xyz | 用户中心、D1 数据库 | [workers/ghost-core/README.md](./workers/ghost-core/README.md) |
| ghost-mail | - | 临时邮箱、D1、Email Routing | [workers/ghost-mail/README.md](./workers/ghost-mail/README.md) |
| ghost-live | - | 聊天室、WebSocket、Durable Objects | [workers/ghost-live/README.md](./workers/ghost-live/README.md) |
| ghost-oracle | oracle.free-node.xyz | AI 代理、DeepSeek、SSE | [workers/ghost-oracle/README.md](./workers/ghost-oracle/README.md) |
| ghost-iot | - | IoT 传感器、Hono、Service Binding | [workers/ghost-iot/README.md](./workers/ghost-iot/README.md) |
| news-server | - | 新闻爬虫、GAP 情报系统 | [workers/news-server/README.md](./workers/news-server/README.md) |

---

## License

MIT

---

⚡ Wake up, Neo... The Matrix has you...
