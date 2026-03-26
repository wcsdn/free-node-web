# C# BLL vs Workers Routes API 返回格式差异报告

## task.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /task/ | TaskInfo[] | TaskInfo[] | C# TaskInfo 有 RewardGold/Exp 对应 TS 的 GetMoney/GetFood/GetGold |
| POST /task/list | TaskInfo[] | TaskInfo[] | 字段基本一致 |
| GET /task/daily | 无直接对应 | DailyTaskConfig[] | TS 新增的每日任务接口，C# 未找到 |
| GET /task/other/simple | 无直接对应 | OtherTask[] | TS 新增的其他任务接口 |

**TaskInfo 字段差异**:
- `RewardGold` (TS) ↔ C# 无直接字段，应用 `GetMoney` 替代
- `RewardExp` (TS) ↔ C# 无直接字段
- `CostGold` (TS) ↔ `CostGold` (C#) ✓ 一致
- `CostFood` (TS) ↔ `CostFood` (C#) ✓ 一致
- `CostMoney` (TS) ↔ `CostMoney` (C#) ✓ 一致

---

## task-ext.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /task-ext/list | C#未找到 | TaskListResult | TS 新接口 |
| GET /task-ext/detail/:taskId | C#未找到 | TaskDetailResult | TS 新接口 |
| GET /task-ext/available | C#未找到 | AvailableTasksResult | TS 新接口 |
| POST /task-ext/accept | C#未找到 | AcceptTaskResult | TS 新接口 |
| POST /task-ext/abandon | C#未找到 | AbandonTaskResult | TS 新接口 |
| POST /task-ext/progress | C#未找到 | ProgressResult | TS 新接口 |
| POST /task-ext/complete | C#未找到 | CompleteTaskResult | TS 新接口 |
| POST /task-ext/complete-all | C#未找到 | CompleteAllResult | TS 新接口 |
| GET /task-ext/daily | C#未找到 | DailyTasksResult | TS 新接口 |
| POST /task-ext/daily/reset | C#未找到 | ResetDailyResult | TS 新接口 |
| GET /task-ext/achievements | C#未找到 | AchievementsResult | TS 新接口 |

**task-ext.ts 全部为 TS 新增接口，C# 原项目未找到对应实现**

---

## mail.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /mail/ | MailInfo[] | { mails, total, page } | TS 返回包装对象，C# 直接返回数组 |
| POST /mail/list | MailInfo[] | MailInfo[] | C# 返回数组，TS 经 formatMail 转换 |
| GET /mail/unread-count | C#未找到 | { unreadCount, totalCount } | TS 新增 |
| POST /mail/ | int (mailId) | { mailId, message } | C# 返回 int，TS 返回对象 |
| GET /mail/new-count | C#未找到 | { unreadCount, totalCount } | TS 新增 |
| GET /mail/count | C#未找到 | { total, unread } | TS 新增 |
| GET /mail/list | MailInfo[] | { mails, total, page } | 结构差异 |
| GET /mail/new | MailInfo[] | { mails, total, page } | 结构差异 |
| GET /mail/by-type | MailInfo[] | { mails, total, page, type } | 结构差异 |
| GET /mail/detail | MailInfo | MailInfo | 一致 ✓ |
| GET /mail/fight | C#未找到 | { ...MailInfo, battleData } | TS 新增战报解析 |
| POST /mail/delete | int | { deletedCount, message } | 返回格式差异 |
| POST /mail/send | int | { success, mailId, message } | 返回格式差异 |
| POST /mail/new | int | { success, mailId, message } | 返回格式差异 |
| POST /mail/claim | C#未找到 | { success, attachments, message } | TS 新增 |
| GET /mail/announcements | C#未找到 | { announcements, total } | TS 新增 |

**MailInfo 格式一致**: MailID, UserName, ReadTag, MailType, Title, MailFrom, Text, DateTime ✓

---

## mail-ext.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| POST /mail-ext/send | C#未找到 | SendMailResult | TS 新接口 |
| POST /mail-ext/claim/:mailId | C#未找到 | ClaimResult | TS 新接口 |
| POST /mail-ext/claim-all | C#未找到 | ClaimAllResult | TS 新接口 |
| DELETE /mail-ext/:mailId | C#未找到 | DeleteResult | TS 新接口 |

**mail-ext.ts 全部为 TS 新增接口，C# 原项目未找到对应实现**

---

## guild.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /guild/my | OrgInfo | { hasGuild, guild, role, contribution, joinedAt } | 结构差异 |
| GET /guild/list | DBOrganize[] | { id, name, level, memberCount, ... } | 字段名差异 (UID→id, OrgName→name) |
| POST /guild/create | int | { id, name, message } | 返回格式差异 |
| GET /guild/my-info | OrgInfo | { MyOrganize, MyMember, MyOrgEffectInfo, BossName } | 结构类似但字段映射不同 |
| GET /guild/:guildId | C#未找到 | { id, name, level, notice, ... } | TS 新增 |
| POST /guild/:guildId/join | C#未找到 | { guildId, guildName, message } | TS 新增 |
| POST /guild/leave | int | { message } | 返回格式差异 |
| POST /guild/:guildId/donate | C#未找到 | { resourceType, amount, contribution, message } | TS 新增 |
| POST /guild/apply | int | { guildId, guildName, message } | 返回格式差异 |
| POST /guild/quit | int | { message } | 返回格式差异 |
| POST /guild/disband | int | { message } | 返回格式差异 |
| GET /guild/member-count | int | { count } | C# 返回 int，TS 返回对象 |
| GET /guild/member-list | OrgMemberShipInfo[] | { members, total, page, pageSize } | 结构差异 |
| POST /guild/modify-intro | int | { message, intro } | 返回格式差异 |
| POST /guild/modify-affiche | int | { message, affiche } | 返回格式差异 |
| POST /guild/boss-func | C#未找到 | { message } | TS 新增 (审批/踢人) |
| POST /guild/promotion | C#未找到 | { message } | TS 新增 |
| POST /guild/demotion | C#未找到 | { message } | TS 新增 |
| POST /guild/abdication | C#未找到 | { message } | TS 新增 |

**DBOrganize vs TS Guild**:
| C# 字段 | TS 字段 | 差异 |
|---------|---------|------|
| UID | id | 命名风格 |
| OrgName | name | 命名风格 |
| Boss | leader_address | 字段名不同 |
| OrgLevel | level | 命名风格 |
| Membership | memberCount | 命名风格 |
| Affiche | notice | 字段名不同 |

---

## corps.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /corps/ | CorpsInfo[] | CorpsListResult | C# 返回数组，TS 返回包装对象 |
| POST /corps/ | int (corpsId) | { corpsId } | 返回格式差异 |
| GET /corps/state | C#未找到 | { inCorps, myCorps, corpsHeroes, state } | TS 新增 |
| POST /corps/event | C#未找到 | { success, actionType, newState, arriveTime, message } | TS 新增 |
| POST /corps/recall | C#未找到 | { success, message, returnTime } | TS 新增 |
| GET /corps/other | CorpsInfo[] | CorpsInfo[] (空则 CorpsID=-1) | TS 有空数据处理逻辑 |
| POST /corps/event-extend | C#未找到 | { success, actionType, extendData, message } | TS 新增 |
| GET /corps/simple-heroes | C#未找到 | { heroes } | TS 新增 |
| GET /corps/need-time | C#未找到 | { needTime, backTime, distance, speed } | TS 新增 |
| POST /corps/return | C#未找到 | { success, corpsId, returnTime, message } | TS 新增 |
| GET /corps/members | C#未找到 | MembersResult | TS 新增 |

**CorpsInfo 格式一致**: CorpsID, CorpsName, GarrisonID, State, SchlepMoney, SchlepFood, SchlepMen, CityID, UserName, TargetCity, ArriveTime, CityPos, Seconds, Insignia, IsVIP ✓

---

## organize-ext.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| POST /organize-ext/create | int | CreateOrganizeResult | C# 返回 int，TS 返回对象 |
| POST /organize-ext/apply | int | ApplyJoinResult | C# 返回 int，TS 返回对象 |
| POST /organize-ext/approve | int | ApproveResult | C# 返回 int，TS 返回对象 |
| POST /organize-ext/set-role | int | SetRoleResult | C# 返回 int，TS 返回对象 |
| POST /organize-ext/kick | int | KickResult | C# 返回 int，TS 返回对象 |
| POST /organize-ext/quit | int | QuitResult | C# 返回 int，TS 返回对象 |
| POST /organize-ext/disband | int | DisbandResult | C# 返回 int，TS 返回对象 |
| GET /organize-ext/my | OrgInfo | MyOrganizeResult | 结构差异 |
| GET /organize-ext/list | DBOrganize[] | OrganizeListResult | 结构差异 |
| GET /organize-ext/members | C#未找到 | MemberListResult | TS 新增 |
| POST /organize-ext/contribute | C#未找到 | ContributeResult | TS 新增 |
| GET /organize-ext/shop | C#未找到 | ShopListResult | TS 新增 |
| POST /organize-ext/shop/buy | C#未找到 | BuyResult | TS 新增 |
| POST /organize-ext/notice | int | NoticeResult | C# 返回 int，TS 返回对象 |

**organize-ext.ts 大部分接口 C# 有对应方法，但返回格式不同 (int vs object)**

---

## appendant-npc.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /appendant-npc/npc-list | C#未找到 | NPCListResult | TS 新接口 |
| GET /appendant-npc/my-npc | C#未找到 | MyNPCResult | TS 新接口 |
| POST /appendant-npc/occupy | C#未找到 | OccupyResult | TS 新接口 |
| POST /appendant-npc/abandon | C#未找到 | AbandonResult | TS 新接口 |
| GET /appendant-npc/benefits/:pos | C#未找到 | BenefitsResult | TS 新接口 |
| POST /appendant-npc/add | int | { id, cityId, npcId, message } | C# 返回 int，TS 返回对象 |
| GET /appendant-npc/list | AppendantNPCInfo[] | AppendantNPCInfo[] | 一致 ✓ |
| POST /appendant-npc/delete | int | { message, deletedCount } | 返回格式差异 |

**AppendantNPCInfo 格式**: UserName, NpcPos, State, BeginTime, EndTime, NpcName, NeedGold, NeedInsignia ✓

---

## chat.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /chat/list | ChatInfo[] | { channel, messages, total } | C# 返回数组，TS 返回包装对象 |
| GET /chat/conversations | C#未找到 | ConversationsResult | TS 新增 |
| GET /chat/ | ChatInfo[] | ChatInfo[] | 一致 ✓ |
| POST /chat/send | int | { message } | C# 返回 int，TS 返回对象 |

**ChatInfo 格式**:
| C# 字段 | TS 字段 | 差异 |
|---------|---------|------|
| TalkNum | ID | 字段名不同 |
| UserName | UserName | 一致 ✓ |
| LastTalkTime | created_at | 字段名不同 |
| FromJunta | fromJunta | 命名风格 |
| ToJunta | toJunta | 命名风格 |
| JuntaType | type | 字段名不同 |
| Words | content | 字段名不同 |

---

## admin.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| POST /admin/kick-user | C#未找到 | 空 (已禁用) | TS 路由已禁用 |

**admin.ts 无实际实现**

---

## effect.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /effect/persist-group | PersistEffectGroupInfo[] | { grouped } | C# 返回数组，TS 按 effect_type 分组 |
| GET /effect/over-array | C#未找到 | ExpiredEffect[] | TS 新增 |
| POST /effect/process-overdue | C#未找到 | { message, deletedCount } | TS 新增 |

**PersistEffectGroupInfo 格式**: EffectID, StaticIndex, MainEffectType, EffectType, State, Image, Gold, Seconds, PersistEffectArray, EndTime, StartTime, EffectName

---

## persist-effect-ext.ts API 差异

| API路径 | C#返回格式 | TS返回格式 | 差异说明 |
|---------|-----------|-----------|---------|
| GET /persist-effect-ext/list | C#未找到 | AllEffectsResult | TS 新接口 |
| GET /persist-effect-ext/hero/:heroId | C#未找到 | HeroEffectsResult | TS 新接口 |
| GET /persist-effect-ext/calculate | C#未找到 | TotalEffectsResult | TS 新接口 |
| GET /persist-effect-ext/combat-bonus | C#未找到 | CombatBonusResult | TS 新接口 |
| POST /persist-effect-ext/apply | C#未找到 | ApplyEffectResult | TS 新接口 |
| POST /persist-effect-ext/remove | C#未找到 | RemoveEffectResult | TS 新接口 |
| POST /persist-effect-ext/clear | C#未找到 | ClearEffectsResult | TS 新接口 |

**persist-effect-ext.ts 全部为 TS 新增接口，C# 原项目未找到对应实现**

---

## 总结

### 完全一致的接口 (字段级)
- **MailInfo**: MailID, UserName, ReadTag, MailType, Title, MailFrom, Text, DateTime
- **CorpsInfo**: CorpsID, CorpsName, GarrisonID, State, SchlepMoney, SchlepFood, SchlepMen, CityID, UserName, TargetCity, ArriveTime, CityPos, Seconds, Insignia, IsVIP
- **AppendantNPCInfo**: UserName, NpcPos, State, BeginTime, EndTime, NpcName, NeedGold, NeedInsignia

### 命名风格差异
- C# 使用 PascalCase (如 `OrgName`, `UserName`)
- TS 使用 camelCase (如 `orgName`, `userName`)
- 某些字段名不同需映射

### 主要差异类型
1. **返回格式**: C# 常返回 int 表示状态码，TS 返回 `{ success, data, message }` 对象
2. **包装结构**: C# 直接返回数组，TS 包装为 `{ data, total, page }` 对象
3. **新增接口**: task-ext.ts, mail-ext.ts, persist-effect-ext.ts 大量新接口
4. **字段映射**: 部分字段需要名称映射 (如 RewardGold→GetMoney)
