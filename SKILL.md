# 剑侠情缘 Web 项目迁移技能

## 项目概述

**目标**: 将 ASP.NET C# 后端 + jQuery 前端的传统项目迁移到 React + Cloudflare Workers + D1 数据库

**项目结构**:
```
free-node-web/
├── jx/                          # 原始 C# ASP.NET 项目 (参考)
├── src/features/webgame/        # React 前端
├── workers/ghost-game/          # Cloudflare Workers 后端
└── workers/ghost-mail/          # 邮件服务
```

---

## 核心迁移原则

### 1. 渐进式迁移策略

```
┌─────────────────────────────────────────────────────────────┐
│  推荐迁移顺序 (按优先级排序)                                 │
├─────────────────────────────────────────────────────────────┤
│  1. 基础架构: 路由层 → 认证层 → 城市系统 → 自动注册          │
│  2. 核心系统: 武将系统 → 建筑系统 → 资源系统                  │
│  3. 战斗系统: 军团 → 副本 → 战斗结算                         │
│  4. 扩展系统: 任务 → 邮件 → 商城 → 市场                      │
│  5. 增值系统: 排行榜 → 竞技 → 成就                          │
└─────────────────────────────────────────────────────────────┘
```

**为什么这个顺序?**
- 先搞定基础设施，后续功能可以快速复用
- 用户感知强的功能优先 (武将/建筑/资源)
- 复杂系统(军团/战斗)需要更多测试

---

## API 设计规范

### 命名规则

```typescript
// ✅ 推荐: RESTful + 语义化
GET    /api/game/user-info        // 用户基础信息
POST   /api/game/city/interior/1  // 城市内政
POST   /api/game/hero/list        // 武将列表
POST   /api/game/hero/recruit     // 招募武将

// ❌ 避免: 过度复杂或不一致
POST   /api/getHeroes             // 动词开头
GET    /api/hero-get              // 混合风格
```

### 统一响应格式

```typescript
// 成功响应
{
  success: true,
  data: { /* 业务数据 */ }
}

// 错误响应
{
  success: false,
  error: "错误描述信息"
}

// HTTP 状态码使用
200 - 成功
400 - 请求参数错误
401 - 未认证
404 - 资源不存在
500 - 服务器内部错误
```

---

## ⚠️ 前后端接口一致性 (核心要点!)

**这是迁移中最容易出问题的点！** 前后端接口不一致会导致：
- 前端崩溃 (`undefined` 错误)
- 数据不显示
- 功能完全失效
- 调试困难

### 常见不一致错误

```typescript
// ❌ 字段名不一致 (驼峰 vs 下划线)
后端返回: { heroId, hero_name, Hero_Level }
前端期望: { id, name, level }

// ❌ 端点不一致 (复数 vs 单数)
后端: POST /api/hero/list
前端: POST /api/heros/list

// ❌ 参数不一致
后端: { cityId, count, source }
前端: { city_id, count }

// ❌ HTTP 方法不一致
后端: GET /api/hero/:id
前端: POST /api/hero/:id
```

### 解决方案: 接口契约文件

