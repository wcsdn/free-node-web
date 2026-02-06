# 🚀 Ghost Game 部署检查清单

## ✅ 已完成

- [x] 创建 Worker 项目结构
- [x] 实现核心 API（角色、城市）
- [x] 设计数据库 Schema
- [x] 创建 D1 数据库
  - 数据库 ID: `dd1e2677-5330-4681-ae87-b915e6631341`
  - 区域: WNAM
- [x] 更新 wrangler.toml 配置
- [x] 更新 MCP 工具配置
- [x] 安装所有依赖

## ⏳ 待完成（网络恢复后）

### 1. 初始化数据库 Schema

```bash
cd workers/ghost-game
npm run db:init
```

如果网络问题，可以稍后重试或使用本地测试：
```bash
npm run db:init:local
```

### 2. 部署 Worker

使用 MCP 工具（推荐）：
```
"部署 ghost-game"
```

或手动部署：
```bash
npm run deploy
```

### 3. 验证部署

```bash
# 健康检查
curl https://game.free-node.xyz/health

# 应该返回
{
  "status": "ok",
  "service": "ghost-game",
  "timestamp": "..."
}
```

### 4. 测试 API

需要先在前端连接钱包并获取认证：

```bash
# 创建角色
curl -X POST https://game.free-node.xyz/api/character/create \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature" \
  -d '{"name":"测试角色"}'

# 获取角色信息
curl https://game.free-node.xyz/api/character/info \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature"

# 获取城市列表
curl https://game.free-node.xyz/api/city/list \
  -H "X-Wallet-Auth: 0xYourAddress:YourSignature"
```

## 📋 配置信息

### 数据库
- **名称**: ghost-game-db
- **ID**: dd1e2677-5330-4681-ae87-b915e6631341
- **区域**: WNAM
- **绑定**: DB

### Worker
- **名称**: ghost-game
- **域名**: game.free-node.xyz
- **框架**: Hono
- **语言**: TypeScript

### API 端点
- `GET /health` - 健康检查
- `POST /api/character/create` - 创建角色
- `GET /api/character/info` - 获取角色信息
- `GET /api/character/resources` - 获取资源信息
- `GET /api/city/list` - 获取城市列表
- `GET /api/city/:id` - 获取城市详情
- `POST /api/city/:id/collect` - 收集资源

## 🔍 故障排查

### 数据库初始化失败
- 检查网络连接
- 确认 wrangler.toml 中的 database_id 正确
- 尝试使用 `--local` 标志本地测试

### 部署失败
- 检查 wrangler 版本（建议升级到 4.x）
- 确认 Cloudflare 账号权限
- 查看错误日志

### API 返回 401
- 检查 X-Wallet-Auth 头格式
- 确认钱包签名有效
- 查看 Worker 日志

### CORS 错误
- 确认前端域名在 CORS 配置中
- 检查请求头是否正确

## 📊 监控

### 查看日志
```bash
npm run tail
```

或使用 MCP 工具：
```
"看看 ghost-game 的日志"
```

### 查询数据库
```bash
npm run db:query "SELECT * FROM characters LIMIT 10"
```

或使用 MCP 工具：
```
"查一下 ghost-game-db 的 characters 表"
```

### 数据库管理界面
```bash
npm run db:studio
```

## 🎯 下一步开发

参考 `PROJECT_STATUS.md`：

1. **英雄系统** (5-7天)
   - 招募 API
   - 培养 API
   - 装备 API

2. **建筑系统** (5-7天)
   - 建造 API
   - 升级 API
   - 队列管理

3. **战斗系统** (3-4天)
   - PVE 战斗
   - 战斗计算
   - 战报生成

## 📞 需要帮助？

- [SETUP.md](./SETUP.md) - 完整设置指南
- [README.md](./README.md) - Worker 文档
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) - 项目状态
- [GAME_PROJECT_SUMMARY.md](../../GAME_PROJECT_SUMMARY.md) - 项目总结

---

**当前状态**: 🟡 等待初始化数据库和部署  
**数据库**: ✅ 已创建  
**配置**: ✅ 已更新  
**代码**: ✅ 已完成
