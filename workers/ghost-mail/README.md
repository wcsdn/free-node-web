# Ghost Mail API - 幽灵信箱后端服务

## 项目简介

Ghost Mail 是一个基于 Web3 门槛的临时邮箱系统，用于流量变现和拉新。

**核心特性**：
- 🔐 Web3 钱包登录
- 💎 付费或拉新解锁 VIP
- 📧 每个用户最多 5 个活跃邮箱
- 🔄 删除旧邮箱才能生成新邮箱
- 🎲 系统生成 7 位随机数字邮箱

## 技术栈

- **运行环境**：Cloudflare Workers
- **数据库**：Cloudflare D1 (SQLite)
- **语言**：TypeScript
- **工具**：Wrangler 4

## 快速开始

### 1. 安装依赖

```bash
cd server/ghost-mail
npm install
```

### 2. 创建 D1 数据库

```bash
npm run db:create
```

记录返回的 `database_id`，填入 `wrangler.toml` 的 `database_id` 字段。

### 3. 初始化数据库

```bash
# 生产环境
npm run db:init

# 本地开发
npm run db:init:local
```

### 4. 本地开发

```bash
npm run dev
```

访问 http://localhost:8787

### 5. 部署到生产

```bash
npm run deploy
```

## API 文档

### 基础信息

- **Base URL**: `https://ghost-mail-api.free-node.xyz`
- **CORS**: 允许所有来源

### 端点列表

#### 1. 验证支付 - 升级 VIP

```http
POST /api/auth/verify
Content-Type: application/json

{
  "address": "0x...",
  "txHash": "0x..."
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "isVIP": true
  }
}
```

#### 2. 生成邮箱别名

```http
POST /api/alias/generate
Content-Type: application/json

{
  "address": "0x..."
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "alias": {
      "alias_name": "8392011",
      "owner_address": "0x...",
      "created_at": 1701234567890
    }
  }
}
```

**错误响应**：
```json
{
  "success": false,
  "error": "Max limit reached (5). Delete old emails to create new ones."
}
```

#### 3. 删除邮箱别名

```http
DELETE /api/alias/:alias_name
Content-Type: application/json

{
  "address": "0x..."
}
```

**响应**：
```json
{
  "success": true
}
```

#### 4. 获取收件箱

```http
GET /api/inbox?address=0x...
```

**响应**：
```json
{
  "success": true,
  "data": {
    "mails": [
      {
        "id": 1,
        "alias_name": "8392011",
        "sender": "noreply@example.com",
        "subject": "Welcome",
        "preview": "Thank you for signing up...",
        "body": "Full email content...",
        "created_at": 1701234567890,
        "is_read": 0
      }
    ],
    "total": 1
  }
}
```

#### 5. 获取用户状态

```http
GET /api/status?address=0x...
```

**响应**：
```json
{
  "success": true,
  "data": {
    "isVIP": true,
    "activeSlots": 3,
    "maxSlots": 5,
    "aliases": [
      {
        "alias_name": "8392011",
        "owner_address": "0x...",
        "created_at": 1701234567890
      }
    ]
  }
}
```

## 数据库 Schema

### users 表
```sql
CREATE TABLE users (
  address TEXT PRIMARY KEY,
  access_level INTEGER DEFAULT 0,
  created_at INTEGER
);
```

### aliases 表
```sql
CREATE TABLE aliases (
  alias_name TEXT PRIMARY KEY,
  owner_address TEXT,
  created_at INTEGER,
  FOREIGN KEY (owner_address) REFERENCES users(address)
);
```

### inbox 表
```sql
CREATE TABLE inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias_name TEXT,
  sender TEXT,
  subject TEXT,
  preview TEXT,
  body TEXT,
  created_at INTEGER,
  is_read INTEGER DEFAULT 0,
  FOREIGN KEY (alias_name) REFERENCES aliases(alias_name)
);
```

## 业务规则

### 访问控制
- `access_level = 0`: 游客，无法使用
- `access_level = 1`: VIP，可以使用

### 资源配额
- 每个用户最多 **5 个活跃邮箱**
- 必须删除旧邮箱才能生成新邮箱

### 命名规则
- 邮箱别名：**7 位随机数字** (如 `8392011`)
- 正则验证：`/^\d{7}$/`
- 完整邮箱：`8392011@free-node.xyz`

### 安全措施
- 所有操作基于钱包地址验证
- 删除邮箱时级联删除相关邮件
- 敏感词过滤（待实现）

## 开发命令

```bash
# 本地开发
npm run dev

# 部署到生产
npm run deploy

# 创建数据库
npm run db:create

# 初始化 Schema（生产）
npm run db:init

# 初始化 Schema（本地）
npm run db:init:local
```

## 数据库管理

### 查看数据

```bash
# 查看所有用户
npx wrangler d1 execute ghost-mail-db --command "SELECT * FROM users"

# 查看所有别名
npx wrangler d1 execute ghost-mail-db --command "SELECT * FROM aliases"

# 查看所有邮件
npx wrangler d1 execute ghost-mail-db --command "SELECT * FROM inbox"
```

### 清空数据

```bash
# 清空所有表
npx wrangler d1 execute ghost-mail-db --command "DELETE FROM inbox"
npx wrangler d1 execute ghost-mail-db --command "DELETE FROM aliases"
npx wrangler d1 execute ghost-mail-db --command "DELETE FROM users"
```

## 监控和日志

### 查看实时日志

```bash
npx wrangler tail
```

### 查看部署状态

```bash
npx wrangler deployments list
```

## 待实现功能

- [ ] 邮件接收 Worker (Email Handler)
- [ ] 敏感词过滤
- [ ] 自动清理旧邮件 (Cron Trigger)
- [ ] 链上交易验证
- [ ] 速率限制
- [ ] 邮件已读状态更新

## 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
MAX_ALIASES = "5"
DOMAIN = "free-node.xyz"
```

## 故障排查

### 问题：数据库连接失败
**解决**：检查 `wrangler.toml` 中的 `database_id` 是否正确。

### 问题：CORS 错误
**解决**：确保所有响应都包含 CORS 头。

### 问题：别名生成失败
**解决**：检查用户是否已达到 5 个邮箱上限。

---

**最后更新**：2024-12-06
**维护者**：free-node.xyz
