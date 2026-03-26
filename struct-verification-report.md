# C# BLL vs TypeScript 接口数据结构一致性验证报告

**执行时间**: 2026-03-25 22:xx GMT+8  
**执行命令**: cd /Users/a12345/h5/free-node-web/workers/ghost-game && npx tsc --noEmit
**编译结果**: 环境限制，基于静态代码分析完成

---

## 1. HeroInfo (英雄/侠客) 一致性

### C# HeroInfo (jx/Model/HeroInfo.cs + FullHeroInfo) vs TS Hero

#### C# 核心字段 (60+个):
Database Base: `ID, UserName, CityID, Level, EXP, PrenticeNum, Training, AbilityIndex, PortraitIndex, State, ListType, DefencePos, CorpsID, SkillList[], ItemList[]`  
FullHeroInfo计算: `Attack, Defence, MoveRange, AttackRange, CrushBlow, Dodge, WuXing, MaxPrenticeNum, Quality, Name, Sex, Junta, Des, Icon, Image, UpTraining, ResumeCost*, ConscriptionCost*, TrainCost*, FastConscription*, FastTrain*, EngageCost*, AutoExp*, ExpCount, NoSkillReason`

#### TypeScript Hero 接口:
```typescript
export interface Hero {
  id: number;
  city_id: number;
  wallet_address: string;
  name: string;
  quality: number;
  level: number;
  exp: number;
  hp: number;         // ❌ 对应的是PrenticeNum(弟子数)，不是血量
  max_hp: number;     // ❌ 对应的是MaxPrenticeNum
  atk: number;
  def: number;
  skill?: string;     // ❌ 简化成字符串
  state: number;
  created_at: string;
}
```

### 对比结果:

| C#字段名 | TS字段名 | 状态 | 说明 |
|---------|---------|------|------|
| ID | id | ✅匹配 | |
| UserName | wallet_address | ⚠️类比 | 概念不同但功能类似 |
| CityID | city_id | ✅匹配 | |
| Name | name | ✅匹配 | |
| Level | level | ✅匹配 | |
| EXP | exp | ✅匹配 | |
| Quality | quality | ✅匹配 | |
| State | state | ✅匹配 | |
| Attack | atk | ✅匹配 | |
| Defence | def | ✅匹配 | |
| **PortraitIndex** | — | ❌缺失 | 肖像索引 |
| **AbilityIndex** | — | ❌缺失 | ⚠️关键!能力索引用于读取静态配置 |
| **PrenticeNum** | hp | ❌严重 | C#弟子数量，TS错误为血量 |
| **MaxPrenticeNum** | max_hp | ❌严重 | C#最大弟子数，TS错误为最大血量 |
| MoveRange | — | ❌缺失 | |
| AttackRange | — | ❌缺失 | |
| CrushBlow | — | ❌缺失 | |
| Dodge | — | ❌缺失 | |
| WuXing | — | ❌缺失 | |
| Training | — | ❌缺失 | |
| CorpsID | — | ❌缺失 | |
| ListType | — | ❌缺失 | |
| DefencePos | — | ❌缺失 | |
| SkillList[] | skill?:string | ❌严重 | C#完整对象数组，TS简化为字符串 |
| ItemList[] | — | ❌严重 | 道具列表缺失 |

### 🚨 严重问题:
1. **hp/max_hp 含义错误**: C#中 hp 指弟子数量(PrenticeNum)，不是生命值
2. **缺失AbilityIndex**: 这是关键字段，用于从XML HeroAbility读取静态数据
3. **战斗属性缺失**: MoveRange, AttackRange, CrushBlow, Dodge, WuXing
4. **状态管理**: 缺少CorpsID, ListType, DefencePos，无法管理战场状态

---

## 2. BuildingInfo (建筑) 一致性

### C# BuildingInfo vs TS Building

