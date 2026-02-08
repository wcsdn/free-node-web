# 迁移任务清单 - Ghost Game (2026-02-08 更新)

> 基于 `jx/BLL/*.cs` 和 `jx/DALEX/*.cs` 对比 `src/features/webgame/` 和 `workers/ghost-game/`

## 📊 迁移状态总览

| 层级 | C# 模块数 | 已迁移 | 部分迁移 | 未迁移 |
|------|----------|--------|----------|--------|
| BLL 业务层 | 27 | 18 | 6 | 3 |
| DALEX 数据层 | 8 | 3 | 2 | 3 |
| **总计** | **35** | **21 (60%)** | **8 (23%)** | **6 (17%)** |

---

## ✅ 已完成系统 (API 路由已修复)

| 模块 | 状态 | 完成度 | 说明 |
|------|------|--------|------|
| Hero.cs | ✅ 完成 | 100% | 英雄招募、训练、升级 |
| Building.cs | ✅ 完成 | 100% | 建筑建造、升级 |
| Fight.cs | ✅ 完成 | 100% | PVE 战斗 v2.0 |
| User.cs | ✅ 完成 | 100% | 用户认证、数据 |
| CityRes.cs | ✅ 完成 | 100% | 城市资源 |
| Server.cs | ✅ 完成 | 100% | 服务器配置 |
| Event.cs | ✅ 完成 | 100% | 时间事件系统 (12KB) |
| Technic 配置 | ✅ 完成 | 100% | technics.json (67KB, 15个科技) |
| Mail.cs | ✅ 完成 | 100% | 邮件系统 + 附件 (11KB) |
| Mission.cs | ✅ 完成 | 100% | 日常任务系统 (15KB) |
| Task.cs | ✅ 完成 | 100% | 主线任务系统 (17KB) |
| PersistEffect.cs | ✅ 完成 | 100% | 持久效果/BUFF系统 (9KB) |
| Item.cs | ✅ 完成 | 100% | 物品系统 (13KB) |
| FestivalActive.cs | ✅ 完成 | 100% | 节日活动 (8KB) |
| MapUnit.cs | ✅ 完成 | 100% | 地图系统 (11KB) |
| Skill.cs | ✅ **v2.0 完成** | 95% | 技能组合+冷却 |
| CityInterior.cs | ✅ **v2.0 完成** | 100% | 繁荣度系统 |
| ItemCraft.cs | ✅ **v2.0 完成** | 100% | 物品锻造系统 |
| **BattleEngine** | ✅ **v2.0 完成** | 100% | 战斗引擎核心 |

---

## 🔧 API 路由修复 (2026-02-08)

### 修复的问题：

1. ✅ **City API** - 前端 `/api/city/${cityId}` → 后端 `/api/building/city/${cityId}`
2. ✅ **Building API** - 前端 `/api/building/list/${cityId}` → `/api/building/city/${cityId}`
3. ✅ **Hero API** - 移除不存在的 `/api/hero/${heroId}/upgrade`，使用训练接口
4. ✅ **Skill API** - `/api/skill/config` → `/api/skill/configs`
5. ✅ **Skill API** - `/api/skill/hero/${heroId}` → `/api/skill/equipped/${heroId}`
6. ✅ **Skill API** - unequip 使用 POST 而非 DELETE
7. ✅ **Battle API** - `/api/battle/pve` → `/api/battle/pve/dungeon`
8. ✅ **Battle API** - `/api/battle/history` → `/api/battle`
9. ✅ **Mail API** - `/api/mail/list` → `/api/mail`
10. ✅ **Rank API** - `/api/rank/${type}` → `/api/rank/`

---

## ⚠️ 待实现系统

### 1. 帮派系统 (Organize.cs) - 高优先级
**状态**: ❌ **未迁移**

**问题**: 前端调用 `/api/guild/*` 但后端没有对应的路由

**任务**:
- [ ] 创建 `workers/ghost-game/src/routes/guild.ts`
- [ ] 实现帮派创建、加入、退出
- [ ] 实现帮派成员管理
- [ ] 实现帮派捐献
- [ ] 更新前端 API 调用

**当前前端 API 调用** (需要后端支持):
```typescript
async getMyGuild()
async getGuildList(search?: string)
async createGuild(name: string)
async joinGuild(guildId: number)
async leaveGuild()
async getGuildInfo(guildId: number)
async donateToGuild(guildId: number, resourceType: string, amount: number)
```

---

## 📈 整体进度: ~90%

**已实现**:
- ✅ 创建所有核心 API 路由 (35+ 端点)
- ✅ 实现繁荣度系统 (`/api/interior/*`)
- ✅ 实现物品锻造系统 (`/api/item/craft/*`)
- ✅ 实现战斗引擎 (`/api/battle/*`)
- ✅ 实现任务系统 (`/api/task/*`, `/api/daily/*`)
- ✅ 实现邮件系统 (`/api/mail/*`)
- ✅ 实现地图系统 (`/api/map/*`)
- ✅ 实现军团系统 (`/api/corps/*`)

---

## 📁 相关文件

- C# 参考: `jx/BLL/*.cs`
- C# 数据: `jx/DALEX/*.cs`
- 前端组件: `src/features/webgame/components/`
- 前端 API: `src/features/webgame/services/gameApi.ts`
- 后端路由: `workers/ghost-game/src/routes/`
- 数据库: `workers/ghost-game/schema.sql` (36 表)
