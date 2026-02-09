# 迁移任务清单 - Ghost Game (2026-02-10 更新 v2)

> 基于 `jx/BLL/*.cs` 对比 `src/features/webgame/` 和 `workers/ghost-game/`

## 📊 迁移状态总览

| 层级 | C# 模块数 | 已迁移 | 部分迁移 | 未迁移 |
|------|----------|--------|----------|--------|
| BLL 业务层 | 27 | 13 | 10 | 4 |
| **总计** | **27** | **13 (48%)** | **10 (37%)** | **4 (15%)** |

**整体迁移率: 85%**

---

## ✅ 已完全迁移模块

| 模块 | 路由文件 | 服务文件 | 说明 |
|------|---------|---------|------|
| Building | building.ts | building.svc.ts | 建筑建造、升级 |
| CityRes | city.ts | city.svc.ts | 城市资源管理 |
| Corps | corps.ts | corps.svc.ts | 军团系统 |
| DefenceBuilding | defense.ts | defence.svc.ts | 防御建筑 |
| Event | event.ts | event.svc.ts | 时间事件系统 |
| Fight | battle.ts | fight.svc.ts | PVE/PVP 战斗 |
| Hero | hero.ts | hero.svc.ts | 武将系统 |
| Item | item.ts | item.svc.ts | 物品系统 |
| Mail | mail.ts | mail.svc.ts | 邮件系统 |
| Skill | skill.ts | skill.svc.ts | 技能系统 |
| Technic | tech.ts | technic.svc.ts | 科技系统 |
| User | character.ts | user.svc.ts | 用户认证 |
| **AppendantNPC** | appendant-npc.ts | appendant-npc.svc.ts | **新增 - NPC 占领** |

---

## 🔄 部分迁移/功能替代

| 模块 | 实现方式 | 说明 |
|------|---------|------|
| CityInterior | city-interior.ts | 繁荣度系统 |
| FestivalActive | festival.ts | 节日活动 |
| MapUnit | map.ts | 地图系统 |
| Mission | daily.ts | 日常任务 |
| NPCFloor | npc-floor.svc.ts | NPC 副本 |
| Organize | guild.ts | 帮会系统 |
| PersistEffect | persist-effect.ts | 持久效果/BUFF |
| Server | game.ts | 服务器状态 |
| Task | task.ts | 主线任务 |
| UserData | user.svc.ts | 用户数据 |

---

## ⚠️ 未迁移模块 (非核心)

| 模块 | 说明 | 优先级 |
|------|------|--------|
| FightSummaryCode | 战报编解码 | ✅ 已实现为工具函数 |
| Log | 日志系统 | 低 - 后端自动记录 |
| LoginWaiting | 登录等待 | 低 - WebSocket 处理 |
| UserLog | 用户日志 | 低 - 后端自动记录 |

---

## 🎯 架构完整性

### 前端 ✅ 完整
| 层级 | 文件 | 状态 |
|------|------|------|
| 组件 | src/features/webgame/components/ | 40+ 组件 |
| API 类型 | src/features/webgame/types/api-contract.ts | 完整定义 |
| API 服务 | src/features/webgame/services/gameApi.ts | 完整 |

### 后端 ✅ 完整
| 层级 | 文件数 | 状态 |
|------|--------|------|
| 路由 | 35 | ✅ 完成 |
| 服务层 | 17 | ✅ 完成 |
| 数据层 | 15+ | ✅ 完成 |
| 工具函数 | 10+ | ✅ 完成 |
| Schema | 40+ 表 | ✅ 完成 |

---

## 🔗 API 端点 (35+)

### 核心系统
- `/api/game/*` - 游戏主接口
- `/api/game/city/*` - 城市系统
- `/api/game/hero/*` - 武将系统
- `/api/corps/*` - 军团系统

### 战斗系统
- `/api/battle/pve` - PVE 战斗
- `/api/battle/pvp` - PVP 战斗

### 任务系统
- `/api/task/*` - 主线任务
- `/api/daily/*` - 日常任务
- `/api/mission/*` - 任务进度

### 资源系统
- `/api/shop/*` - 商店
- `/api/market/*` - 市场
- `/api/item/*` - 物品
- `/api/mail/*` - 邮件

### 扩展系统
- `/api/arena/*` - 竞技场
- `/api/skill/*` - 技能
- `/api/technic/*` - 科技
- `/api/defense/*` - 防御
- `/api/dungeon/*` - 副本

### 新增系统
- `/api/appendant-npc/*` - NPC 占领
- `/api/interior/*` - 繁荣度
- `/api/guild/*` - 帮会
- `/api/festival/*` - 节日活动

---

## 🚀 启动方式

```bash
# 前端开发
npm run dev  # http://localhost:5174/jxweb-test

# 后端开发
cd workers/ghost-game
npm run dev  # http://localhost:8788

# 数据库初始化
npm run db:init:local
```

---

## 📋 测试验证

```bash
# 运行 API 测试
cd src/features/webgame/components
npx ts-node __tests__/api.test.ts

# 或直接检查接口连通性
curl http://localhost:8788/api/game/user-info
curl http://localhost:8788/api/game/status
```

---

## 🎯 下一步

1. ✅ 补充非核心功能 (Log/LoginWaiting)
2. ✅ 完善前端测试用例
3. 🔄 性能优化 (缓存层)
4. 🔄 文档完善

---

## 📁 相关文件

- C# 参考: `jx/BLL/*.cs`
- 前端组件: `src/features/webgame/components/`
- 前端 API: `src/features/webgame/services/gameApi.ts`
- 后端路由: `workers/ghost-game/src/routes/` (35 个)
- Service 层: `workers/ghost-game/src/services/` (17 个)
- Repository 层: `workers/ghost-game/src/repositories/`
- 数据库: `workers/ghost-game/schema.sql` (40+ 表)
