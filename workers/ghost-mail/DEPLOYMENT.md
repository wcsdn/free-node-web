# Ghost Mail 部署指南

## 📋 部署清单

### 1. 准备工作

#### 1.1 安装依赖
```bash
cd server/ghost-mail
npm install
```

#### 1.2 创建 D1 数据库
```bash
npm run db:create
```

记录返回的 `database_id`，例如：
```
✅ Successfully created DB 'ghost-mail-db'
📋 Database ID: abc123def456ghi789
```

#### 1.3 更新配置
编辑 `wrangler.toml`，填入 `database_id`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "ghost-mail-db"
database_id = "abc123def456ghi789"  # 填入你的 database_id
```

#### 1.4 初始化数据库
```bash
npm run db:init
```

### 2. 配置环境变量

#### 2.1 验证收款地址
确认 `wrangler.toml` 中的 `TREASURY_ADDRESS` 是你的钱包地址：
```toml
[vars]
TREASURY_ADDRESS = "0xYourWalletAddress"
```

### 3. 配置邮件路由

#### 3.1 在 Cloudflare Dashboard 配置

1. 登录 Cloudflare Dashboard
2. 选择你的域名 `free-node.xyz`
3. 进入 **Email** → **Email Routing**
4. 点击 **Routing Rules**
5. 添加规则：
   - **Catch-all address**: `*@free-node.xyz`
   - **Action**: Send to Worker
   - **Worker**: `ghost-mail-api`

#### 3.2 验证邮件路由
发送测试邮件到任意地址（如 `test@free-node.xyz`），检查 Worker 日志：
```bash
npm run tail
```

### 4. 部署到生产

```bash
npm run deploy
```

部署成功后会显示：
```
✨ Deployment complete!
🌍 https://ghost-mail-api.YOUR-SUBDOMAIN.workers.dev
```

### 5. 配置自定义域名（可选）

在 Cloudflare Dashboard：
1. Workers & Pages → ghost-mail-api
2. Settings → Triggers
3. Add Custom Domain: `ghost-mail-api.free-node.xyz`

## 🧪 测试

### 测试 API 端点

```bash
# 1. 获取任务列表
curl https://ghost-mail-api.free-node.xyz/api/tasks

# 2. 获取用户状态
curl "https://ghost-mail-api.free-node.xyz/api/status?address=0xYourAddress"

# 3. 生成邮箱（需要 VIP）
curl -X POST https://ghost-mail-api.free-node.xyz/api/alias/generate \
  -H "Content-Type: application/json" \
  -d '{"address":"0xYourAddress"}'
```

### 测试邮件接收

1. 先生成一个邮箱别名（如 `8392011`）
2. 发送测试邮件到 `8392011@free-node.xyz`
3. 查看收件箱：
```bash
curl "https://ghost-mail-api.free-node.xyz/api/inbox?address=0xYourAddress"
```

### 测试定时清理

手动触发（仅用于测试）：
```bash
# 在 Cloudflare Dashboard 中手动触发 Cron
# Workers & Pages → ghost-mail-api → Triggers → Cron Triggers → Test
```

## 🔧 配置拉新链接

编辑 `src/config/referral.ts`，替换为你的返佣链接：

```typescript
export const referralTasks: ReferralTask[] = [
  {
    id: 'task_vultr',
    url: 'https://www.vultr.com/?ref=YOUR_ACTUAL_CODE', // 替换这里
    // ...
  },
  // ...
];
```

修改后重新部署：
```bash
npm run deploy
```

## 📊 监控和维护

### 查看实时日志
```bash
npm run tail
```

### 查看数据库数据
```bash
# 查看用户
npx wrangler d1 execute ghost-mail-db --command "SELECT * FROM users LIMIT 10"

# 查看邮箱
npx wrangler d1 execute ghost-mail-db --command "SELECT * FROM aliases LIMIT 10"

# 查看邮件
npx wrangler d1 execute ghost-mail-db --command "SELECT * FROM inbox ORDER BY created_at DESC LIMIT 10"
```

### 查看 Cron 执行记录
在 Cloudflare Dashboard：
- Workers & Pages → ghost-mail-api → Logs

## 🚨 故障排查

### 问题 1: 邮件收不到
**检查**：
1. Email Routing 是否正确配置
2. Worker 是否正确绑定
3. 查看 Worker 日志是否有错误

**解决**：
```bash
npm run tail
# 发送测试邮件，观察日志
```

### 问题 2: 交易验证失败
**检查**：
1. TREASURY_ADDRESS 是否正确
2. 交易是否在 Base 链上
3. 交易金额是否 >= 0.001 ETH

**解决**：
查看 Worker 日志，检查详细错误信息：
```bash
npm run logs
```

### 问题 3: Cron 不执行
**检查**：
1. wrangler.toml 中是否配置了 crons
2. Worker 是否部署成功

**解决**：
在 Dashboard 手动触发测试，查看日志。

## 📝 环境变量清单

| 变量名 | 类型 | 说明 | 设置方式 |
|--------|------|------|----------|
| DB | Binding | D1 数据库 | wrangler.toml |
| TREASURY_ADDRESS | Var | 收款地址 | wrangler.toml |
| MAX_ALIASES | Var | 最大邮箱数 | wrangler.toml |
| DOMAIN | Var | 域名 | wrangler.toml |

**注意**：使用 Base RPC 验证交易，无需 API Key！

## 🔄 更新流程

### 更新代码
```bash
git pull
cd server/ghost-mail
npm install
npm run deploy
```

### 更新数据库 Schema
```bash
# 1. 修改 schema.sql
# 2. 执行更新
npx wrangler d1 execute ghost-mail-db --file=./schema.sql
```

### 更新拉新链接
```bash
# 1. 修改 src/config/referral.ts
# 2. 重新部署
npm run deploy
```

## 📈 性能优化

### D1 数据库
- 定期清理旧邮件（已自动化）
- 监控数据库大小
- 必要时增加索引

### Worker
- 监控请求量
- 优化查询语句
- 使用缓存（如需要）

---

**部署完成后记得测试所有功能！** ✅
