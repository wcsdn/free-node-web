# Ghost Game Worker - 架构文档

## 📁 目录结构

```
workers/ghost-game/
├── src/
│   ├── routes/          # 22 个路由文件（与 api-config.js 完全对齐）
│   ├── services/        # 业务逻辑层
│   ├── repositories/    # 数据访问层
│   ├── config/          # 游戏配置文件（JSON）
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   └── index.ts         # Worker 入口
├── migrations/          # 数据库迁移文件
│   ├── 000_schema.sql
│   ├── 001_initial.sql
│   ├── 002_fix_buildings.sql
│   ├── 003_seed_basic.sql
│   └── 004_seed_comprehensive.sql
├── __tests__/           # 测试文件
├── scripts/             # 脚本工具
├── .dev.vars.example    # 环境变量示例
├── wrangler.toml        # Cloudflare Worker 配置
├── package.json
└── README.md
```

## 🎯 架构原则

### 1. 配置驱动
- 所有 API 路由基于 `api-config.js`（221 个方法，22 个分组）
- 前端 JS 和 C# Main.aspx.cs 是唯一真实来源
- Worker 路由与配置 100% 对齐

### 2. 分层架构
```
Routes (路由层)
  ↓
Services (业务逻辑层)
  ↓
Repositories (数据访问层)
  ↓
D1 Database
```

### 3. 命名规范
- 路由文件: `xxx.ts` (如 `game.ts`, `hero.ts`)
- 服务文件: `xxx.svc.ts` (如 `hero.svc.ts`)
- 仓储文件: `xxx.repo.ts` (如 `hero.repo.ts`)
- 参数命名: 使用 C# 驼峰命名（`cityID`, `heroID`）

## 📋 当前状态

### ✅ 已完成
- 删除 19 个 AI 自创的路由文件
- 新增 3 个缺失的路由（admin, effect, warfare）
- 清理 7 个冗余文档
- 整理 SQL 文件到 migrations/
- 删除过时的 repositories 和 services
- 路由与 api-config.js 完全对齐（22/22 = 100%）

### ⚠️ 待完善
1. **Repositories 层不完整**
   - 缺失: admin, effect, event, game, guild, map, market, rank, shop, warfare
   - 需要为新路由创建对应的 repo

2. **Services 层不完整**
   - 缺失: admin, effect, game, guild, map, market, rank, shop, warfare, chat
   - user.svc.ts 应该重命名为 game.svc.ts

3. **路由实现不完整**
   - 大部分路由只有骨架，返回 TODO 或 Mock 数据
   - 需要基于 C# 逻辑逐步实现

4. **测试覆盖不足**
   - 只有 3 个测试文件，可能已过时
   - 需要更新测试用例

## 🚀 下一步计划

### 阶段 1: 补全基础架构
1. 为缺失的路由创建 repositories
2. 为缺失的路由创建 services
3. 更新 services/index.ts 和 repositories/index.ts

### 阶段 2: 实现核心功能
1. 优先实现高频 API（game, hero, building, item）
2. 参考 C# Main.aspx.cs 的业务逻辑
3. 确保参数命名和返回格式一致

### 阶段 3: 测试和优化
1. 更新测试用例
2. 性能优化
3. 错误处理完善

## 📝 开发规范

### 添加新路由
1. 在 `api-config.js` 中添加配置
2. 创建 `src/routes/xxx.ts`
3. 创建 `src/services/xxx.svc.ts`
4. 创建 `src/repositories/xxx.repo.ts`
5. 在 `src/index.ts` 中注册路由
6. 添加测试用例

### 参数命名
- 使用 C# 的驼峰命名：`cityID`, `heroID`, `itemID`
- 不使用下划线：~~`city_id`~~
- 参数顺序与前端 JS 调用一致

### 错误处理
```typescript
try {
  // 业务逻辑
  return success(c, data);
} catch (err: any) {
  return error(c, err.message);
}
```

## 🔗 相关文档
- API 配置: `public/jx-web/Js/api-config.js`
- API 文档: `public/jx-web/Js/API_README.md`
- 请求流程: `docs/API_REQUEST_FLOW.md`
- C# 原始代码: `jx/Web/Main.aspx.cs`