```typescript
// src/features/webgame/types/api-contract.ts
/**
 * API 接口契约
 * 确保前后端接口完全一致!
 */

// ==================== 武将系统 ====================

export interface HeroListResponse {
  success: true;
  data: Array<{
    // ⚠️ 字段名必须完全一致 (大小写、下划线)
    id: number;           // 后端返回: id
    name: string;        // 后端返回: name  
    level: number;       // 后端返回: level
    exp: number;         // 后端返回: exp
    attack: number;      // 后端返回: attack
    defense: number;     // 后端返回: defense
    hp: number;          // 后端返回: hp
    max_hp: number;      // ⚠️ 后端返回: max_hp (下划线!)
    quality: number;     // 后端返回: quality
    state: number;       // 后端返回: state
    skill_ids: number[]; // 后端返回: skill_ids (JSON数组)
  }>;
}

export interface HeroRecruitRequest {
  city_id: number;   // ⚠️ 后端接收: city_id (下划线!)
  count: number;     // 后端接收: count
}

// ==================== 城市系统 ====================

export interface CityInteriorResponse {
  success: true;
  data: {
    userName: string;       // ⚠️ 驼峰 vs 后端 user_name
    cityId: number;         // 驼峰
    prosperity: number;     // 后端返回
    money: number;          // 后端返回
    food: number;           // 后端返回
    population: number;     // 后端返回
    moneyRate: number;     // ⚠️ 后端返回: money_rate (下划线!)
    foodRate: number;       // ⚠️ 后端返回: food_rate
    populationRate: number; // ⚠️ 后端返回: population_rate
  };
}

// ==================== 建筑系统 ====================

export interface BuildingListResponse {
  success: true;
  data: {
    buildings: Array<{
      id: number;
      cityId: number;       // ⚠️ camelCase vs snake_case
      type: string;
      level: number;
      position: number;
      state: number;
      configId: number;    // ⚠️ camelCase
      name: string;        // 后端计算后返回
      icon: string;        // 后端计算后返回
      image: string;       // 后端计算后返回
      effValue: number;
      effType: number;
      upNeedMoney: number; // 后端计算后返回
      upNeedFood: number;
      upNeedMen: number;
      maxLevel: number;
    }>;
  };
}
```

### 后端必须做字段映射!

```typescript
// workers/ghost-game/src/routes/hero.ts

// ✅ 推荐: 后端明确返回前端期望的字段
app.get('/list', async (c) => {
  const heroes = await db.prepare(`
    SELECT * FROM heroes WHERE wallet_address = ?
  `).bind(walletAddress).all();

  // ⚠️ 严格映射: 数据库字段 → API 响应字段
  const transformed = (heroes.results || []).map((hero: any) => ({
    id: hero.id,
    name: hero.name,
    level: hero.level,
    exp: hero.exp,
    attack: hero.attack,
    defense: hero.defense,
    hp: hero.hp,
    max_hp: hero.max_hp,           // ⚠️ 与前端契约一致
    quality: hero.quality,
    state: hero.state,
    skill_ids: hero.skill_ids ? JSON.parse(hero.skill_ids) : [],
  }));

  return success(c, transformed);
});

// ❌ 避免: 直接返回数据库原始字段
app.get('/list', async (c) => {
  const heroes = await db.prepare(`SELECT * FROM heroes ...`).all();
  return success(c, heroes.results); // ❌ 字段名可能不一致!
});
```

### 端点命名必须一致!

```typescript
// ⚠️ 常见错误对照表

// ❌ 后端: POST /api/hero/recruit
// ❌ 前端: POST /api/heros/recruit          ← 复数 vs 单数

// ❌ 后端: GET /api/game/city/interior/:id
// ❌ 前端: GET /api/game/city/:id/interior   ← 参数位置不同

// ❌ 后端: POST /api/game/building/:id/upgrade
// ❌ 前端: POST /api/game/building/upgrade/:id

// ✅ 解决方案: 统一使用 snake_case URL
// 后端
POST /api/hero/recruit
GET  /api/hero/list
POST /api/hero/:id/train

// 前端
POST /api/hero/recruit
GET  /api/hero/list  
POST /api/hero/:id/train
```

### 参数数量必须一致!

```typescript
// workers/ghost-game/src/routes/hero.ts

// ✅ 推荐: 参数明确，数量一致
app.post('/recruit', async (c) => {
  const body = await c.req.json();
  const { city_id, count } = body;
  
  // ⚠️ 验证参数存在
  if (city_id === undefined) {
    return error(c, '缺少参数: city_id');
  }
  if (count === undefined) {
    return error(c, '缺少参数: count');
  }
});

// ❌ 避免: 参数数量不一致
// 前端传递: { cityId, count, source }
// 后端只用了 cityId, count ← source 被忽略也没报错
```

