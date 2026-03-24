# Ghost Game 项目架构文档

## 项目概述

Ghost Game 是一个基于 Web3 的策略游戏，从 C# ASP.NET 迁移到 Cloudflare Workers + Vite 架构。

## 技术栈

### 后端
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Framework**: Hono.js (轻量级 Web 框架)
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript

### 前端
- **Framework**: 原生 JavaScript + jQuery
- **Build Tool**: Vite
- **UI**: 传统 Web 游戏界面 (iframe 架构)

## 项目结构

```
free-node-web/
├── workers/ghost-game/          # 后端 Worker
│   ├── src/
│   │   ├── routes/              # API 路由
│   │   ├── services/            # 业务逻辑层
│   │   ├── utils/               # 工具函数
│   │   └── config/              # 配置文件 (JSON)
│   ├── migrations/              # 数据库迁移脚本
│   └── wrangler.toml            # Worker 配置
├── public/jx-web/               # 前端游戏界面
│   ├── Js/                      # JavaScript 文件
│   ├── img/                     # 游戏图片资源
│   └── *.html                   # 游戏页面
└── vite.config.mjs              # Vite 配置
```


## 认证流程

### 1. 钱包认证机制

游戏使用 Web3 钱包地址作为用户唯一标识，不需要传统的用户名/密码。

#### 认证流程图
```
用户 → 连接钱包 → 签名消息 → 后端验证 → 返回 Token → 后续请求携带 Token
```

#### 开发模式认证
```javascript
// public/jx-web/Js/api-adapter-v2.js
const DEV_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
window.authHeader = DEV_WALLET + ':test_signature';
```

#### 生产模式认证
```javascript
// 前端发送请求时添加 header
headers: {
  'X-Wallet-Auth': '钱包地址:签名'
}
```

### 2. 后端认证验证

```typescript
// workers/ghost-game/src/utils/auth.ts
export async function verifyWalletAuth(c: any): Promise<string | null> {
  const auth = extractAuthHeader(c);
  if (!auth) return null;
  
  const { address, signature } = auth;
  
  // 验证地址格式
  if (!isValidAddress(address)) return null;
  
  // 开发模式：接受 test_signature
  if (signature === 'test_signature') {
    console.log('[Auth] Dev mode: accepting test signature');
    return address.toLowerCase();
  }
  
  // 生产模式：验证 EIP-191 签名
  const isValid = await verifySignature(message, signature, address);
  return isValid ? address.toLowerCase() : null;
}
```


## 用户注册与初始化

### 自动注册流程

新用户首次访问时自动创建账号，无需手动注册。

#### 触发时机
```typescript
// GET /api/game/user-info
// POST /api/game/user-info

// 检查用户是否存在
let character = await db.prepare(`
  SELECT * FROM characters WHERE wallet_address = ?
`).bind(walletAddress).first();

// 如果不存在，自动初始化
if (!character) {
  await initializeNewUser(db, walletAddress);
  character = await db.prepare(`
    SELECT * FROM characters WHERE wallet_address = ?
  `).bind(walletAddress).first();
}
```

#### 初始化内容

**1. 创建角色 (characters 表)**
- wallet_address: 钱包地址 (主键)
- name: '玩家' (默认名称)
- level: 1
- gold: 10000 (初始元宝)

**2. 创建主城 (cities 表)**
- position: 动态分配 (从 1000 开始)
- name: '主城'
- money: 10000 (铜钱)
- food: 10000 (粮食)
- population: 500 (人口)

**3. 创建初始建筑 (buildings 表)**
- 聚义厅: position=10, config_id=1
- 义舍: position=14, config_id=2

**4. 初始化任务进度 (tasks 表)**
- MainID=1, MainIndex=1, Task[0]=firstTaskId (初出茅庐), Task[1..9]=0

**5. 初始化科技 (technics 表)**
- StaticIndex=1 (聚义厅对应), Level=1

