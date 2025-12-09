# 🚀 Ghost Mail 快速部署指南

## ⚡ 5分钟快速部署

### 1️⃣ 安装依赖
```bash
cd server/ghost-mail
npm install
```

### 2️⃣ 创建数据库
```bash
# 创建 D1 数据库
npm run db:create

# 输出示例：
# ✅ Successfully created DB 'ghost-mail-db'
# 📋 database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3️⃣ 更新配置
编辑 `wrangler.toml`，填入上一步获得的 `database_id`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "ghost-mail-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 👈 填入这里
```

### 4️⃣ 初始化数据库
```bash
npm run db:init
```

### 5️⃣ 部署到 Cloudflare
```bash
npm run deploy
```

## 📧 配置邮件路由

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择域名 → Email Routing
3. 添加 Catch-all 规则：
   - Action: Send to Worker
   - Worker: `ghost-mail-api`

## 🌐 配置自定义域名（可选）

1. Workers & Pages → `ghost-mail-api`
2. Settings → Triggers
3. Add Custom Domain: `ghost-mail-api.free-node.xyz`

## 🧪 测试验证

### 测试 API
```bash
# 1. 获取任务列表
curl https://ghost-mail-api.free-node.xyz/api/tasks

# 2. 获取用户状态
curl "https://ghost-mail-api.free-node.xyz/api/status?address=0xYourAddress"
```

### 测试邮件接收
1. 发送测试邮件到：`1234567@free-node.xyz`
2. 查看日志：
```bash
npm run logs
```

## 📊 查看日志
```bash
# 实时日志
npm run logs

# 查看最近 100 条
npm run logs -- --lines 100
```

## 🔧 常用命令

```bash
# 本地开发
npm run dev

# 部署
npm run deploy

# 查看日志
npm run logs

# 数据库操作
npm run db:create    # 创建数据库
npm run db:init      # 初始化表结构
npm run db:query     # 执行 SQL 查询
```

## ✅ 部署检查清单

- [ ] 安装依赖 (`npm install`)
- [ ] 创建 D1 数据库 (`npm run db:create`)
- [ ] 更新 `wrangler.toml` 中的 `database_id`
- [ ] 初始化数据库 (`npm run db:init`)
- [ ] 部署 Worker (`npm run deploy`)
- [ ] 配置邮件路由（Catch-all → Worker）
- [ ] 测试 API 端点
- [ ] 发送测试邮件验证

## 🎯 下一步

部署完成后，前端会自动连接到 Worker API。用户可以：

1. 连接钱包
2. 支付 0.001 ETH 或完成任务获取 VIP
3. 生成 7 位数字邮箱别名
4. 接收和查看邮件

## 📚 更多文档

- [完整部署文档](./DEPLOYMENT.md)
- [架构说明](./README.md)
- [前端文档](../../docs/GHOST_MAIL.md)
