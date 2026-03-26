# API 差异报告 - C# BLL vs Workers TS

**生成时间**: 2026-03-24
**统计范围**: 30个路由文件，219个 API
**原则**: C# BLL 为数据格式真相来源，前端代码未修改

---

## 📊 汇总统计

| 路由文件 | API数 | 一致 | 格式不同 | C#不存在(TS新增) |
|---------|------|------|---------|----------------|
| game.ts | 27 | 3 | 18 | 6 |
| user-ext.ts | 4 | 0 | 0 | 4 |
| city-ext.ts | 13 | 0 | 0 | 13 |
| tech.ts | 9 | 1 | 4 | 4 |
| item-ext.ts | 14 | 0 | 0 | 14 |
| hero.ts | 26 | 4 | 16 | 6 |
| hero-ext.ts | 19 | 0 | 0 | 19 |
| item.ts | 12 | 2 | 6 | 4 |
| shop.ts | ~8 | - | 部分 | 部分 |
| building.ts | 10 | 0 | 6 | 4 |
| defense.ts | 7 | 2 | 4 | 1 |
| map.ts | 16 | 0 | 5 | 11 |
| market.ts | 15 | 1 | 5 | 9 |
| battle.ts | 15 | 2 | 5 | 8 |
| warfare.ts | 11 | 0 | 6 | 5 |
| arena.ts | 4 | 0 | 2 | 2 |
| rank.ts | 10 | 0 | 1 | 9 |
| event.ts | 15 | 1 | 3 | 11 |
| event-ext.ts | 9 | 0 | 0 | 9 |
| task.ts | 4 | 2 | 2 | 0 |
| task-ext.ts | 11 | 0 | 0 | 11 |
| mail.ts | 5 | 3 | 0 | 2 |
| mail-ext.ts | 4 | 0 | 0 | 4 |
| guild.ts | ~8 | 部分 | 部分 | 部分 |
| corps.ts | 部分 | 部分 | 部分 | 部分 |
| 其他(ext) | 多 | 0 | 0 | 全部 |

---

## 🔴 高优先级差异（前端调用频繁，容易报错）

### 1. 包装层不一致（最常见问题）

**模式**: C# 直接返回业务对象，TS 用 `{success:true, data:...}` 包装

```
C#:  GetCityHero() → HeroInfo[]  (裸数组)
TS:  GET /hero/list → {success:true, data:{heroes:[], total, page, pageSize}}

前端期望: result.value = [...] (数组)
实际收到: result.value = {heroes:[], total, page, pageSize} (对象)
```

**受影响API**:
- `GET /hero/list` → C#返回数组，TS返回 `{heroes[], total}`
- `GET /item/list` → C#返回数组，TS返回 `{items[], total}`
- `GET /tech/list` → C#返回数组，TS返回 `{techs[], total}`
- `GET /market/list` → C#返回数组，TS返回分页对象
- `POST /task/list` → C#返回数组，TS返回 `{tasks[]}` (已修复)

### 2. C#返回int状态码，TS返回消息对象

**模式**: C# 的 `int` 返回值（0=成功，其他=错误码）在 TS 中被扩展为 `{message: string}`

```
C#:  EngageHero() → int (0=成功，其他=错误码)
TS:  POST /hero/engage → {message: '武将已雇佣'}

前端期望: result.value = 0 (数字)
实际收到: result.value = {message: '...'} (对象)
```

**受影响API**:
- `POST /hero/engage` → `{message}`
- `POST /hero/fire` → `{message}`
- `POST /hero/name` → `{message}`
- `POST /hero/event` → `{message}`
- `POST /hero/event-ex` → `{message}`
- `POST /hero/fire-can-engage` → `{message}`
- `POST /hero/fast-health` → `{message}`
- `POST /hero/set-defence` → `{message}`
- `POST /hero/unequip` → `{message}`
- `POST /hero/exp-to-item` → `{message}`
- `POST /market/cancel` → TS返回对象 vs C#返回int
- `POST /warfare/cancel` → 同上
- `POST /warfare/select` → 同上