**6. 初始化用户资源 (user_resources 表)**
- prestige=0, fame=0, 玉石类全0

**7. 初始化战役任务 (missions 表)**
- group_index='1.1.1' (第一章第一节), state=1

> ⚠️ 完整注册流程见 [用户注册流程文档](./USER_REGISTRATION_FLOW.md)


### 初始化代码实现

```typescript
// workers/ghost-game/src/routes/game.ts
async function initializeNewUser(db: any, walletAddress: string) {
  // 1. 创建角色
  await db.prepare(`
    INSERT INTO characters (wallet_address, name, level, gold)
    VALUES (?, ?, ?, ?)
  `).bind(walletAddress, '玩家', 1, 10000).run();

  // 2. 动态分配城市 position (避免冲突)
  const maxPositionResult = await db.prepare(`
    SELECT MAX(position) as max_pos FROM cities WHERE position >= 1000
  `).first();
  const newPosition = (maxPositionResult?.max_pos || 999) + 1;

  // 3. 创建主城
  await db.prepare(`
    INSERT INTO cities (wallet_address, name, position, prosperity, 
                        money, food, population, money_rate, food_rate, 
                        population_rate, map_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(walletAddress, '主城', newPosition, 100, 10000, 10000, 
          500, 100, 100, 50, 'm1.JPG').run();

  // 4. 获取城市 ID
  const cityResult = await db.prepare(`
    SELECT id FROM cities WHERE wallet_address = ? 
    ORDER BY id DESC LIMIT 1
  `).bind(walletAddress).first();

  // 5. 创建初始建筑
  if (cityResult) {
    await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(cityResult.id, 'interior', 1, 10, 0, 1).run();

    await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(cityResult.id, 'interior', 1, 14, 0, 2).run();
  }
}
```


## API 架构

### 请求/响应格式

#### 后端返回格式
```json
{
  "success": true,
  "data": { ... }
}
```

#### 前端适配器转换
```javascript
// api-adapter-v2.js 自动转换为前端期望的格式
{
  "value": { ... }
}
```

### API 路由结构

```
/api/game/          # 游戏主接口
  - GET  /user-info           # 获取用户信息 (自动注册)
  - POST /user-info           # 获取用户信息 (自动注册)
  - GET  /page-info           # 获取页面状态
  - GET  /status              # 服务器状态

/api/building/      # 建筑系统
  - GET  /by-pos              # 根据位置获取建筑
  - POST /upgrade             # 升级建筑
  - POST /create              # 建造建筑

/api/hero/          # 武将系统
  - GET  /list                # 获取武将列表
  - POST /recruit             # 招募武将
  - POST /upgrade             # 升级武将

/api/map/           # 地图系统
  - GET  /unit                # 获取地图单元信息
  - POST /move                # 移动城市

/api/battle/        # 战斗系统
  - POST /attack              # 发起攻击
  - GET  /chessboard          # 获取战场信息
```


## 事件系统 (Event System)

### 概述

事件系统是游戏的核心机制，处理所有需要时间的操作（建造、升级、训练、战斗等）。

### 前端事件显示

#### rightpanel 结构
```html
<div id="rightpanel">
  <div id="eventinfo"></div>  <!-- 事件列表头部 -->
  <div id="trees"></div>       <!-- 事件列表内容 -->
  <div id="main">...</div>     <!-- 聊天窗口 -->
