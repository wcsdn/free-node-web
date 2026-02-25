# 迁移映射关系文档

本文档记录 C# 原始项目到 TypeScript 迁移项目的映射关系。

## BLL (业务逻辑层) 映射

| C# 文件 (jx/BLL/) | TypeScript 文件 (workers/ghost-game/src/services/) |
|------------------|---------------------------------------------------|
| User.cs | user.svc.ts |
| City.cs | city.svc.ts |
| CityInterior.cs | city-ext.svc.ts |
| Hero.cs | hero.svc.ts |
| HeroEx.cs | hero-ext.svc.ts |
| Item.cs | item.svc.ts |
| ItemEx.cs | item-ext.svc.ts |
| Task.cs | task.service.ts |
| TaskEx.cs | task-ext.svc.ts |
| Mail.cs | mail.svc.ts |
| MailEx.cs | mail-ext.svc.ts |
| Organize.cs | organize.svc.ts |
| OrganizeEx.cs | organize-ext.svc.ts |
| Corps.cs | corps.svc.ts |
| Battle.cs | fight.svc.ts |
| Arena.cs | arena.svc.ts |
| DefenceBuilding.cs | defence.svc.ts |
| Skill.cs | skill.svc.ts |
| NPCFloor.cs | npc-floor.svc.ts |
| PersistEffect.cs | persist-effect.svc.ts |
| PersistEffectEx.cs | persist-effect-ext.svc.ts |
| Event.cs | event.svc.ts |
| EventEx.cs | event-ext.svc.ts |
| Technic.cs | technic.svc.ts |
| Building.cs | building.svc.ts |
| CityRes.cs | ⏳ 未完全迁移 (城市资源相关) |
| MapUnit.cs | repositories/map-unit.repo.ts |
| Mission.cs | ⏳ 未完全迁移 (任务系统) |
| FestivalActive.cs | repositories/festival.repo.ts |
| UserData.cs | repositories/userdata.repo.ts |
| Log.cs | ⏳ 未迁移 (日志系统) |
| LoginWaiting.cs | ⏳ 未迁移 (登录等待) |
| FightSummaryCode.cs | ⏳ 未迁移 (战斗总结代码) |

## DALEX (数据访问层扩展) 映射

| C# 文件 (jx/DALEX/) | TypeScript 文件 | 说明 |
|---------------------|-----------------|------|
| StaticDataAccess.cs | config/static-config.svc.ts | 静态配置访问 |
| EventExAccess.cs | services/event-ext.svc.ts | 事件扩展访问 |
| BuildingExAccess.cs | services/city-ext.svc.ts | 建筑扩展访问 |
| CorpsExAccess.cs | services/corps.svc.ts | 军团扩展访问 |
| NPCFloorAccess.cs | services/npc-floor.svc.ts | NPC关卡访问 |
| AppendantNPCExAccess.cs | services/appendant-npc.svc.ts | 随从NPC访问 |
| ChessExAccess.cs | routes/battle.ts | 棋局系统 (路由层) |
| ServerExAccess.cs | repositories/server.repo.ts | 服务器信息 |

## DAL (数据访问层) 映射

| C# 文件 (jx/DAL/) | TypeScript 文件 |
|------------------|-----------------|
| UserAccess.cs | repositories/user.repo.ts |
| CityAccess.cs | repositories/city.repo.ts |
| HeroAccess.cs | repositories/hero.repo.ts |
| ItemAccess.cs | repositories/item.repo.ts |
| MailAccess.cs | repositories/mail.repo.ts |
| BattleAccess.cs | repositories/battle.repo.ts |
| TechnicAccess.cs | repositories/technic.repo.ts |
| OrganAccess.cs | repositories/organize.repo.ts |
| AppendantNPCAccess.cs | repositories/appendant-npc.repo.ts |
| NPCFloorAccess.cs | repositories/npc-floor.repo.ts |
| LogAccess.cs | repositories/log.repo.ts |

## 配置文件映射 (XML -> JSON)

| XML 文件 (jx/Web/App_Data/CN/) | JSON 文件 (workers/ghost-game/src/config/) |
|-------------------------------|-------------------------------------------|
| HeroInfo.xml | heroes.json |
| BuildingInfo.xml | buildings.json |
| ItemInfo.xml | items.json |
| Skill.xml | skills.json |
| MainTask.xml | tasks.json |
| Npc.xml | npcs.json |
| WorldNpc.xml | world_npcs.json |
| PersistEffect.xml | persist_effects.json |
| PersistEffectGroup.xml | persist_effect_groups.json |
| CommodityInfo.xml | commodities.json |
| ItemExchangeMission.xml | item_exchange.json |
| ItemDisassemble.xml | item_disassemble.json |
| UserPrestige.xml | prestige.json |
| UserFame.xml | fame.json |
| WarfareInfo.xml | warfare.json |
| BattleDefence.xml | battle_defense.json |
| WorldLandform.xml | landforms.json |
| BattleLandform.xml | battle_terrains.json |
| InitInfo.xml | init.json |
| Gift.xml | gifts.json |
| CantonData.xml | cantons.json |
| GetOrganizeResMap.xml | org_resources.json |
| OrgnizeResMap.xml | org_effects.json |
| OrgResName.xml | org_names.json |
| OddsItemInfo.xml | odds.json |
| MissionCondition.xml | mission_conditions.json |
| MissionGain.xml | mission_gains.json |
| MissionByLevel.xml | missions_by_level.json |
| PicInfo.xml | pictures.json |
| NameInfo.xml | names.json |

## 数据库表映射

| 表名 | 说明 |
|------|------|
| characters | 用户角色表 |
| cities | 城市表 |
| buildings | 建筑表 |
| heroes | 武将表 |
| items | 物品表 |
| mails | 邮件表 |
| battles | 战斗记录表 |
| organizes | 帮会表 |
| organize_members | 帮会成员表 |
| organize_applications | 帮会申请表 |
| organize_techs | 帮会科技表 |
| persist_effects | 持久效果表 |
| tasks | 任务进度表 |
| events | 用户事件表 |
| user_data | 用户数据表 |
| technics | 科技表 |
| corps | 军团表 |

## 完整度检查

- [x] BLL 业务逻辑层迁移 (~90%)
- [x] DAL 数据访问层迁移 (~95%)
- [x] DALEX 扩展层迁移 (~90%)
- [x] XML 配置转 JSON (100%)
- [x] 路由层 API 迁移 (100%)

### 待完善功能

- [ ] LoginWaiting.cs 登录等待 (可选功能)
- [x] Log.cs 日志系统 - 已迁移至 src/repositories/log.repo.ts
- [x] FightSummaryCode.cs 战斗总结代码 - 已迁移至 src/utils/fight-summary.ts
- [x] CityRes.cs 城市资源 - 部分实现于 src/services/city.svc.ts
- [x] Mission.cs 任务系统 - 已迁移至 src/repositories/mission.repo.ts

---
最后更新: 2026-02-25