### 3. 空数据约定不一致

```
C#:  无数据时返回 [{ID:-1}]  (单元素数组)
TS:  部分接口返回 [{ID:-1}]，部分返回 []

受影响API:
- GET /hero/list → 空时 C# [{ID:-1}]，TS {heroes:[]} 或 []
- GET /item/ → 空时 C# [{ID:-1}]，TS [{ID:-1}]
- GET /task → 空时 C# [{ID:-1}]，TS [] (已修复)
- GET /event/valid → 空时 C# [{ID:-1}]，TS [{ID:-1}] ✅ 一致
```

### 4. 字段命名风格差异

```
C#:  PascalCase (UserName, CityName, HeroLevel, MaxHP)
TS:  camelCase (walletAddress, userName, heroLevel, maxHp)

部分TS同时返回双版本: {id, ID, cityId, CityID} (如heroService.getDetail)
```

**受影响字段**:
- `UserName` (C#) ↔ `walletAddress` / `userName` (TS)
- `HeroLevel` (C#) ↔ `level` (TS)
- `MaxHP` (C#) ↔ `maxHp` / `MaxHitPoint` (TS)
- `CurHP` (C#) ↔ `hp` / `HitPoint` (TS)
- `CityName` (C#) ↔ `cityName` (TS)
- `Organise` (C#) ↔ `organizeId` (TS)

---

## 🟡 中优先级差异

### 5. 语义不一致（返回值含义不同）

| API | C#返回 | TS返回 | 差异 |
|-----|--------|--------|------|
| `GET /game/player-count` | `int` (页数=总数/20+1) | `{playerCount}` (人数) | **语义完全不同** |
| `GET /game/ins-player-count` | `int` (页数) | `{onlineCount}` (在线人数) | 语义不同 |
| `GET /game/territory-player-count` | `int` (页数) | `{territoryPlayerCount}` (领地玩家数) | 语义不同 |
| `GET /game/accountant` | `int` (收益倍数) | `{moneyIncome,foodIncome,...}` (详细收益) | 类型完全不同 |
| `GET /hero/count` | `int` (页数) | `{count}` (武将总数) | 语义不同 |
| `GET /hero/user-heroes` | `ArenaWinnerInfo[]` (竞技场数据) | `HeroInfo[]` (武将列表) | 返回类型完全不同 |
| `GET /rank/chess` | `UserRank[]` (含MySelf标记) | `{ranks[], myRank}` | 缺少MySelf字段 |

### 6. C#返回int，TS返回详情对象

```
C#:  GetExpPer(cityID) → int (百分比)
TS:  GET /hero/exp-percent → {heroId, level, exp, nextLevelExp, percent}

C#:  GetAutoExpPercent() → int (百分比)
TS:  GET /hero/auto-exp-percent → {percent, heroCount}

C#:  IsDependency(pos) → int (0/1)
TS:  GET /game/is-dependency → {position, hasDependency: bool}

C#:  IsStartTime(pos) → int (0/1)
TS:  GET /game/is-start-time → {position, isStartTime: bool, state}

C#:  GetNameState(name) → int (0=可用, 1=已占用, -100=超时)
TS:  GET /game/user/name-state → {username, available: bool, message}

C#:  GetWorldPosState(pos) → int (状态码)
TS:  GET /map/world/pos-state → {pos, type, owner, ...} (完整详情)
```

### 7. 路由参数名不一致

```
hero.ts:
  C#: GetCanEenageHero(cityID, union) — union 参数
  TS: POST /hero/can-engage — building_type 参数

hero.ts:
  C#: GetCanUseHero(cityID, level, sex, junta)
  TS: POST /hero/can-use — union 参数 vs C# junta 参数

market.ts:
  C#: CancleSellItem(cityID, listingID) — cityID 参数
  TS: POST /market/cancel — listing_id 参数，无 cityID
```

---

## 🟢 低优先级/新增功能差异

### 8. TS 新增接口（C# 不存在）

这些接口是 Workers 扩展，前端可能没用到，用到才处理：

| 路由 | 新增API |
|------|--------|
| user-ext.ts | 签到/VIP/用户统计系统（全部新增） |
| city-ext.ts | 繁荣度/税收/建筑队列系统（全部新增） |
| item-ext.ts | 合成/强化/镶嵌/耐久/分解系统（全部新增） |
| hero-ext.ts | 命格/觉醒/突破/适应/伤势/技能系统（全部新增） |
| task-ext.ts | 11个扩展任务接口（全部新增） |
| mail-ext.ts | 4个邮件扩展接口（全部新增） |
| persist-effect-ext.ts | 7个持续效果接口（全部新增） |
| rank.ts | 排行榜扩展（9/10新增） |
| map.ts | 探索/移动/区域接口（11/16新增） |
| event-ext.ts | 事件扩展（9/9全部新增） |
| warfare.ts | 匹配/战斗结果接口（5/11新增） |
| battle.ts | 8/15接口新增 |

### 9. 字段缺失（TS 返回缺少 C# 字段）

```
item.ts:
  C# ItemInfo 有: GetMoney, GetFood, GetMen, GetGold, GetValue, Quality,
                  UserSkillType, RepairItemNeedFood, RepairItemNeedMoney,
                  DisassembleName, Cutu, HeroPortrait
  TS: 缺少上述字段

tech.ts:
  C# TechnicInfo 有: NextEff (下一级效果值)
  TS: 缺少 NextEff 字段

  C# TechnicInfo 有: UpNeedBuildingName
  TS: 未映射

battle.ts:
  C# Chessevent: ID, ObjX, ObjY, ObjAction, EffValue, ExpandEffValue, Player, ObjID, TargetID
  TS: {battleLog, animations, lastAction, currentRound} — 结构完全不同

warfare.ts:
  C#: userBattle 返回 "state_type_atleticsType" (下划线分隔字符串)
  TS: {battleState, battleType, AthleticsType, ...} (结构化对象)
  
  C#: detail 返回 "RoomName__________RoomShow__________id" (双下划线分隔)
  TS: {ID, RoomName, RoomShow} (对象)
```

### 10. GET /hero/detail 双重字段问题

```
TS heroService.getDetail 返回:
  {id, ID, cityId, CityID, walletAddress, UserName, cityName, name, Name, ...}
  同时包含小写和大写版本字段

C# GetHeroByID 返回:
  {ID, Name, Level, ...}  (仅 PascalCase)
```

---

## ✅ 已验证一致的接口

| API | 说明 |
|-----|------|
| `GET /event/valid` | C#和TS返回完全一致，`[{ID:-1}]` 空格式一致 |
| `GET /defense/landform` | 字段名一致 (Pos/Type/Index/Image) |
| `POST /market/sell` | C#返回int(0成功)，TS直接 `c.json(0)`，行为一致 |
| `GET /game/page-info` | 双方都返回字符串 "CityNum_PageNum" |
| `POST /game/page-info` | 同上 |
| `GET /game/user-info` | 基本一致，TS多出 `Gold` 字段 |
| `GET /game/city-interior-info` | 基本一致 |
| `GET /defense/npc-corps` | C#和TS字段一致 |

---

## 📋 修复优先级建议

### P0 - 立即修复（前端频繁调用）
1. `GET /hero/list` — 返回 `{heroes[], total}` 改为直接返回数组
2. `GET /item/list` — 同上
3. `GET /tech/list` — 同上
4. `POST /market/list` (POST /market/cancel) — int vs 对象
5. `POST /hero/*` 系列 — int vs `{message}` 对象

### P1 - 下一批
6. `GET /game/player-count` — 语义修正（页数vs人数）
7. `GET /hero/count` — 语义修正
8. `GET /rank/chess` — 补充 MySelf 字段
9. 字段缺失补齐（item.ts, tech.ts）

### P2 - 可选优化
10. hero-ext.ts / item-ext.ts 等新增接口的前端适配
11. warfare.ts 字符串格式 → 对象格式
