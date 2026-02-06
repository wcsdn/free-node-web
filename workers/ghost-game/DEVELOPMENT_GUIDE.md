# Free-Node 游戏迁移项目 - 开发规范

## 📋 每次新 Session 必须做的检查

### 1. 必读文件 (按顺序)
```
1. memory/YYYY-MM-DD.md    # 前一天的工作记录
2. MEMORY.md              # 长期记忆 (如果是主会话)
3. PROJECT_STATUS.md      # 项目进度
4.jx/BLL/                # 相关功能的原项目逻辑
5. jx/Model/             # 原项目数据结构
```

### 2. 环境检查
```bash
# 确保后端运行
cd workers/ghost-game
npm run dev

# 确保前端运行 (另一个终端)
cd E:\workSpace\free-node-web
npm run dev
```

### 3. 数据库初始化 (首次/表结构变更时)
```bash
cd workers/ghost-game
npm run db:init:local    # 本地数据库
npm run db:init           # 远程数据库
```

---

## 🎯 功能开发流程

### 第一步：阅读原项目逻辑 ，防止和新页面 接口名称、参数数量、字段名称不一致的问题
```
1. jx/BLL/[功能名].cs     # 业务逻辑
2. jx/Model/[功能名]Info.cs  # 数据模型
3. jx/DAL/[功能名]Access.cs  # 数据访问
4. jx/Web/               # 前端页面参考
```

### 第二步：检查现有代码
```
1. workers/ghost-game/src/routes/     # 现有 API
2. workers/ghost-game/src/config/     # 配置文件
3. src/features/webgame/components/    # 现有 UI
4. src/features/webgame/services/api/ # API 调用
```

### 第三步：实现顺序
```
1. 数据库 Schema (如果需要新表)
   - 检查 schema.sql 是否需要添加表
   - 运行 db:init 更新数据库

2. 后端 API
   - 在 routes/ 下创建/修改 .ts 文件
   - 实现 CRUD 操作
   - 在 index.ts 注册路由

3. 前端 API 服务
   - 在 services/api/ 下创建 .ts
   - 定义接口类型

4. 前端 UI 组件
   - 在 components/ 下创建/修改 .tsx
   - 使用现有的 PopupManager 或创建新弹窗

5. 测试
   - 刷新浏览器测试
   - 检查浏览器控制台错误
```

---

## 🔧 常见问题处理

### D1 数据库表不存在
```bash
# 重新初始化
npm run db:init:local
```

### wrangler dev 崩溃
```bash
# 杀掉旧进程，重新启动
taskkill /F /PID <pid>
npm run dev
```

### 热重载不生效
```bash
# 重新运行 build
cd workers/ghost-game
npm run build
```

### 认证失败
- 检查 X-Wallet-Auth 头格式：`地址:签名`
- 验证地址长度：42 字符，0x 开头
- 确保数据库中有对应记录

---

## 📁 目录结构速查

```
jx/                           # 原项目 (C# ASP.NET)
  BLL/                       # 业务逻辑
  Model/                     # 数据模型
  DAL/                       # 数据访问
  Web/                       # 前端页面

workers/ghost-game/          # 游戏后端 (Cloudflare Workers)
  src/
    routes/                  # API 路由
    config/                  # JSON 配置文件
    models/                  # 数据模型
    utils/                   # 工具函数
  schema.sql                 # 数据库 Schema
  wrangler.toml              # Cloudflare 配置

src/features/webgame/        # 游戏前端 (React)
  components/                # UI 组件
  services/api/              # API 调用
  hooks/                     # React Hooks
  stores/                    # Zustand 状态
  styles/                    # 样式文件
```

---

## 🚀 快速启动命令

```bash
# 1. 启动后端
cd workers/ghost-game
npm run dev

# 2. 启动前端 (另一个终端)
cd E:\workSpace\free-node-web
npm run dev

# 3. 测试地址
# 前端: http://localhost:5174/jxweb-test
# 后端: http://localhost:8788
```

---

## 📝 记录规范

### 每次修改后
- 更新 memory/YYYY-MM-DD.md
- 如果是重大进展，更新 PROJECT_STATUS.md

### Bug 修复记录
```markdown
## Bug: [标题]
- 原因: [分析]
- 解决: [方法]
- 预防: [如何避免再次发生]
```

### 新功能记录
```markdown
## 新功能: [功能名]
- 原项目参考: jx/BLL/[功能名].cs
- API 端点: /api/[功能名]/
- UI 组件: components/[功能名]Panel.tsx
```