</div>
```

#### 事件数据流
```
后端 API → { value: [...] } → cb_GetValidEvent() → ShowEvent() → 渲染到 rightpanel
```

### API 接口

#### GET /api/event/valid
获取当前进行中的事件列表

**请求参数**:
- `city_id`: 城市 ID (可选，查询参数)
- 认证: `X-Wallet-Auth` 请求头

**返回格式**:
```json
{
  "value": [
    {
      "ID": 1,
      "ActionType": 1,
      "State": 1,
      "ObjType": 1,
      "ObjID": 1,
      "ObjLevel": 1,
      "TargetCity": 0,
      "RemainTime": 3600,
      "BeginTime": "10:00:00",
      "OverTime": "11:00:00",
      "ObjImg": "1/1.GIF",
      "ObjName": "聚义厅",
      "EventPos": 10,
      "EventQueue": 0,
      "EventType": 1,
      "FromCityName": ""
    }
  ]
}
```

**重要**: 必须返回 `{ value: [...] }` 格式，前端才能正确处理！

### 前端处理逻辑

#### cb_GetValidEvent 函数
```javascript
// public/jx-web/Js/Event.js
function cb_GetValidEvent(result) {
  if(DataValidate(result)==false) return;
  
  EventInfo = result.value;  // 提取事件数组
  
  // 空数组检查
  if(EventInfo!=null && EventInfo.length > 0 && EventInfo[0].ID==-1)
    EventInfo = null;
  
  ShowEvent();           // 显示事件列表
  ShowEventMapUnit();    // 显示事件地图标记
  UpdateControlTarget(); // 更新控制目标
  // ...
}
```

#### 空状态处理
- 当 `EventInfo` 为 null 或空数组时，rightpanel 不显示内容
- 这是**正常行为**，不是 bug
- 用户执行操作（建造、升级等）后会创建事件

### EventInfo 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| ID | long | 事件 ID |
| ActionType | int | 动作类型 (1=建造, 2=升级, 3=研究, 4=训练...) |
| State | int | 状态 (1=进行中, 2=等待中) |
| ObjType | int | 对象类型 (1=建筑, 2=科技, 3=防御, 4=英雄, 5=军团) |
| ObjID | int | 对象 ID |
| ObjLevel | int | 对象等级 |
| TargetCity | int | 目标城市 |
| RemainTime | int | 剩余时间（秒） |
| BeginTime | string | 开始时间 |
| OverTime | string | 结束时间 |
| ObjImg | string | 对象图片路径 |
| ObjName | string | 对象名称 |
| EventPos | int | 事件位置 |
| EventQueue | int | 事件队列 |
| EventType | int | 事件类型 (1=内政, 2=城防, 3=军团) |
| FromCityName | string | 来源城市名称 |

### C# 源码参考

#### BLL 层
```csharp
// jx/BLL/Event.cs
public static EventInfo[] GetValidEvent(string userName, int cityID)
{
    EventInfo[] eventArray = EventExAccess.GetValidEvent(userName, cityID, time);
    
    // 计算剩余时间
    for (int i = 0; i < eventArray.Length; i++) {
        TimeSpan spaceTime = DateTime.Parse(eventArray[i].OverTime) - DateTime.Now;
        eventArray[i].RemainTime = (int)(spaceTime.TotalSeconds);
        // ... 填充 ObjName, ObjImg 等字段
    }
    
    return eventArray;
}
```

#### Model 层
```csharp
// jx/Model/EventInfo.cs
public class EventInfo {
    public long ID { get; set; }
    public int ActionType { get; set; }
    public int State { get; set; }
    public int ObjType { get; set; }
    // ... 其他字段
}
```

### 常见问题

#### rightpanel 不显示内容

**原因**: 数据库中没有事件数据

**验证**:
```bash
npx wrangler d1 execute ghost-game-db --local \
  --command="SELECT COUNT(*) FROM time_events"