### 一致性检查清单

```typescript
// 每次前后端联调前必须检查:

const API_CONSISTENCY_CHECK = {
  hero_list: {
    endpoint: '/api/hero/list',
    method: 'GET',
    responseFields: [
      'id', 'name', 'level', 'exp',
      'attack', 'defense', 'hp', 'max_hp',
      'quality', 'state', 'skill_ids'
    ],
  },
  hero_recruit: {
    endpoint: '/api/hero/recruit',
    method: 'POST',
    requestParams: ['city_id', 'count'],  // ⚠️ 必须完全匹配
    responseFields: ['heroes', 'message'],
  },
  city_interior: {
    endpoint: '/api/game/city/interior/:id',
    method: 'POST',
    responseFields: [
      'userName', 'cityId', 'prosperity',
      'money', 'food', 'population',
      'moneyRate', 'foodRate', 'populationRate'
    ],
  },
};

// 一致性验证工具
function validateAPIResponse(name: string, response: any, expectedFields: string[]) {
  const missing = expectedFields.filter(f => !(f in response));
  if (missing.length > 0) {
    throw new Error(
      `[${name}] 字段不一致!\n` +
      `后端返回: ${Object.keys(response).join(', ')}\n` +
      `前端期望: ${expectedFields.join(', ')}\n` +
      `缺少字段: ${missing.join(', ')}`
    );
  }
}
```

### 前后端联调流程

```
1. 后端先写: 定义接口契约 + 实现 API
2. 后端自测: curl 测试返回数据
3. 对照检查: 对比响应字段是否与契约一致
4. 前端对接: 使用契约类型对接
5. 类型检查: TypeScript 编译时发现问题
6. 联调测试: 前后端一起跑
```

### 快速排查清单

| 问题 | 检查点 |
|------|--------|
| 数据 undefined | 字段名大小写/下划线是否一致 |
| 404 | 端点 URL 是否完全一致 |
| 401 | 认证 header 是否正确 |
| 参数丢失 | requestBody 字段是否匹配 |

---

## 自动注册模式

```typescript
// ✅ 推荐: 首次访问自动创建资源
app.post('/user-info', async (c) => {
  const wallet = await verifyAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const result = await ensureUserAndCity(db, wallet);
  if (!result) return error(c, '自动注册失败');

  return success(c, { /* 返回用户数据 */ });
});

// ❌ 避免: 要求用户手动注册流程
app.post('/register', async (c) => {
  const { name, country } = await c.req.json();
  // 需要前端先调用注册再调用登录
});
```

**自动注册的好处:**
- 用户零摩擦进入游戏
- 减少前端状态管理复杂度
- 统一入口便于日志和统计

---

## 数据访问层 (DAL) 模式

### 统一数据库访问

```typescript
// workers/ghost-game/src/utils/db.ts
export const db = {
  // 查询单条记录
  async first(sql: string, params: any[]) {
    return await c.env.DB.prepare(sql).bind(...params).first();
  },

  // 查询多条记录
  async all(sql: string, params: any[]) {
    return await c.env.DB.prepare(sql).bind(...params).all();
  },

  // 插入/更新
  async run(sql: string, params: any[]) {
    return await c.env.DB.prepare(sql).bind(...params).run();
  },

  // 事务操作 (使用 batch)
  async transaction(ops: (db: any) => Promise<any>[]) {
    return await c.env.DB.batch(ops.map(op => op(this)));
  }
};
```

### 表结构命名规范

```sql
-- ✅ 推荐: 小写下划线命名
CREATE TABLE characters (
  id INTEGER PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1
);

-- ❌ 避免: 混合大小写或驼峰
CREATE TABLE UserInfo (
  ID int,
  UserName varchar
);
```

### 关联查询优化