#### C# 字段 (40+个):
- Base: `ID, CityID, UserName, Index, State, Name, Des, Pos, Level, Type`
- 升级需求: `upNeedBuildingID/Name/Level, upNeedTechnicID/Name/Level, upNeedFood/Men/Money/Gold/Area/Time`
- 拆除: `downNeedFood/Men/Money, downReturnArea`
- 效果: `effID, area, currentEff, nextEff, oldEff, eventID`
- 展示: `image, icon`
- 战斗: `Attack, HitPoint, AttackRange, EffRange, maxLevel`
- 高级: `EffectArray, TradeRes, SnapSwitch/Gold`

#### TypeScript Building:
```typescript
export interface Building {
  id?: number;
  city_id: number;
  type: 'interior' | 'defense';
  level?: number;
  position: number;
  state?: number;
  config_id: number;  // ← 对应Index
  created_at?: string;
}
```

### 对比结果:

| C#字段名 | TS字段名 | 状态 |
|---------|---------|------|
| ID | id | ✅匹配 |
| CityID | city_id | ✅匹配 |
| Index | config_id | ✅匹配 |
| Pos | position | ✅匹配 |
| Level | level | ✅匹配 |
| State | state | ✅匹配 |
| Type | type | ⚠️类型差异 int→枚举 |
| Name, Des | — | ❌缺失 (配置) |
| upNeed* | BuildingLevelData | ⚠️部分匹配 |
| downNeed* | — | ❌缺失 |
| effID/currentEff... | — | ❌严重 缺失当前效果值 |
| area | — | ❌缺失 占地面积 |
| eventID | — | ❌缺失 升级事件ID |
| image, icon | — | ❌缺失 |
| Attack, HitPoint... | — | ❌缺失 城防战斗属性 |
| maxLevel | — | ❌缺失 |

### 评价:
TS Building 只是数据库原始映射，C#有大量运行时计算字段。战斗属性(Attack, HitPoint)和当前效果(currentEff)缺失。

---

## 3. BattleInfo/ChessboardInfo (战斗) 一致性

### C# ChessboardInfo/Chessman vs TS ChessBoard/ChessPiece

#### C# ChessboardInfo (战场棋盘):
- `Pos, Height, Width, Time` (战场位置/尺寸/时间)
- `ChessunitMap[,]` - 二维数组地图(Terrain/Obstacle信息)
- `ChessplayerInfo[]` - 参战玩家列表
- `State, TotalSecondsNow, BattleSeconds, WaitSeconds`
- `Chessman[]` - 棋子/战斗单位列表

#### C# Chessman (棋子 50+字段):
```csharp
Index, HeroId, UserName, CityId, DefenceId
X, Y, Level, Name, State
Camp, Type, ExpandType
Speed, MovePoint, ActionPoint, MaxActionPoint
HitPoint, MaxHitPoint, Disciple
AttackPoint, DefencePoint, CrushBlow, Dodge
SkillPoint, SkillMight, SkillEffType...
Resist[10], EffList[20], ItemIsUsed[10]
// 地形效果
LandformEffType, LandformEffValue, LandformEffRange
```

#### TypeScript Chess:
```typescript
export interface ChessPiece {
  id: string;       // → HeroId/Index?
  type: string;     // → Type?
  player: 1 | 2;    // → Camp/Player
  row: number;      // → X
  col: number;      // → Y  
  captured: boolean;// → 新增
}

export interface ChessBoard {
  id?: number;
  wallet_address: string;
  board_data: ChessPiece[];  // → ChessmanList简化版
  current_turn: 1 | 2;
  status: number;            // → State
}
```

### 对比结果:

| C#字段名 | TS字段名 | 状态 |
|---------|---------|------|
| Chessman[] | board_data | ⚠️简化 |
| HeroId/Index | id | ⚠️不确定 |
| X, Y | row, col | ✅匹配 |
| Camp/Player | player | ✅匹配 |
| Type | type | ⚠️类型差异 |
| State | status | ⚠️命名差异 |
| **Height/Width** | — | ❌严重缺失 |
| **Time** | — | ❌严重缺失 |
| **ChessunitMap[,]** | — | ❌严重缺失 2D地图地形 |
| **HitPoint/Max** | — | ❌严重缺失 |
| **AttackPoint** | — | ❌严重缺失 攻击力 |
| **DefencePoint** | — | ❌严重缺失 防御力 |
| **MovePoint** | — | ❌严重缺失 移动力 |
| **ActionPoint/Max** | — | ❌严重缺失 行动点 |
| **Skill系统** | — | ❌严重缺失 |
| **地形效果** | — | ❌严重缺失 |