```

**解决**: 这是正常的空状态，不是 bug。用户执行操作后会创建事件。

#### API 返回格式错误

**错误格式**:
```json
{ "success": true, "data": { "events": [], "total": 0 } }
```

**正确格式**:
```json
{ "value": [] }
```

**修复**: 确保后端返回 `{ value: [...] }` 格式。


## 数据库设计

### 核心表结构

#### characters (角色表)
```sql
CREATE TABLE characters (
  wallet_address TEXT PRIMARY KEY,  -- 钱包地址 (主键)
  name TEXT UNIQUE NOT NULL,        -- 角色名称
  level INTEGER DEFAULT 1,          -- 等级
  gold INTEGER DEFAULT 999999,      -- 元宝
  vip_level INTEGER DEFAULT 0,      -- VIP 等级
  created_at DATETIME,              -- 创建时间
  last_login DATETIME               -- 最后登录
);
```

#### cities (城市表)
```sql
CREATE TABLE cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,     -- 所属玩家
  name TEXT NOT NULL,               -- 城市名称
  position INTEGER NOT NULL UNIQUE, -- 地图位置 (全局唯一)
  money INTEGER DEFAULT 3000,       -- 铜钱
  food INTEGER DEFAULT 3000,        -- 粮食
  population INTEGER DEFAULT 300,   -- 人口
  money_rate INTEGER DEFAULT 99,    -- 铜钱产量
  food_rate INTEGER DEFAULT 99,     -- 粮食产量
  map_image TEXT DEFAULT 'm1.JPG',  -- 地图图片
  FOREIGN KEY (wallet_address) REFERENCES characters(wallet_address)
);
```

#### buildings (建筑表)
```sql
CREATE TABLE buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL,         -- 所属城市
  type TEXT NOT NULL,               -- 类型: interior/defense
  level INTEGER DEFAULT 1,          -- 等级
  position INTEGER,                 -- 城内位置
  state INTEGER DEFAULT 0,          -- 状态: 0=正常 1=建造中
  config_id INTEGER NOT NULL,       -- 配置 ID
  FOREIGN KEY (city_id) REFERENCES cities(id)
);
```

#### time_events (事件表)
```sql
CREATE TABLE time_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,     -- 所属玩家
  event_type TEXT NOT NULL,         -- 事件类型
  target_id INTEGER NOT NULL,       -- 目标对象 ID
  start_time DATETIME NOT NULL,     -- 开始时间
  end_time DATETIME NOT NULL,       -- 结束时间
  state INTEGER DEFAULT 0,          -- 状态
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_address) REFERENCES characters(wallet_address)
);
```

**注意**: 当前表结构较简化，完整版应包含更多字段（参考 C# DBEvent 模型）。

#### tasks (主线任务进度表)
```sql
CREATE TABLE tasks (
  wallet_address TEXT PRIMARY KEY,
  main_id INTEGER DEFAULT 1,      -- 章ID
  main_index INTEGER DEFAULT 1,   -- 节ID
  task_ids TEXT,                  -- JSON数组: [1,2,3,0,0...]
  task_states TEXT,               -- JSON数组: [0,0,0,0...]
  task_progress TEXT              -- JSON数组: [0,0,0,0...]
);
```
任务配置来自 `src/config/tasks.json`（95个任务），不存数据库。

#### technics (科技表)
```sql
CREATE TABLE technics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  city_id INTEGER NOT NULL,
  static_index INTEGER NOT NULL,  -- 科技静态ID
  technic_level INTEGER DEFAULT 1,
  state INTEGER DEFAULT 0,
  build_id INTEGER,
  FOREIGN KEY (user_name) REFERENCES characters(wallet_address)
);
```

#### user_resources (用户资源表)
```sql
CREATE TABLE user_resources (
  wallet_address TEXT PRIMARY KEY,
  prestige INTEGER DEFAULT 0,       -- 声望
  prestige_level INTEGER DEFAULT 1,
  fame INTEGER DEFAULT 0,            -- 荣誉
  fame_level INTEGER DEFAULT 1,
  pearl INTEGER DEFAULT 0,           -- 玉石
  crystal INTEGER DEFAULT 0,         -- 水晶
  agate INTEGER DEFAULT 0,          -- 玛瑙
  w_bowlder INTEGER DEFAULT 0,      -- 白玉石
  b_bowlder INTEGER DEFAULT 0,      -- 黑玉石
  crusade INTEGER DEFAULT 0,
  jade_book INTEGER DEFAULT 0
);
```

#### missions (战役任务表)
```sql
CREATE TABLE missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  condition_user TEXT NOT NULL,
  mission_state INTEGER NOT NULL DEFAULT 0,
  mission_type INTEGER NOT NULL DEFAULT 0,
  target_pos INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL DEFAULT 0,
  group_index TEXT NOT NULL,
  condition_index TEXT NOT NULL,
  gain_index TEXT NOT NULL,
  start_date DATETIME NOT NULL,
  create_date DATETIME NOT NULL,
  FOREIGN KEY (wallet_address) REFERENCES characters(wallet_address)
);
```

#### time_events (事件表)


## 前端架构

### iframe 多页面架构

```
index.html (主框架)
  └── iframe: jx-web/Main.html (游戏主界面)
      ├── 内政页面 (PageNum=1)
      ├── 城防页面 (PageNum=2)
      ├── 英雄页面 (PageNum=3)
      └── ...
