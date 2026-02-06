# 剑侠情缘 Web - 开发速查

## ⚠️ 前后端接口一致性 (联调前必看!)

```
字段名必须完全一致!
┌─────────────────────────────────────────────────────────────┐
│  ❌ 后端返回: { heroId, hero_name, Hero_Level }            │
│  ❌ 前端期望: { id, name, level }                          │
│                                                             │
│  ✅ 正确: 两边都用 { id, name, level, max_hp }            │
└─────────────────────────────────────────────────────────────┘
```

### 常见不一致错误

| 类型 | 错误示例 | 正确做法 |
|------|---------|---------|
| 字段名 | `heroId` vs `id` | 统一用 `id` |
| 下划线 | `maxHp` vs `max_hp` | 统一用 `max_hp` |
| 端点 | `/api/hero/list` vs `/api/heros/list` | 统一用 `/api/hero/list` |
| 参数 | `{ cityId }` vs `{ city_id }` | 统一用 `city_id` |

### 联调前检查清单

```bash
# 1. 后端自测返回数据
curl http://localhost:8788/api/hero/list

# 2. 对照 api-contract.ts 检查字段
# src/features/webgame/types/api-contract.ts

# 3. TypeScript 编译检查
npm run typecheck

# 4. 前后端一起跑测试功能
```

---

## 快速命令

```bash
# 前端开发
npm run dev                    # 启动前端 (http://localhost:5174/jxweb-test)

# 后端开发
cd workers/ghost-game
npm run dev                    # 启动后端 (http://localhost:8788)

# 数据库
npm run db:init:local          # 初始化本地 D1 数据库

# 构建
npm run build                  # 构建前端
wrangler pages deploy dist     # 部署到 Cloudflare Pages
```

---

## API 端点速查

### 游戏核心 (game.ts)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/game/user-info` | POST | 获取用户信息 (自动注册) |
| `/api/game/city/interior/:id` | POST | 城市内政信息 |
| `/api/game/city/building-list/:id` | POST | 建筑列表 |
| `/api/game/city/:cityId/available-buildings/:position` | POST | 可建造建筑 |
| `/api/game/city/:cityId/build-building` | POST | 建造建筑 |
| `/api/game/building/:id/upgrade` | POST | 升级建筑 |

### 武将系统 (hero.ts)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/hero/list` | GET | 武将列表 |
| `/api/hero/recruit` | POST | 招募武将 |
| `/api/hero/:id/train` | POST | 训练武将 |
| `/api/hero/:id/upgrade` | POST | 突破武将 |

### 军团系统 (corps.ts)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/corps` | GET | 军团列表 |
| `/api/corps` | POST | 创建军团 |
| `/api/corps/:id/march` | POST | 出征 |
| `/api/corps/:id/recall` | POST | 召回 |
| `/api/corps/:id/formation` | POST | 阵型调整 |

---

## 按钮与页面映射

### 顶部导航
```
nav_1 (p_1) → 内政      → PoliticsPanel
nav_2 (p_2) → 军事      → MilitaryPanel
nav_3 (p_3) → 副本      → DungeonPanel
nav_4 (p_4) → 城防      → DefensePanel
nav_5 (p_5) → 武将      → HeroPanel ⭐
nav_6 (p_6) → 军械      → (开发中)
nav_7 (p_7) → 其他      → (开发中)
```

### 右侧边栏
```
p_12 → 竞技    → ArenaPanel
-    → 商城    → MallPanel
p_8  → 消息    → MessageListPanel
p_9  → 市场    → MarketPanel
p_10 → 任务    → TaskListPanel
p_11 → 排行    → (开发中)
-    → 帮助    → HelpPanel
```

---

## 全局函数

```typescript
// 在 PopupManager.tsx 中挂载
window.OpenPage(pageId)      // 打开页面 (p_1, p_2, ...)
window.OpenHero()             // 打开武将面板
window.OpenMall()             // 打开商城
window.OpenHelp()             // 打开帮助
window.OpenSignin()           // 打开签到
window.OpenDaily()            // 打开每日任务
window.OpenNotification()    // 打开消息中心
window.OpenBuilding()         // 打开建筑详情
window.OpenBuildingSelect()   // 打开建造面板
```

**使用示例:**
```typescript
// 在 React 组件中
<button onClick={() => window.OpenHero()}>武将</button>

// 或通过 PopupManager
import { popupManager } from './PopupManager';
popupManager.show('hero', '【武将】', <HeroPanel />);
```

---

## 数据库表结构

```sql
-- 用户与城市
characters     -- 玩家角色
cities         -- 城市
buildings      -- 建筑

-- 核心系统
heroes         -- 武将
corps_system   -- 军团
corps_members  -- 军团成员
corps_heroes   -- 军团武将

-- 辅助系统
items          -- 物品
mail           -- 邮件
tasks          -- 任务
```

---

## 测试账号

```
钱包地址: 0x1234567890abcdef1234567890abcdef12345678
签名: test_signature
```

---

## 常用调试

```typescript
// 开启详细日志
// workers/ghost-game/src/index.ts
app.use('*', logger());

// 前端 API 调试
// src/features/webgame/utils/api.ts
const DEBUG_API = true;
if (DEBUG_API) {
  console.log('[API]', url, options);
}
```

---

## 文件位置

```
原始参考:
  jx/BLL/           -- 业务逻辑参考
  jx/Model/         -- 数据模型参考

前端:
  src/features/webgame/
    components/     -- React 组件
    services/       -- API 服务
    hooks/          -- 自定义 Hooks
    utils/          -- 工具函数

后端:
  workers/ghost-game/src/
    routes/         -- API 路由
    types/          -- 类型定义
    utils/          -- 工具函数
```

---

## 错误排查

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| "City not found" | 用户未自动注册 | 确保调用 `/api/game/user-info` |
| "Unauthorized" | 未登录/签名无效 | 检查 X-Wallet-Auth 头 |
| 404 | 端点不存在 | 检查路由拼写 |
| CORS 错误 | 跨域未配置 | 检查 wrangler.toml CORS 设置 |
| 数据 undefined | ⚠️ 字段名不一致 | 对照 api-contract.ts 检查字段名 |
| 参数丢失 | ⚠️ 参数名不一致 | 检查 requestBody 字段名是否匹配 |

---

## 重要文件

| 文件 | 说明 |
|------|------|
| `SKILL.md` | 完整迁移指南 (含接口一致性详细说明) |
| `QUICKREF.md` | 本速查卡 |
| `api-contract.ts` | ⚠️ 前后端接口契约 (字段定义) |

---

## 下一步工作

1. ✅ 基础架构 (认证/自动注册)
2. ✅ 城市系统
3. ✅ 武将系统
4. 🔄 军团系统 (测试中)
5. ⬜ 战斗系统
6. ⬜ 任务系统
7. ⬜ 邮件系统
8. ⬜ 商城/市场
9. ⬜ 排行榜/竞技

状态: ✅ 完成  |  🔄 进行中  |  ⬜ 待开始