```typescript
// ✅ 推荐: 使用 JOIN 减少查询次数
const user = await db.first(`
  SELECT c.*, ci.name as city_name
  FROM characters c
  LEFT JOIN cities ci ON c.wallet_address = ci.wallet_address
  WHERE c.wallet_address = ?
`, [wallet]);

// ❌ 避免: N+1 查询问题
const user = await db.first('SELECT * FROM characters WHERE wallet_address = ?', [wallet]);
const cities = await db.all('SELECT * FROM cities WHERE wallet_address = ?', [wallet]); // 额外查询
```

---

## 前端组件设计

### 组件拆分原则

```
src/features/webgame/
├── components/
│   ├── Core/                    # 核心组件 (只读，不频繁更新)
│   │   ├── JxWebTest.tsx       # 主入口
│   │   ├── PopupManager.tsx     # 弹窗管理
│   │   └── Layout/             # 布局组件
│   │
│   ├── Features/               # 功能组件 (业务逻辑)
│   │   ├── CityPanel.tsx       # 城市面板
│   │   ├── HeroPanel.tsx       # 武将面板
│   │   ├── MilitaryPanel.tsx   # 军事面板
│   │   └── ...
│   │
│   └── Popups/                 # 弹窗组件
│       ├── BuildingDetailPanel.tsx
│       └── BuildingSelectPanel.tsx
│
├── services/                   # API 服务
│   ├── gameApi.ts              # 游戏核心API
│   ├── cityApi.ts              # 城市API
│   └── heroApi.ts              # 武将API
│
├── hooks/                      # React Hooks
│   ├── useResources.ts         # 资源管理
│   └── useAuth.ts              # 认证状态
│
└── utils/                      # 工具函数
    ├── api.ts                  # API 基础配置
    └── auth.ts                 # 认证工具
```

### 状态管理策略

```typescript
// ✅ 推荐: 本地状态 + Context 组合
// 简单数据: useState
const [count, setCount] = useState(0);

// 中等复杂度: useReducer
const [state, dispatch] = useReducer(gameReducer, initialState);

// 全局配置: React Context
<GameProvider>
  <JxWebTest />
</GameProvider>

// ❌ 过度使用: 所有状态都上 Redux/Zustand
// 对于单页游戏应用，Context + useState 完全够用
```

### API 调用模式

```typescript
// ✅ 推荐: 封装基础请求函数
// utils/api.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';

export function getApiBase() {
  // Cloudflare Workers 本地开发
  if (import.meta.env.DEV) return 'http://localhost:8788';
  return API_BASE;
}

export function getAuthHeaders() {
  const wallet = localStorage.getItem('wallet-address');
  return {
    'Content-Type': 'application/json',
    'X-Wallet-Auth': wallet || '',
  };
}

// services/gameApi.ts
export const gameApi = {
  async getHeroList(): Promise<ApiResponse<Hero[]>> {
    const res = await fetch(`${getApiBase()}/api/hero/list`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
```

---

## 性能优化

### 1. 请求优化

```typescript
// ✅ 推荐: 批量请求 + 缓存
const [userData, cityData, heroes] = await Promise.all([
  fetchUserInfo(),
  fetchCityInfo(),
  fetchHeroes(),
]);

// ❌ 避免: 串行请求
const user = await fetchUserInfo();
const city = await fetchCityInfo(); // 等待完成
const heroes = await fetchHeroes(); // 等待完成
```

### 2. 防抖与节流

```typescript
// 用户输入防抖
import { useDebounce } from 'use-debounce';

const [searchTerm] = useDebounce(query, 300);
useEffect(() => {
  if (searchTerm) fetchSearchResults(searchTerm);
}, [searchTerm]);

// 自动保存节流
import { useThrottle } from 'use-throttle';

const saveProgress = useThrottle(() => {
  saveToServer(progressData);
}, 5000); // 最多每5秒保存一次
```

### 3. 懒加载组件