```

### API 适配器

#### api-config.js (API 配置)
```javascript
window.API_MAPPING = {
  GetUserInfo: {
    endpoint: '/game/user-info',
    httpMethod: 'GET',
    params: [],
    auth: true
  },
  GetMapUnitInfo: {
    endpoint: '/map/unit',
    httpMethod: 'GET',
    params: ['city_id', 'map_type', 'pos'],
    auth: true
  }
};
```

#### api-adapter-v2.js (自动生成 API 方法)
```javascript
// 根据配置自动生成 Main.GetUserInfo() 等方法
function generateApiMethod(methodName, config) {
  return function(...args) {
    const callback = args.pop();
    apiRequest(config.endpoint, config.httpMethod, data, config.auth, callback);
  };
}
```


## 开发环境

### 本地开发

#### 启动后端 Worker
```bash
cd workers/ghost-game
npm run dev
# Worker 运行在 http://localhost:8788
```

#### 启动前端开发服务器
```bash
npm run dev
# 前端运行在 http://localhost:5173
```

### 数据库操作

#### 运行 migrations
```bash
cd workers/ghost-game
npx wrangler d1 migrations apply ghost-game-db --local
```

#### 执行 SQL 查询
```bash
npx wrangler d1 execute ghost-game-db --local \
  --command="SELECT * FROM characters"
```

#### 插入测试数据
```bash
npx wrangler d1 execute ghost-game-db --local \
  --file=migrations/003_seed_basic.sql
```

### 重要注意事项

⚠️ **永远不要删除 `.wrangler/state` 目录！**
- 这个目录包含本地 D1 数据库
- 删除后需要重新运行所有 migrations 和 seed 数据

✅ **修改 JSON 配置文件后的正确流程：**
```bash
# 1. 删除编译输出
rm -rf workers/ghost-game/dist

# 2. 重新编译
cd workers/ghost-game && npm run build

