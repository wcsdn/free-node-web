# Ghost Game Worker

网页游戏后端服务，集成到 free-node-web 项目。

## 技术栈

- Cloudflare Workers
- Hono 框架
- D1 数据库
- KV 存储
- TypeScript

## 认证方式

使用钱包签名认证，复用 free-node-web 的认证系统。

请求头格式：
```
X-Wallet-Auth: {address}:{signature}
```

## 本地开发

```bash
# 安装依赖
npm install

# 创建环境变量文件
cp .dev.vars.example .dev.vars

# 本地运行
npm run dev

# 初始化数据库（本地）
npm run db:init:local
```

## 部署

使用 MCP 工具部署：
```
"部署 ghost-game"
```

或手动部署：
```bash
npm run deploy
```

## 数据库管理

```bash
# 创建数据库
npm run db:create

# 初始化 Schema（远程）
npm run db:init

# 查询数据库
npm run db:query "SELECT * FROM characters LIMIT 10"

# 打开数据库管理界面
npm run db:studio
```

## API 端点

### 角色相关
- `GET /api/character/info` - 获取角色信息
- `POST /api/character/create` - 创建角色
- `GET /api/character/resources` - 获取资源信息

### 城市相关
- `GET /api/city/list` - 获取城市列表
- `GET /api/city/:id` - 获取城市详情
- `POST /api/city/:id/collect` - 收集资源

## 项目结构

```
workers/ghost-game/
├── src/
│   ├── index.ts              # Worker 入口
│   ├── routes/               # 路由模块
│   │   ├── character.ts      # 角色路由
│   │   └── city.ts           # 城市路由
│   ├── utils/                # 工具函数
│   │   ├── auth.ts           # 认证工具
│   │   └── response.ts       # 响应格式
│   └── types/                # 类型定义
│       └── index.ts
├── schema.sql                # 数据库 Schema
├── wrangler.toml             # Worker 配置
└── package.json
```

## 配置

在 `wrangler.toml` 中配置：
- D1 数据库绑定
- KV 命名空间绑定
- 路由规则

## 监控

查看实时日志：
```bash
npm run tail
```

或使用 MCP 工具：
```
"看看 ghost-game 的日志"
```