```typescript
import { lazy, Suspense } from 'react';

// ✅ 推荐: 按需加载
const HeroPanel = lazy(() => import('./components/HeroPanel'));
const BattlePanel = lazy(() => import('./components/BattlePanel'));

// 使用
<Suspense fallback={<Loading />}>
  <HeroPanel />
</Suspense>
```

### 4. 图片资源优化

```typescript
// ✅ 推荐: 使用 CDN + WebP
const getBuildingIcon = (configId: number, level: number) => {
  return `https://cdn.free-node.xyz/jx/img/2/b/m/${prefix}${fileName}.webp`;
};

// ❌ 避免: 大文件直接内嵌
```

---

## 安全最佳实践

### 1. 认证与授权

```typescript
// workers/ghost-game/src/utils/auth.ts
export async function verifyWalletAuth(c: any): Promise<string | null> {
  const authHeader = c.req.header('X-Wallet-Auth');
  if (!authHeader) return null;

  // 验证签名
  const [address, signature] = authHeader.split(':');
  const isValid = await verifySignature(address, signature);
  if (!isValid) return null;

  return address.toLowerCase();
}

// 关键操作必须验证所有权
app.post('/building/:id/upgrade', async (c) => {
  const wallet = await verifyWalletAuth(c);
  if (!wallet) return error(c, 'Unauthorized', 401);

  const building = await db.first(
    'SELECT * FROM buildings b JOIN cities c ON b.city_id = c.id WHERE b.id = ? AND c.wallet_address = ?',
    [buildingId, wallet]
  );
  if (!building) return error(c, '无权操作', 403);
});
```

### 2. 输入验证

```typescript
// ✅ 推荐: 明确的参数验证
app.post('/hero/recruit', async (c) => {
  const body = await c.req.json();
  const { city_id, count } = body;

  // 类型检查
  if (typeof city_id !== 'number' || city_id <= 0) {
    return error(c, '无效的城市ID');
  }

  // 范围检查
  if (count < 1 || count > 10) {
    return error(c, '招募数量必须在1-10之间');
  }

  // 白名单检查
  const allowedActions = ['normal', 'advanced'];
  if (!allowedActions.includes(action)) {
    return error(c, '无效的招募类型');
  }
});

// ❌ 避免: 盲目信任前端数据
app.post('/hero/recruit', async (c) => {
  const { city_id, count } = await c.req.json();
  await db.run('INSERT INTO heroes ...', [city_id, count]); // 危险!
});
```

### 3. SQL 注入防护

```typescript
// ✅ 推荐: 使用参数化查询
await db.prepare('SELECT * FROM heroes WHERE wallet_address = ?')
  .bind(walletAddress);

// ❌ 避免: 字符串拼接
const sql = `SELECT * FROM heroes WHERE wallet_address = '${walletAddress}'`; // 危险!
```

### 4. 速率限制 (可选)

```typescript
// Cloudflare Workers 可使用 KV 实现简单限流
const RATE_LIMIT = 100; // 每分钟最多100次请求

async function checkRateLimit(c: any): Promise<boolean> {
  const key = `rate:${c.req.header('X-Wallet-Auth')}`;
  const current = await kv.get(key) || 0;

  if (current >= RATE_LIMIT) {
    return false; // 超出限制
  }

  await kv.put(key, current + 1, { expirationTtl: 60 });
  return true;
}
```

---

## 错误处理

### 后端统一错误处理

```typescript
// workers/ghost-game/src/index.ts
app.onError((err, c) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  });

  // 生产环境不返回详细错误
  return c.json({
    success: false,
    error: import.meta.env.PROD
      ? '服务器内部错误'
      : err.message,
  }, 500);
});

// 业务错误使用辅助函数
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
```

### 前端错误处理

```typescript
// services/api.ts
async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || '请求失败');
    }

    return data.data;
  } catch (error) {
    console.error('[API Error]', error);
    // 统一错误提示
    showToast(error.message);
    throw error;
  }
}