# 3. 重启 Worker
# (停止旧进程，启动新进程)
```


## 关键技术细节

### 1. 图片路径大小写问题

**问题**: macOS 文件系统区分大小写，Windows 不区分
- 配置文件: `a1.gif` (小写)
- 实际文件: `a1.GIF` (大写)
- 结果: macOS 加载失败

**解决方案**: 统一使用大写扩展名
```bash
# 批量修改配置文件
sed -i '' 's/\.gif"/.GIF"/g' workers/ghost-game/src/config/buildings.json
sed -i '' 's/\.jpg"/.JPG"/g' workers/ghost-game/src/config/buildings.json
```

### 2. 数据库字段命名

**后端 (snake_case)**:
```typescript
wallet_address, created_at, config_id
```

**前端 (PascalCase)**:
```javascript
WalletAddress, CreatedAt, ConfigID
```

**API 返回格式**: 使用 PascalCase 匹配 C# 原版
```json
{
  "ID": 1,
  "Name": "玩家",
  "Level": 1,
  "CityList": [...]
}
```

### 3. Position 字段设计

- **全局唯一**: 所有玩家共享同一个地图
- **系统预留**: 1-999 为系统预留位置
- **玩家城市**: 从 1000 开始动态分配
- **UNIQUE 约束**: 防止位置冲突


## 常见问题排查

### API 返回数据但前端不显示

**检查清单**:
1. 检查 PageNum 是否正确 (应该是 1 表示内政页面)
2. 检查 API 返回格式是否正确 (数组 vs 对象)
3. 检查字段名大小写 (PascalCase)
4. 检查图片路径是否正确 (大写扩展名)
5. 检查浏览器控制台是否有 JavaScript 错误

### 修改配置文件不生效

**原因**: TypeScript 编译后的文件在 `dist` 目录

**解决方案**:
```bash
rm -rf workers/ghost-game/dist
cd workers/ghost-game && npm run build
# 重启 Worker
```

### 数据库查询返回空

**检查步骤**:
1. 确认数据库文件存在: `.wrangler/state/v3/d1/`
2. 运行查询验证数据: `npx wrangler d1 execute ...`
3. 检查 SQL 语句是否正确
4. 检查外键关系是否正确

### 新用户没有城市

**原因**: 自动初始化失败

**排查**:
1. 检查 Worker 日志
2. 检查数据库约束 (UNIQUE position)
3. 检查 SQL 语句参数数量是否匹配
4. 验证 initializeNewUser 函数是否被调用


## 测试指南

### 测试新用户注册

```bash
# 使用新的钱包地址测试
curl -H "X-Wallet-Auth: 0xNEWADDRESS:test_signature" \
  "http://localhost:8788/api/game/user-info"

# 验证返回数据
# - 应该包含角色信息
# - CityList 应该包含一个城市
# - 城市应该有 2 个初始建筑
```

### 验证数据库数据

```bash
# 查看角色
npx wrangler d1 execute ghost-game-db --local \
  --command="SELECT * FROM characters WHERE wallet_address = '0xNEWADDRESS'"

# 查看城市
npx wrangler d1 execute ghost-game-db --local \
  --command="SELECT * FROM cities WHERE wallet_address = '0xNEWADDRESS'"

# 查看建筑
npx wrangler d1 execute ghost-game-db --local \
  --command="SELECT * FROM buildings WHERE city_id = (SELECT id FROM cities WHERE wallet_address = '0xNEWADDRESS')"
```

### 测试 API 端点

```bash
# 测试认证
curl -H "X-Wallet-Auth: 0x1234567890abcdef1234567890abcdef12345678:test_signature" \
  "http://localhost:8788/api/game/status"

# 测试地图单元
curl -H "X-Wallet-Auth: 0x1234567890abcdef1234567890abcdef12345678:test_signature" \
  "http://localhost:8788/api/map/unit?city_id=1&map_type=1&pos=0"
```


## 部署流程

### 部署到 Cloudflare

```bash
cd workers/ghost-game

# 部署 Worker
npm run deploy

# 运行远程 migrations
npx wrangler d1 migrations apply ghost-game-db --remote
```

### 环境变量配置

在 `wrangler.toml` 中配置:
```toml
[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "ghost-game-db"
database_id = "your-database-id"
```

## 参考文档

- **迁移计划**: `MIGRATION_DALEX_PLAN.md`
- **API 验证指南**: `API_VERIFICATION_GUIDE.md`
- **开发日志**: `memory/2026-02-27.md`
- **数据库 Schema**: `workers/ghost-game/migrations/000_schema.sql`

## 联系与支持

如有问题，请查看:
1. Worker 日志: `wrangler tail`
2. 浏览器控制台
3. 数据库查询结果
4. 本文档的常见问题部分

---

**最后更新**: 2026-03-24
**维护者**: AI Assistant
**版本**: 1.1.0（新增注册完整流程、user_resources、missions表）
