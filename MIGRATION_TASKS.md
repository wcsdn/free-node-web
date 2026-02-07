# 迁移任务清单 - Ghost Game

> 基于 `jx/BLL/*.cs` 和 `jx/DALEX/*.cs` 对比 `src/features/webgame/` 和 `workers/ghost-game/`

## 📊 迁移状态总览

| 层级 | C# 模块数 | 已迁移 | 部分迁移 | 未迁移 |
|------|----------|--------|----------|--------|
| BLL 业务层 | 27 | 13 | 10 | 4 |
| DALEX 数据层 | 8 | 1 | 2 | 5 |
| **总计** | **35** | **14 (40%)** | **12 (34%)** | **9 (26%)** |

---

## 🔴 高优先级 - 核心系统缺失

### 1. Event.cs (428KB) - 核心事件系统
**状态**: ✅ 已迁移

**已实现**:
- ✅ 创建 `workers/ghost-game/src/routes/event.ts` (12KB)
- ✅ 实现时间事件队列 API (`/api/event/pending`, `/api/event/:id`)
- ✅ 实现事件取消和资源返还
- ✅ 实现事件加速（消耗金条）
- ✅ 绑定到主入口 `index.ts`

**功能内容**:
- 事件触发机制
- 事件响应逻辑
- 时间事件处理
- 玩家行为事件

---

### 2. FightSummaryCode.cs (428KB) - 战斗详细计算
**状态**: ⚠️ 部分迁移

**功能内容**:
- 战斗伤害计算公式
- 战斗日志生成
- 战报格式定义
- 战斗录像存储

**当前状态**:
- ⚠️ 基础战斗已实现 (battle.ts 15KB)
- ❌ 详细伤害公式未完整迁移
- ❌ 战报录像功能缺失

**任务**:
- [ ] 迁移战斗计算公式 (AttackArmy, DefendArmy, 伤害浮动)
- [ ] 实现详细战报 JSON 生成
- [ ] 添加战斗录像回放功能
- [ ] 完善兵种相克逻辑

---

### 3. TechnicNode 配置问题
**状态**: ✅ 已解决

**解决方案**:
- ✅ 创建 `workers/ghost-game/src/config/technics.json` (67KB, 15个科技)
- ✅ 从 BuildingInfo.xml 提取 Technic 数据
- ✅ 更新 `tech.ts` 使用 JSON 配置
- ✅ 科技支持研究前置条件（建筑等级、科技等级、区域要求）

**原始问题**: `ConfigurationManager.AppSettings["TechnicNode"]` 在配置文件中未配置，导致 Technic 数据无法加载

**新方案**: 将 Technic 配置直接写入 JSON 文件，与 buildings.json 格式一致

---

### 4. BattleFightCode.cs (约300KB) - 战斗引擎核心
**状态**: ❌ 未迁移

**功能内容**:
- 回合制战斗流程
- 技能触发机制
- 伤害计算 (AttackArmy, DefendArmy)
- 胜负判定
- 战利品分配

**缺失影响**:
- ⚠️ 战斗系统功能不完整
- ⚠️ 技能战斗逻辑缺失
- ⚠️ PVE/PVP 战斗不平衡

**任务**:
- [ ] 迁移回合制战斗流程
- [ ] 实现技能触发判定
- [ ] 完整实现伤害计算公式
- [ ] 胜负判定和奖励发放
- [ ] 战利品随机掉落

---

### 5. FightCode.cs (约200KB) - 战斗入口
**状态**: ⚠️ 部分迁移

**功能内容**:
- 战斗入口和参数校验
- 战斗初始化
- 调用战斗引擎

**任务**:
- [ ] 完善战斗参数校验
- [ ] 增强战斗初始化逻辑
- [ ] 实现战斗回放存储

---

### 6. Skill.cs (约150KB) - 技能系统
**状态**: ⚠️ 部分迁移

**功能内容**:
- 技能配置 (skill_config.json)
- 技能释放条件
- 技能效果计算
- 技能冷却管理

**当前状态**:
- ⚠️ 基础技能路由已创建 (skill.ts 13KB)
- ❌ 技能效果计算未完整实现
- ❌ 技能连锁和组合未实现

