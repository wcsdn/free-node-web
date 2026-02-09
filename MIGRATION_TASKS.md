# 迁移任务清单 - Ghost Game (2026-02-10 更新)

> 基于 `jx/BLL/*.cs` 和 `jx/DALEX/*.cs` 对比 `src/features/webgame/` 和 `workers/ghost-game/`

## 📊 迁移状态总览

| 层级 | C# 模块数 | 已迁移 | 部分迁移 | 未迁移 |
|------|----------|--------|----------|--------|
| BLL 业务层 | 27 | 20 | 5 | 2 |
| DALEX 数据层 | 8 | 5 | 2 | 1 |
| **总计** | **35** | **25 (71%)** | **7 (20%)** | **3 (9%)** |

---

## ✅ 已完成系统 (2026-02-10 更新)

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
| **Arena** | ✅ 完成 | 100% | 竞技场系统 (新增) |
| **Task Repository** | ✅ 完成 | 100% | 任务数据层 (新增) |
| **Battle Repository** | ✅ 完成 | 100% | 战斗数据层 (新增) |
| **Corps** | ✅ 完成 | 100% | 军团系统 v2.0 |
| **Defence** | ✅ 完成 | 100% | 防御系统 |
| **Chat** | ✅ 完成 | 100% | 聊天系统 |
| **Market** | ✅ 完成 | 100% | 市场系统 |
| **Shop** | ✅ 完成 | 100% | 商店系统 |
| **Signin** | ✅ 完成 | 100% | 签到系统 |

---

## 🔧 核心接口验证 (2026-02-10 更新)

### ✅ 全部通过 (5/5)

| 接口 | 状态 | 说明 |
|------|------|------|
| GET /api/game/user-info | ✅ 200 | 用户注册/自动创建 |
| POST /api/game/city/list | ✅ 200 | 城市列表 |
| POST /api/game/hero/list | ✅ 200 | 武将列表 |
| POST /api/game/corps/list | ✅ 200 | 军团列表 |
| GET /api/game/status | ✅ 200 | 服务器状态 |

### 架构完整性

| 层级 | 文件数 | 状态 |
|------|--------|------|
| Repository | 15 | ✅ 完成 |
| Service | 15 | ✅ 完成 |
| Routes | 34 | ✅ 完成 |
| Schema | 40 表 | ✅ 完成 |
| Config | 36 文件 | ✅ 完成 |

---

## 🚀 下一步工作

### 高优先级
- [ ] 完善前端 API 契约类型定义
- [ ] 补充缺失的 Service (如有)
- [ ] 完整 e2e 测试覆盖

### 中优先级
- [ ] API 文档生成 (OpenAPI)
- [ ] 性能优化 (缓存层)
- [ ] 日志/监控完善

### 低优先级
- [ ] 单元测试补充
- [ ] 代码注释完善

---

## 📁 相关文件

- C# 参考: `jx/BLL/*.cs`
- C# 数据: `jx/DALEX/*.cs`
- 前端组件: `src/features/webgame/components/`
- 前端 API: `src/features/webgame/services/gameApi.ts`
- 后端路由: `workers/ghost-game/src/routes/` (34 个)
- Repository: `workers/ghost-game/src/repositories/` (15 个)
- Service: `workers/ghost-game/src/services/` (15 个)
- 数据库: `workers/ghost-game/schema.sql` (40 表)
