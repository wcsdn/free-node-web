# Changelog - JxWeb

## 2026-02-10

### 🔐 Security - 安全增强
- **auth.ts** - 增强版认证中间件
  - EIP-191 签名验证支持
  - 详细的错误码返回 (AUTH_REQUIRED, INVALID_ADDRESS, INVALID_SIGNATURE)
  - 开发模式兼容 (`test_signature`)
  - `verifyWalletAuthDetailed()` 详细验证函数

- **signature.ts** (NEW) - 签名验证工具
  - EIP-191 签名验证
  - nonce 防重放攻击保护
  - 时间戳校验
  - `verifyTestSignature()` 简化验证

- **audit.ts** (NEW) - 审计日志中间件
  - 请求审计日志
  - KV 存储支持
  - 安全事件追踪

### 🔄 Refactoring - 路由重构
- **game.ts** - 精简 358 行 → 使用 Service 层
- **corps.ts** - 重构 585 行 → 简化逻辑
- **task.ts** - 重构 412 行 → 统一错误处理
- **city.ts** - 重构 210 行 → 提取通用函数
- **battle.ts** - 增强战斗路由功能
- **hero.ts** - 简化武将操作逻辑

### ✨ New Features - 新增功能
- **city-interior.ts** - 繁荣度系统 API
- **item.ts** - 物品操作完整功能
- **map.ts** - 地图系统 API
- **skill.ts** - 技能系统 API

### 📝 Documentation - 文档更新
- **MIGRATION_TASKS.md** - 状态总览更新 (71% 完成)
- **api-contract.ts** - 新增 10+ 类型定义
  - Dungeon/DungeonStage/DungeonEnemy
  - Activity/FestivalActivity/GameEvent
  - MapUnit/DefenseBuilding/Technic
  - Guild/FeishuUserInfo

---

## 2026-02-09

### 🏗️ Core - 核心架构
- 基础架构完成 (认证、自动注册)
- Service/Repository 层完整实现
- 34 个 API 路由全部就绪

### 🎮 Systems - 已完成系统
| 模块 | 状态 | 说明 |
|------|------|------|
| Hero | ✅ | 武将招募、训练、升级 |
| Building | ✅ | 建筑建造、升级 |
| Fight | ✅ | PVE 战斗 v2.0 |
| User | ✅ | 用户认证、数据 |
| CityRes | ✅ | 城市资源 |
| Mail | ✅ | 邮件系统 + 附件 |
| Mission | ✅ | 日常任务系统 |
| Task | ✅ | 主线任务系统 |
| PersistEffect | ✅ | 持久效果/BUFF |
| Item | ✅ | 物品系统 |
| Skill | ✅ | 技能组合+冷却 |
| BattleEngine | ✅ | 战斗引擎核心 |
| Arena | ✅ | 竞技场系统 |
| Corps | ✅ | 军团系统 v2.0 |
| Defence | ✅ | 防御系统 |
| Chat | ✅ | 聊天系统 |
| Market | ✅ | 市场系统 |
| Shop | ✅ | 商店系统 |
| Signin | ✅ | 签到系统 |

---

## 项目结构

```
free-node-web/
├── src/features/webgame/          # React 前端
│   ├── components/                # UI 组件
│   ├── services/gameApi.ts         # API 服务
│   └── types/api-contract.ts      # 接口契约 ⭐
├── workers/ghost-game/            # Cloudflare Workers 后端
│   ├── src/
│   │   ├── routes/                # 34 个 API 路由
│   │   ├── services/              # 业务逻辑层
│   │   ├── repositories/          # 数据访问层
│   │   ├── utils/                # 工具函数
│   │   └── config/               # 静态配置
│   └── schema.sql                 # 数据库 schema (40 表)
├── SKILL.md                       # 迁移技能指南
├── QUICKREF.md                    # 开发速查卡
└── MEMORY.md                      # 长期记忆
```

---

## API 端点 (34 个)

| 模块 | 端点 | 状态 |
|------|------|------|
| Game | `/api/game/*` | ✅ |
| City | `/api/game/city/*` | ✅ |
| Hero | `/api/game/hero/*` | ✅ |
| Corps | `/api/corps/*` | ✅ |
| Battle | `/api/battle/*` | ✅ |
| Task | `/api/task/*` | ✅ |
| Shop | `/api/shop/*` | ✅ |
| Market | `/api/market/*` | ✅ |
| Mail | `/api/mail/*` | ✅ |
| Rank | `/api/rank/*` | ✅ |
| Arena | `/api/arena/*` | ✅ |
| Skill | `/api/skill/*` | ✅ |
| Tech | `/api/tech/*` | ✅ |
| Signin | `/api/signin/*` | ✅ |
| ... | 其他 | ✅ |

---

## 本地开发

```bash
# 前端
npm run dev  # http://localhost:5174/jxweb-test

# 后端
cd workers/ghost-game
npm run dev  # http://localhost:8788

# 数据库
npm run db:init:local
```