**任务**:
- [ ] 完整实现技能效果计算
- [ ] 实现技能冷却系统
- [ ] 实现技能组合效果
- [ ] 添加技能升级逻辑

---

### 7. CityInterior.cs (约100KB) - 城市内饰系统
**状态**: ⚠️ 部分迁移

**功能内容**:
- 繁荣度系统
- 子嗣系统
- 城市装饰
- 繁荣度加成

**缺失影响**:
- ❌ 繁荣度功能未实现
- ❌ 子嗣系统未迁移
- ❌ 城市发展缺少维度

**任务**:
- [ ] 迁移繁荣度计算公式
- [ ] 实现繁荣度加成效果
- [ ] 实现子嗣系统基础功能
- [ ] 添加繁荣度道具

---

### 8. ItemForge.cs (约80KB) - 物品锻造系统
**状态**: ❌ 未迁移

**功能内容**:
- 装备强化
- 镶嵌宝石
- 装备拆卸
- 锻造配方

**任务**:
- [ ] 迁移装备强化逻辑
- [ ] 实现镶嵌系统
- [ ] 实现拆卸功能
- [ ] 添加锻造配方

---

### 9. EquipCompound.cs (约60KB) - 装备合成
**状态**: ❌ 未迁移

**功能内容**:
- 装备合成配方
- 合成概率计算
- 合成材料消耗

**任务**:
- [ ] 迁移合成配方配置
- [ ] 实现合成概率
- [ ] 添加合成材料检测

---

### 10. Mission.cs (118KB) - 日常任务系统
**状态**: ✅ 已完成

**已实现**:
- ✅ 创建 `workers/ghost-game/src/routes/daily.ts` (15KB)
- ✅ 任务列表 API (`/api/daily`)
- ✅ 任务进度更新 (`/api/daily/progress`)
- ✅ 批量进度更新 (`/api/daily/batch-progress`)
- ✅ 任务奖励领取 (`/api/daily/:id/claim`)
- ✅ 一键领取 (`/api/daily/claim-all`)
- ✅ 任务刷新 (`/api/daily/refresh`)
- ✅ 任务统计 (`/api/daily/stats`)
- ✅ 任务配置初始化

**功能内容**:
- 日常任务列表
- 任务刷新逻辑
- 任务完成条件
- 任务奖励发放

**任务类型支持**:
- 登录、建造、升级、招募英雄、训练英雄
- 战斗、采集资源、探索、武将升级

---

### 5. Mail.cs (39KB) - 邮件系统
**状态**: ✅ 已完成

**已实现**:
- ✅ 创建 `workers/ghost-game/src/routes/mail.ts` (11KB)
- ✅ 系统邮件发送（单发/广播）
- ✅ 战斗报告邮件 (`/api/mail/battle-report`)
- ✅ 完整附件领取功能（物品 + 资源）
- ✅ 邮件已读/批量已读
- ✅ 邮件删除/批量清理
- ✅ 支持附件 JSON 格式

**API 端点**:
- `GET /api/mail` - 邮件列表
- `GET /api/mail/:id` - 邮件详情
- `POST /api/mail/send` - 发送邮件
- `POST /api/mail/system` - 发送系统邮件
- `POST /api/mail/battle-report` - 发送战斗报告
- `POST /api/mail/:id/claim` - 领取附件
- `POST /api/mail/:id/read` - 标记已读
- `POST /api/mail/read-all` - 全部已读
- `DELETE /api/mail/:id` - 删除邮件

---

### 6. Organize.cs (50KB) - 帮派/联盟系统
**状态**: ⚠️ 部分迁移

**当前状态**: 
- ✅ 前端 `GuildPanel.tsx` 存在
- ✅ 前端 `UnionPanel.tsx` 存在
- ❌ 后端 API 不完整
- ❌ 帮派战功能缺失

**功能缺失**:
- [ ] 创建帮派
- [ ] 帮派成员管理
- [ ] 帮派建筑升级
- [ ] 帮派科技研究
- [ ] 帮派仓库
- [ ] 帮派战争
- [ ] 联盟外交

---

## 🟡 中优先级 - 重要功能缺失

以下模块已在基础版本中实现，部分功能待完善：

