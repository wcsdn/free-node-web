# MEMORY.md - 长期记忆

## 项目关键信息

### 项目结构
```
free-node-web/
├── jx/                          # 原始 C# ASP.NET 项目 (参考)
├── src/features/webgame/        # React 前端
├── workers/ghost-game/          # Cloudflare Workers 后端
├── SKILL.md                     # ⭐ 迁移技能指南
├── QUICKREF.md                  # ⭐ 开发速查卡
└── memory/                      # 每日会话记录
```

---

## 重要文档 (每次会话必读!)

```
⚠️ 重要: 新会话开始时必须读取以下文件!

1. SKILL.md          - 迁移技能完整指南
   位置: 项目根目录
   
2. QUICKREF.md       - 开发速查卡
   位置: 项目根目录
   
3. memory/YYYY-MM-DD.md - 最近的开发记录
   位置: memory/ 目录

4. PROJECT_STATUS.md - 项目进度和优先级
   位置: 项目根目录
```

---

## 核心技能要点

### 1. 前后端接口一致性 (最重要!)
```typescript
// 字段名必须完全一致!
后端返回: { id, name, level, max_hp }
前端期望: { id, name, level, max_hp }  // ✅ 一致

// 端点必须完全一致!
后端: POST /api/hero/list
前端: POST /api/hero/list  // ✅ 一致
```

### 2. 自动注册模式
```typescript
// 用户首次访问自动创建角色和城市
app.post('/user-info', async (c) => {
  const result = await ensureUserAndCity(db, wallet);
  if (!result) return error(c, '自动注册失败');
  return success(c, { ...userData });
});
```

### 3. 数据库访问模式
```typescript
// 使用参数化查询防止 SQL 注入
await db.prepare('SELECT * FROM heroes WHERE wallet_address = ?')
  .bind(walletAddress);
```

### 4. 全局函数挂载
```typescript
// 在 PopupManager.tsx 中挂载
window.OpenPage(pageId);    // 打开页面
window.OpenHero();          // 打开武将面板
window.OpenMall();          // 打开商城
// 等...
```

---

## 测试账号

| 用途 | 账号/地址 | 签名 |
|------|----------|------|
| 测试钱包 | `0x1234567890abcdef1234567890abcdef12345678` | `test_signature` |

---

## 服务器地址

| 环境 | 地址 |
|------|------|
| 前端开发 | http://localhost:5174/jxweb-test |
| 后端开发 | http://localhost:8788 |
| 生产前端 | https://free-node.xyz/jxweb-test |
| 生产后端 | https://game.free-node.xyz |

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 | UI 组件 |
| 前端语言 | TypeScript | 类型安全 |
| 构建工具 | Vite | 开发服务器 |
| 后端框架 | Cloudflare Workers | 无服务器函数 |
| 数据库 | D1 | SQLite 兼容 |
| 部署平台 | Cloudflare Pages + Workers | 边缘计算 |

---

## 常用命令

```bash
# 前端
npm run dev                    # 启动前端开发

# 后端
cd workers/ghost-game
npm run dev                    # 启动后端

# 数据库
npm run db:init:local          # 初始化本地 D1

# 构建
npm run build                  # 构建前端
```

---

## 项目进度

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 基础架构 | ✅ 完成 | 100% |
| 认证系统 | ✅ 完成 | 100% |
| 自动注册 | ✅ 完成 | 100% |
| 城市系统 | ✅ 完成 | 100% |
| 武将系统 | ✅ 完成 | 100% |
| 建筑系统 | ✅ 完成 | 100% |
| 军团系统 | 🔄 进行中 | 80% |
| 战斗系统 | ⬜ 待开始 | 0% |
| 任务系统 | ⬜ 待开始 | 0% |
| 邮件系统 | ⬜ 待开始 | 0% |
| 商城/市场 | ⬜ 待开始 | 0% |
| 排行榜/竞技 | ⬜ 待开始 | 0% |

---

## 常见问题

### Q: "City not found" 错误
**A**: 确保调用了自动注册接口 `/api/game/user-info`

### Q: 武将数据不显示
**A**: 检查接口一致性: 字段名必须匹配 `api-contract.ts` 定义

### Q: 按钮点击没反应
**A**: 检查全局函数是否正确挂载 `window.OpenXxx()`

### Q: 后端返回 500
**A**: 检查数据库是否初始化，查看 Wrangler 日志

---

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `jx/BLL/*.cs` | 原版业务逻辑 (参考) |
| `jx/Model/*.cs` | 原版数据模型 (参考) |
| `workers/ghost-game/src/routes/*.ts` | 后端 API |
| `src/features/webgame/components/*.tsx` | 前端组件 |
| `src/features/webgame/services/gameApi.ts` | 前端 API 服务 |
| `src/features/webgame/types/api-contract.ts` | 接口契约 (前后端一致性!) |
| `workers/ghost-game/schema.sql` | 数据库 schema |
| `workers/ghost-game/seed.sql` | 测试数据 |

---

## 会话习惯

```
✅ 每次会话开始时:
   1. 读取 SKILL.md (迁移技能)
   2. 读取 QUICKREF.md (速查)
   3. 读取 memory/YYYY-MM-DD.md (最近记录)
   4. 读取 PROJECT_STATUS.md (进度)

✅ 每次会话结束时:
   1. 更新 memory/YYYY-MM-DD.md (记录完成的工作)
   2. 如果有重要决策，更新 MEMORY.md
   3. 如果创建了新技能，更新 SKILL.md
```

---

## 更新日志

### 2026-02-08
- 用户强调：**只做本地迁移开发，不部署到现网**
- 清理重复任务文件（EXECUTION_REPORT.md, TODO.md）
- 精简 MIGRATION_LOG.md，只保留关键里程碑
- MIGRATION_TASKS.md 作为唯一任务追踪源

### 2026-02-05
- 创建 SKILL.md (迁移技能完整指南)
- 创建 QUICKREF.md (开发速查卡)
- 创建 MEMORY.md (长期记忆)
- 强调前后端接口一致性重要性
