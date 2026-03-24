# 项目结构文档

## 📁 目录结构

```
free-node-web/                          # 项目根目录
├── jx/                                  # 原版C# ASP.NET项目（参考）
│   ├── BLL/                            # 业务逻辑层
│   ├── DAL/                            # 数据访问层
│   ├── Model/                           # 数据模型
│   ├── Web/                             # Web层（ASPX + AjaxPro）
│   │   ├── Main.aspx.cs                 # 主API入口
│   │   └── App_Data/CN/               # 游戏配置文件（XML）
│   └── DB/                              # 数据库建表脚本
│
├── workers/                             # Cloudflare Workers后端
│   └── ghost-game/                      # 游戏后端（重点）
│       ├── src/
│       │   ├── routes/                  # API路由
│       │   │   ├── game.ts             # /api/game/* (自动注册)
│       │   │   ├── building.ts         # /api/building/*
│       │   │   ├── hero.ts            # /api/hero/*
│       │   │   ├── battle.ts          # /api/battle/*
│       │   │   ├── task.ts            # /api/task/*
│       │   │   └── ...
│       │   ├── services/               # 业务逻辑
│       │   │   ├── task.service.ts    # 任务系统（对齐C# TaskBLL）
│       │   │   ├── fight.svc.ts       # 战斗系统
│       │   │   └── ...
│       │   ├── config/                  # 配置文件（JSON + TS工具）
│       │   │   ├── tasks.json         # 任务配置（95个主线任务）
│       │   │   ├── tasks.ts           # 任务配置工具函数
│       │   │   ├── heroes.json        # 武将配置
│       │   │   ├── items.json         # 物品配置
│       │   │   ├── buildings.json      # 建筑配置
│       │   │   ├── technics.json      # 科技配置
│       │   │   ├── skills.json        # 技能配置
│       │   │   ├── effects.json       # 效果配置
│       │   │   ├── missions_by_level.json  # 战役任务配置
│       │   │   └── mission_conditions.json # 战役条件配置
│       │   ├── types/                  # TypeScript类型
│       │   └── index.ts               # 入口文件
│       ├── migrations/
│       │   ├── 000_schema.sql         # 主建表脚本（唯一真相）
│       │   ├── 001_initial.sql        # 附加表
│       │   └── CSharp_Original_Schema.sql  # C#原版建库脚本（参考）
│       └── wrangler.toml
│
├── public/jx-web/                      # 前端（jQuery版游戏）
│   └── Js/
│       ├── api-config.js              # API端点配置
│       ├── api-adapter-v2.js          # API适配器
│       ├── Teacher.js                  # 地图/大地图
│       ├── Hero.js                    # 武将
│       ├── Building.js                # 建筑
│       ├── Battle.js                  # 战斗
│       ├── Task.js                    # 任务
│       └── ...
│
├── src/features/webgame/              # 前端（React版，备用）
│
├── docs/                               # 项目文档
│   ├── USER_REGISTRATION_FLOW.md     # 用户注册流程（重要）
│   ├── GAME_ARCHITECTURE.md          # 游戏架构
│   └── ...
│
└── memory/                             # AI记忆
    └── YYYY-MM-DD.md                 # 每日会话记录
```

## 🎯 核心原则

### 前后端分离
- **前端**（jx-web）：原生jQuery，不改变
- **后端**（ghost-game Workers）：Hono框架，复刻C#逻辑

### 前端是真理
前端JS按C#返回格式写的，后端必须对齐C#格式，而不是改前端。

### 配置优先
- 所有游戏配置（任务、武将、物品等）都在 `workers/ghost-game/src/config/`
- **不要从XML解析**，直接import JSON使用
- 配置已导出JS工具函数（如 `getTaskConfig(taskId)`）

### 数据库
- **主建表脚本**：`workers/ghost-game/migrations/000_schema.sql`（唯一真相）
- **本地数据库**：`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`
- **重要**：删除 `.wrangler/` 会重建空数据库

## 🔑 关键文件索引

| 文件 | 用途 |
|------|------|
| `jx/BLL/Task.cs` | 任务系统C#原版（任务逻辑参考） |
| `jx/BLL/User.cs` | 用户注册C#原版（注册流程参考） |
| `workers/ghost-game/src/config/tasks.ts` | 任务配置工具 |
| `workers/ghost-game/src/routes/game.ts` | 注册入口（initializeNewUser） |
| `workers/ghost-game/src/services/task.service.ts` | 任务服务层 |
| `public/jx-web/Js/api-config.js` | 前端API端点配置 |

## 📦 Workers 游戏服务

**端口**：本地 8788，生产 `game.free-node.xyz`

### 常用命令
```bash
cd workers/ghost-game

# 编译
npx tsc

# 重启
pkill -f wrangler; wrangler dev --port 8788

# 查本地数据库
sqlite3 .wrangler/state/v3/d1/*/miniflare-D1DatabaseObject/*.sqlite

# 初始化数据库
npx wrangler d1 execute ghost-game-db --local --file=migrations/000_schema.sql
```

### 测试钱包
```
地址：0x1234567890abcdef1234567890abcdef12345678
签名：test_signature
```

## 📚 相关文档

- [用户注册流程](./USER_REGISTRATION_FLOW.md) — 新用户初始化完整流程
- [游戏架构](./GAME_ARCHITECTURE.md) — 游戏系统架构