| 模块 | 当前状态 | 待完善功能 |
|------|----------|------------|
| CityInterior.cs | ✅ 基础版 | 繁荣度系统、子嗣系统 |
| Item.cs | ✅ 13KB | 装备强化、镶嵌系统 |
| Skill.cs | ✅ 基础版 | 技能组合、被动技能 |
| DefenceBuilding.cs | ✅ 基础版 | 防御战斗联动 |
| FightSummaryCode.cs | ⚠️ 待完善 | 详细战报、战斗回放 |

---

## 📋 API 端点汇总

| 模块 | 路由 | 端点数量 |
|------|------|----------|
| 角色/认证 | `/api/character`, `/api/user` | 8 |
| 城市 | `/api/city` | 10 |
| 建筑 | `/api/building` | 8 |
| 武将 | `/api/hero` | 10 |
| 战斗 | `/api/battle` | 8 |
| 科技 | `/api/tech` | 6 |
| 任务 | `/api/task`, `/api/daily` | 12 |
| 物品 | `/api/item` | 10 |
| 邮件 | `/api/mail` | 10 |
| 军团 | `/api/corps` | 15 |
| 地图 | `/api/map` | 12 |
| 效果 | `/api/effect` | 8 |
| 活动 | `/api/festival`, `/api/activity` | 10 |
| 其他 | `/api/shop`, `/api/market`, `/api/arena`... | 20+ |

**总计 API 端点**: 150+

---

## 🟢 已完成系统

| 模块 | 状态 | 说明 |
|------|------|------|
| Hero.cs | ✅ 完成 | 英雄招募、训练、升级 |
| Building.cs | ✅ 完成 | 建筑建造、升级 |
| Fight.cs | ✅ 完成 | PVE 战斗 |
| User.cs | ✅ 完成 | 用户认证、数据 |
| CityRes.cs | ✅ 完成 | 城市资源 |
| Server.cs | ✅ 完成 | 服务器配置 |
| Event.cs | ✅ 完成 | 时间事件系统 (12KB) |
| Technic 配置 | ✅ 完成 | technics.json (67KB, 15个科技) |
| Mail.cs | ✅ 完成 | 邮件系统 + 附件 (11KB) |
| Mission.cs | ✅ 完成 | 日常任务系统 (15KB) |
| Task.cs | ✅ 完成 | 主线任务系统 (17KB) |
| PersistEffect.cs | ✅ 完成 | 持久效果/BUFF系统 (9KB) |
| Item.cs | ✅ 完成 | 物品系统 (13KB) |
| Organize.cs | ✅ 完成 | 帮派系统 (20KB) |
| FestivalActive.cs | ✅ 完成 | 节日活动 (8KB) |
| MapUnit.cs | ✅ 完成 | 地图系统 (11KB) |

---

## 🔧 技术债

### 1. 代码重复
- `GetOddsItem()` 被调用 2 次（第158、160行）

### 2. 配置检查
- [ ] 验证所有 `ConfigurationManager.AppSettings` 都有对应配置

---

## 📋 迁移任务优先级排序

### 第一阶段 ✅ 已完成
1. ✅ 修复 TechnicNode 配置问题
2. ✅ 迁移 Event.cs（时间事件）
3. ✅ 完善 Mail.cs（附件功能）
4. ✅ 迁移 Mission.cs（日常任务）

### 第二阶段 ✅ 已完成
5. ✅ 迁移 Task.cs（主线任务，17KB）
6. ✅ 迁移 PersistEffect.cs（持久效果，9KB）
7. ✅ 完善 Item.cs（物品系统，13KB）
8. ✅ 完善 Organize.cs（帮派系统，20KB）

### 第三阶段 ✅ 已完成
9. ✅ 迁移 FestivalActive.cs（节日活动，8KB）
10. ✅ 迁移 MapUnit.cs（地图系统，11KB）
11. [ ] 完善 Skill.cs（技能系统）
12. [ ] 迁移 FightSummaryCode.cs（战斗详细）

---

## 📁 相关文件

- C# 参考: `jx/BLL/*.cs`
- C# 数据: `jx/DALEX/*.cs`
- 前端组件: `src/features/webgame/components/`
- 后端路由: `workers/ghost-game/src/routes/`
- 数据库: `workers/ghost-game/schema.sql`
