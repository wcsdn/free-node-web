# 🏗️ Monorepo 架构文档

## 📁 项目结构

```
free-node-web/                    # 根目录 (Monorepo)
├── src/                          # 前端源码
│   ├── features/                 # 功能模块
│   │   ├── ghost-mail/          # Ghost Mail 前端
│   │   ├── news/                # News 前端
│   │   └── guestbook/           # Guestbook 前端
│   ├── shared/                  # 共享组件
│   ├── config/                  # 配置文件
│   └── types/                   # TypeScript 类型
│
├── workers/                      # 后端服务 (扁平化)
│   ├── ghost-mail/              # Ghost Mail Worker
│   │   ├── src/                 # Worker 源码
│   │   ├── wrangler.toml        # Cloudflare 配置
│   │   ├── package.json         # 独立依赖
│   │   └── schema.sql           # D1 数据库
│   │
│   └── news-server/             # News Worker
│       ├── src/                 # Worker 源码
│       ├── wrangler.toml        # Cloudflare 配置
│       └── package.json         # 独立依赖
│
├── docs/                         # 项目文档
├── public/                       # 静态资源
├── package.json                  # 根依赖 + 便捷脚本
└── vite.config.mjs              # 前端构建配置
```

## 🎯 架构原则

### 1. 扁平化管理
- ✅ 所有后端服务平行放置在 `workers/` 目录
- ✅ 避免嵌套依赖地狱
- ✅ 每个服务独立管理依赖

### 2. 职责分离
- **前端** (`src/`): React + TypeScript + Vite
- **后端** (`workers/`): Cloudflare Workers
- **文档** (`docs/`): 架构和功能文档

### 3. 独立部署
每个服务可以独立部署，互不影响：
```bash
npm run deploy:mail    # 部署 Ghost Mail Worker
npm run deploy:news    # 部署 News Worker
npm run deploy         # 部署前端
```

## 📦 依赖管理

### 根目录 (前端)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "wagmi": "^2.12.0",
    "viem": "^2.40.3",
    "@rainbow-me/rainbowkit": "^2.2.9"
  }
}
```

### workers/ghost-mail
```json
{
  "dependencies": {
    "postal-mime": "^2.3.4",
    "hono": "^4.6.14"
  }
}
```

### workers/news-server
```json
{
  "dependencies": {
    "hono": "^4.6.14"
  }
}
```

## 🚀 开发工作流

### 前端开发
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
```

### 后端开发
```bash
# Ghost Mail
cd workers/ghost-mail
npm run dev          # 本地开发
npm run deploy       # 部署到 Cloudflare

# News Server
cd workers/news-server
npm run dev
npm run deploy
```

### 便捷脚本（根目录）
```bash
npm run deploy:mail  # 部署 Ghost Mail
npm run deploy:news  # 部署 News Server
npm run db:init      # 初始化 Ghost Mail 数据库
```

## 🔄 迁移记录

### 重构前
```
server/
├── src/              # News Worker
├── ghost-mail/       # ❌ 嵌套在 News 下
│   └── node_modules/ # ❌ 重复依赖
└── node_modules/     # ❌ 重复依赖
```

### 重构后
```
workers/
├── ghost-mail/       # ✅ 独立服务
│   └── node_modules/
└── news-server/      # ✅ 独立服务
    └── node_modules/
```

## 📊 服务配置

### Ghost Mail Worker
- **Name**: `ghost-mail-api`
- **Domain**: `ghost-mail-api.free-node.xyz`
- **Database**: D1 (ghost-mail-db)
- **Cron**: 每小时清理旧邮件

### News Worker
- **Name**: `free-node-news`
- **Domain**: `news.free-node.xyz`
- **Storage**: KV (NEWS_CACHE)

## 🎯 优势

1. **清晰的职责划分**: 前后端完全分离
2. **独立的依赖管理**: 避免版本冲突
3. **灵活的部署策略**: 可以单独部署任何服务
4. **更好的可维护性**: 扁平化结构易于理解
5. **团队协作友好**: 不同团队可以独立开发各自的服务

## 📚 相关文档

- [Ghost Mail 文档](./GHOST_MAIL.md)
- [Ghost Mail 快速部署](../workers/ghost-mail/QUICKSTART.md)
- [项目结构完整文档](./PROJECT_STRUCTURE_COMPLETE.md)
