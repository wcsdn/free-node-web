# 用户注册与初始化流程

## 概述

新用户首次访问游戏时，系统自动创建完整游戏角色和所有相关数据。对齐 C# 原项目 `UserAccess.RegisterUser()` + `Task.CreateInitializeTask()` 逻辑。

## 触发时机

前端访问 `/api/game/user-info` 时，后端检测到钱包地址未注册，自动触发 `initializeNewUser()`。

## 完整初始化流程

### 1. characters（角色表）

```typescript
INSERT INTO characters (wallet_address, name, level, gold)
VALUES (?, '玩家_后6位地址', 1, 10000)
```

**对齐 C#**: `UserInfo` 表，初始 gold=10000

---

### 2. cities（城市表）

```typescript
// 查找未被占用的 position（从 1000 开始）
const newPosition = MAX(position >= 1000) + 1

INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population, money_rate, food_rate, population_rate)
VALUES (?, '主城', newPosition, 100, 10000, 10000, 500, 100, 100, 50)
```

**对齐 C#**: `City` + `Resource` 表合并
- prosperity=100（繁荣度）
- money=10000, food=10000（钱/粮）
- population=500（人口）
- rate 为产量/小时

---

### 3. buildings（建筑表）

```typescript
// 聚义厅（位置10, config_id=1）
INSERT INTO buildings (wallet_address, city_id, type, level, position, state, config_id)
VALUES (?, cityId, 'interior', 1, 10, 0, 1)

// 义舍（位置14, config_id=2）
INSERT INTO buildings (wallet_address, city_id, type, level, position, state, config_id)
VALUES (?, cityId, 'interior', 1, 14, 0, 2)
```

**对齐 C#**: `CityBuilding` 表，初始 2 个建筑

---

### 4. tasks（主线任务进度表）

```typescript
// 获取第一章第一小节第一个任务ID
const firstTaskId = taskConfigs['1_1']?.Task?.[0] || 1  // = 1

// task_ids: [firstTaskId, 0, 0, 0, 0, 0, 0, 0, 0, 0]
INSERT INTO tasks (wallet_address, main_id, main_index, task_ids, task_states, task_progress)
VALUES (?, 1, 1, '[1,0,0,0,0,0,0,0,0,0]', '[0,0,0,0,0,0,0,0,0,0]', '[0,0,0,0,0,0,0,0,0,0]')
```

**对齐 C#**: `MainTask` 表 + `Task.CreateInitializeTask()`
- `MainID=1`, `MainIndex=1`（第一章第一小节）
- `Task[0]=1`（初出茅庐），`Task[1..9]=0`（未激活）
- `task_states` 全部为 0（未完成）

---

### 5. technics（科技表）

```typescript
// 聚义厅对应科技：technics.json 中 DependBuildingID=1 的第一条
INSERT INTO technics (user_name, city_id, static_index, technic_level, state, build_id)
VALUES (?, cityId, 1, 1, 0, 1)
```

**对齐 C#**: `Technology` 表
- 聚义厅(config_id=1, StaticIndex=1) 对应 `DependBuildingID=1` 的科技
- 初始 `technic_level=1`, `state=0`

---

### 6. user_resources（用户资源表）

```typescript
INSERT INTO user_resources (wallet_address, prestige, prestige_level, fame, fame_level, pearl, crystal, agate, w_bowlder, b_bowlder, crusade, jade_book)
VALUES (?, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0)
```

**对齐 C#**: `UserOrganizeRes` 表
- prestige/fame 初始 0，等级 1
- 玉石类资源全部 0

---

### 7. missions（战役任务表）

```typescript
INSERT INTO missions (wallet_address, condition_user, mission_state, mission_type, target_pos, target_value, group_index, condition_index, gain_index, start_date, create_date)
VALUES (?, '', 1, 1, 0, 0, '1.1.1', '1.1.1', '1.1.1', now, now)
```

**对齐 C#**: `Mission.CreateDBMission("1.1.1")`
- `group_index='1.1.1'`（第一章第一节任务）
- `mission_state=1`（进行中）
- `condition_index/gain_index` 从 `missions_by_level.json` 的 `Condition1/Gain1` 读取

---

## 数据结构对照

| C# 类/表 | Workers 表 | 关键字段 |
|-----------|-----------|---------|
| UserInfo | characters | wallet_address, name, level, gold |
| City + Resource | cities | position, prosperity, money, food, population |
| CityBuilding | buildings | position, level, config_id |
| MainTask | tasks | main_id, main_index, task_ids[], task_states[] |
| Technology | technics | static_index, technic_level, build_id |
| UserOrganizeRes | user_resources | prestige, fame, pearl, crystal... |
| Mission | missions | group_index, condition_index, mission_state |

## 任务配置来源

主线任务配置从 `src/config/tasks.json`（95个任务）读取，不走数据库。

索引结构：
```typescript
taskConfigs['1_1']  // MainID=1, MainIndex=1 的章节
taskConfigs['1_1'].Task  // 该章节所有任务ID数组
taskConfigs['1_1'].Task[0]  // 第一个任务ID = 1
```

## 测试

```bash
# 使用全新钱包触发注册流程
curl -s "http://localhost:8788/api/game/user-info" \
  -H "X-Wallet-Auth: 0x全新地址:test_signature"

# 验证数据库初始化
sqlite3 .wrangler/state/v3/d1/*/miniflare-D1DatabaseObject/*.sqlite \
  "SELECT wallet_address, task_ids FROM tasks WHERE wallet_address='新地址'"
# 期望: [1,0,0,0,0,0,0,0,0,0]
```
