# Ghost Game 快速开始

## 🚀 立即开始（网络恢复后）

### 1️⃣ 创建数据库
```bash
cd workers/ghost-game
wrangler d1 create ghost-game-db
```

会返回类似：
```
✅ Successfully created DB 'ghost-game-db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2️⃣ 更新配置
编辑 `wrangler.toml`，填入数据库 ID：
```toml
[[d1_databases]]
binding = "DB"
database_name = "ghost-game-db"
database_id = "你的数据库ID"  # 替换这里
```

### 3️⃣ 初始化数据库
```bash
npm run db:init
```

### 4️⃣ 部署
```bash
npm run deploy
```

或使用 MCP 工具：
```
"部署 ghost-game"
```

## ✅ 验证部署

### 健康检查
```bash
curl https://game.free-node.xyz/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "ghost-game",
  "timestamp": "2026-02-02T..."
}
```

### 测试 API
```bash
# 创建角色（需要钱包认证）
curl -X POST https://game.free-node.xyz/api/character/create \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature" \
  -d '{"name":"测试角色"}'
```

## 📊 项目状态

- ✅ Worker 代码完成
- ✅ 数据库 Schema 完成
- ✅ 前端 API 服务完成
- ⏳ 等待创建数据库
- ⏳ 等待部署

## 📁 已创建文件

```
workers/ghost-game/
├── src/
│   ├── index.ts              ✅ Worker 入口
│   ├── routes/
│   │   ├── character.ts      ✅ 角色 API
│   │   └── city.ts           ✅ 城市 API
│   ├── utils/
│   │   ├── auth.ts           ✅ 认证工具
│   │   └── response.ts       ✅ 响应格式
│   └── types/
│       └── index.ts          ✅ 类型定义
├── schema.sql                ✅ 数据库 Schema
├── wrangler.toml             ✅ Worker 配置
├── package.json              ✅ 依赖配置
└── README.md                 ✅ 文档

src/features/webgame/
├── services/
│   └── gameApi.ts            ✅ API 服务
├── hooks/
│   └── useGameLogic.ts       ✅ 游戏逻辑
└── config.ts                 ✅ 游戏配置
```

## 🎯 下一步开发

参考 `PROJECT_STATUS.md` 中的开发计划：

1. **英雄系统** (5-7天)
2. **建筑系统** (5-7天)
3. **战斗系统** (3-4天)

## 📞 需要帮助？

查看详细文档：
- [SETUP.md](./SETUP.md) - 完整设置指南
- [README.md](./README.md) - Worker 文档
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) - 项目状态
- [GAME_PROJECT_SUMMARY.md](../../GAME_PROJECT_SUMMARY.md) - 项目总结

---

**准备就绪！** 🎮
