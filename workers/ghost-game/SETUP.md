# Ghost Game Worker 设置指南

## 当前状态

✅ Worker 代码结构已创建
✅ 数据库 Schema 已准备
✅ 前端 API 服务已创建
✅ MCP 工具已更新
⏳ 需要创建 D1 数据库
⏳ 需要部署 Worker

## 下一步操作

### 1. 创建 D1 数据库

```bash
cd workers/ghost-game
wrangler d1 create ghost-game-db
```

创建成功后，会返回数据库 ID，类似：
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 更新 wrangler.toml

将返回的 database_id 填入 `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ghost-game-db"
database_id = "你的数据库ID"  # 替换这里
```

### 3. 初始化数据库 Schema

```bash
# 远程数据库
npm run db:init

# 或本地测试
npm run db:init:local
```

### 4. 创建 KV 命名空间（可选）

```bash
wrangler kv:namespace create "GAME_KV"
```

将返回的 ID 填入 wrangler.toml（取消注释）:

```toml
[[kv_namespaces]]
binding = "KV"
id = "你的KV ID"
```

### 5. 配置环境变量

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，设置 JWT_SECRET。

### 6. 本地测试

```bash
npm run dev
```

访问 http://localhost:8787/health 测试。

### 7. 部署到生产环境

使用 MCP 工具：
```
"部署 ghost-game"
```

或手动部署：
```bash
npm run deploy
```

### 8. 配置域名路由

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 找到 ghost-game
3. 添加自定义域名：`game.free-node.xyz`

或者在 wrangler.toml 中已配置路由，部署时会自动生效。

### 9. 更新 MCP 工具配置

在 `scripts/mcp-server.ts` 中添加数据库 ID：

```typescript
const D1_DBS = {
  // ... 其他数据库
  'ghost-game-db': '你的数据库ID',
};
```

## 测试 API

### 创建角色

```bash
curl -X POST https://game.free-node.xyz/api/character/create \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature" \
  -d '{"name":"测试角色"}'
```

### 获取角色信息

```bash
curl https://game.free-node.xyz/api/character/info \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature"
```

### 获取城市列表

```bash
curl https://game.free-node.xyz/api/city/list \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature"
```

## 前端集成

前端代码已准备好：
- API 服务：`src/features/webgame/services/gameApi.ts`
- 游戏逻辑：`src/features/webgame/hooks/useGameLogic.ts`
- 配置文件：`src/features/webgame/config.ts`

在 `src/features/webgame/index.tsx` 中使用：

```typescript
import { useGameLogic } from './hooks/useGameLogic';
import { gameApi } from './services/gameApi';

const { loadGame, createCharacter } = useGameLogic();
```

## 数据库管理

### 查询数据

```bash
npm run db:query "SELECT * FROM characters LIMIT 10"
```

### 打开数据库管理界面

```bash
npm run db:studio
```

### 查看日志

```bash
npm run tail
```

或使用 MCP 工具：
```
"看看 ghost-game 的日志"
```

## 故障排查

### 认证失败

检查前端是否正确设置了 `X-Wallet-Auth` 头：
```typescript
localStorage.getItem('wallet-auth')
```

### CORS 错误

确保 Worker 中的 CORS 配置包含你的前端域名。

### 数据库连接失败

检查 wrangler.toml 中的 database_id 是否正确。

## 下一步开发

参考 `.kiro/specs/game-migration-to-vue/tasks.md`：

1. ✅ 阶段0: 准备工作（已完成）
2. 🔄 阶段1: MVP 核心功能
   - ✅ 角色系统（基础完成）
   - ✅ 城市系统（基础完成）
   - ⏳ 英雄系统
   - ⏳ 战斗系统

继续实现：
- 英雄招募和培养
- 建筑建造系统
- 战斗计算引擎
- 任务系统
- 邮件系统