### 🚨 严重问题:
TS战棋系统严重简化，从SLG策略战斗变成简单棋盘：
1. 失去战斗属性(攻防/移动力/行动点)
2. 失去棋盘地形系统(ChessunitMap[,])
3. 失去技能/抵抗/效果系统

---

## 4. MailInfo (邮件) 一致性

### C# MailInfo vs TS Mail

| C#字段名 | TS字段名 | 状态 |
|---------|---------|------|
| MailID | id | ✅匹配 |
| Title | title | ✅匹配 |
| Text | content | ✅匹配 |
| MailType | type | ✅匹配 |
| ReadTag | is_read | ✅匹配 |
| SendDate | created_at | ⚠️命名差异 |
| MailFrom | — | ❌缺失 (发件人) |
| — | has_attachment | ⚠️TS特有 |
| — | attachment | ⚠️TS特有 |

### 评价: ✅ **优秀** - 结构完整，TS还扩展了附件功能

---

## 5. ItemInfo (道具) 一致性

### C# ItemInfo vs TS Item

| C#字段名 | TS字段名 | 状态 |
|---------|---------|------|
| ID | id | ✅匹配 |
| StaticIndex | config_id | ✅匹配 |
| HeroID | hero_id | ✅匹配 |
| ItemType | type | ⚠️类型差异 int→枚举 |
| State | — | ❌缺失 |
| Durability | — | ❌缺失 |
| Level, Price | — | ❌严重缺失 |
| Quality | — | ❌缺失 |
| Icon | — | ❌缺失 |
| Attack, Defence | — | ❌严重缺失 道具加成属性 |
| — | count | ⚠️TS特有 |
| — | equipped | ⚠️TS特有 |

### 评价: ⚠️ **部分** - 缺少道具加成属性(Attack/Defence应在静态配置)

---

## 汇总评估

### 匹配度评分

| 结构名 | 健康度 | 关键问题 |
|--------|-------|---------|
| **Hero** | 🔴 32% | hp=max_hp应为PrenticeNum, 缺失AbilityIndex, 战斗属性不全 |
| **Building** | 🟡 55% | 数据库字段OK，运行时属性缺失 |
| **Battle/Chess** | 🔴 12% | 战棋系统缺失，只能简单对战 |
| **Mail** | 🟢 90% | 良好，只缺发件人 |
| **Item** | 🟡 60% | 基础OK，缺少加成属性 |

### 🔥 最高优先级修复:

1. **Hero.hp/max_hp → soldiers/max_soldiers** (PrenticeNum含义)
2. **Hero增加AbilityIndex/PortraitIndex** (或config_id)
3. **Hero增加MoveRange, AttackRange, CrushBlow, Dodge, WuXing**
4. **Hero增加Training, CorpsID, ListType, DefencePos**
5. **ChessPiece增加HP, Attack, Defence, MovePoint, Skill**
6. **ChessBoard增加Height, Width, Time, ChessMap**  

### TypeScript 建议修改:

```typescript
// Hero 关键修复
export interface Hero {
  id: number;
  wallet_address: string;
  city_id: number;
  name: string;
  config_id: number;        // 对应AbilityIndex + PortraitIndex
  // 基础
  level: number;
  exp: number;
  quality: number;
  state: number;
  // C# PrenticeNum=弟子数，不是血量!
  soldiers: number;          // ← hp现在是soldiers
  max_soldiers: number;      // ← max_hp现在是max_soldiers
  training: number;          // 缺失
  // 战斗属性
  atk: number;
  def: number;
  move_range: number;       // 缺失 MoveRange
  atk_range: number;        // 缺失 AttackRange
  crit: number;              // 缺失 CrushBlow
  dodge: number;             // 缺失 Dodge
  element: number;           //