// 使用
try {
  const heroes = await fetchWithErrorHandling('/api/hero/list');
} catch {
  // 已处理，用户已看到提示
}
```

---

## 测试策略

### 1. API 测试

```typescript
// workers/ghost-game/test/api.test.ts
describe('Hero API', () => {
  it('should return hero list for valid user', async () => {
    const res = await worker.fetch('/api/hero/list', {
      headers: { 'X-Wallet-Auth': 'valid-address:signature' },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should reject unauthorized requests', async () => {
    const res = await worker.fetch('/api/hero/list');
    expect(res.status).toBe(401);
  });
});
```

### 2. 集成测试

```typescript
// 测试完整流程
describe('Hero Recruitment Flow', () => {
  it('should recruit hero and update list', async () => {
    // 1. 招募武将
    const recruitRes = await worker.fetch('/api/hero/recruit', {
      method: 'POST',
      body: JSON.stringify({ city_id: 1, count: 1 }),
    });

    // 2. 获取列表确认
    const listRes = await worker.fetch('/api/hero/list');
    const heroes = await listRes.json();

    expect(heroes.data.length).toBeGreaterThan(0);
  });
});
```

---

## 部署与监控

### 1. 环境配置

```bash
# .env.production
VITE_API_BASE=https://game.free-node.xyz
VITE_CDN_BASE=https://cdn.free-node.xyz

# wrangler.toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

### 2. 日志策略

```typescript
// 开发环境详细日志
if (import.meta.env.DEV) {
  console.log('[Hero] Recruit request:', { cityId, count });
}

// 生产环境简化日志
console.log('[Hero] Recruit completed:', heroId);
```

### 3. 监控指标

```typescript
// 可选: 上报性能指标
const startTime = Date.now();
const result = await fetchHeroes();
const duration = Date.now() - startTime;

// 上报到监控服务
if (duration > 1000) {
  logSlowQuery('/api/hero/list', duration);
}
```

---

## 迁移检查清单

### 迁移前
- [ ] 分析原始项目结构和数据模型
- [ ] 列出所有 API 端点
- [ ] 确定核心功能和优先级
- [ ] 设计新的 API 规范

### 迁移中
- [ ] 实现认证和授权
- [ ] 实现自动注册
- [ ] 迁移核心数据模型
- [ ] 实现 API 端点
- [ ] 实现前端组件
- [ ] 前后端联调

### 迁移后
- [ ] 功能测试 (所有按钮/流程)
- [ ] 性能测试 (加载速度/响应时间)
- [ ] 安全测试 (认证/授权/注入)
- [ ] 兼容性测试 (不同设备/浏览器)
- [ ] 监控和日志配置

---

## 常见问题

### Q: 如何处理原始项目中的复杂业务逻辑?

**A: 逐步拆解**
1. 先理解原始逻辑 (阅读 jx/BLL/*.cs)
2. 用 TypeScript 重写核心算法
3. 添加单元测试确保等价
4. 集成后对比测试结果

### Q: 前端状态太复杂怎么办?

**A: 状态分层**
```
本地状态 (useState/useReducer)
  ↓
页面状态 (Context)
  ↓
应用配置 (Zustand - 如果需要)
```

大多数游戏状态可以直接在组件内管理，跨组件通信用 Context。

### Q: 如何保证迁移后功能一致?

**A: 并行验证**
1. 新旧系统同时运行
2. 相同输入比较输出
3. 用户逐步切换到新系统
4. 旧系统作为备份一段时间

---

## 资源

- **原版参考**: `jx/BLL/*.cs` - 业务逻辑
- **原版模型**: `jx/Model/*.cs` - 数据模型
- **API 路由**: `workers/ghost-game/src/routes/*.ts`
- **前端组件**: `src/features/webgame/components/*.tsx`
