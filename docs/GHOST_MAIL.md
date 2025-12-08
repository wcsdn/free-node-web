# Ghost Mail (幽灵信箱) - 功能文档

## 📮 项目概述

Ghost Mail 是一个基于 Web3 门槛的临时邮箱系统，用于流量变现和拉新。

**核心价值**：
- 💰 **流量变现**：用户需支付 0.001 ETH 或完成拉新任务
- 🔐 **Web3 门槛**：基于钱包地址的唯一身份
- 📧 **临时邮箱**：用于注册、验证码接收等场景
- 🎯 **资源控制**：每用户最多 5 个邮箱，循环使用

## ✅ 实现状态

**已完成**：
- ✅ 完整的前后端实现
- ✅ 配置统一管理 (`src/config/constants.ts`)
- ✅ 链上交易验证（无需 API Key）
- ✅ 拉新任务系统
- ✅ 自动清理 Cron
- ✅ 响应式设计
- ✅ 中英文双语

**部署就绪**：参考 [快速部署指南](../workers/ghost-mail/QUICKSTART.md)

## 🏗 架构设计

### 技术栈

**前端**：
- React + TypeScript
- wagmi + RainbowKit (Web3)
- Vite

**后端**：
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- TypeScript

### 数据流

```
用户 → 连接钱包 → 支付/拉新 → VIP 权限
  ↓
生成邮箱 (7位数字@free-node.xyz)
  ↓
接收邮件 → 存入 D1 数据库
  ↓
前端展示 → 查看验证码
```

## 📊 数据库设计

### users 表 - 用户权限
```sql
address         TEXT PRIMARY KEY  -- 钱包地址
access_level    INTEGER           -- 0:游客, 1:VIP
created_at      INTEGER           -- 创建时间
```

### aliases 表 - 邮箱别名
```sql
alias_name      TEXT PRIMARY KEY  -- 7位数字
owner_address   TEXT              -- 所有者地址
created_at      INTEGER           -- 创建时间
```

### inbox 表 - 收件箱
```sql
id              INTEGER PRIMARY KEY
alias_name      TEXT              -- 接收的别名
sender          TEXT              -- 发件人
subject         TEXT              -- 标题
preview         TEXT              -- 预览
body            TEXT              -- 完整内容
created_at      INTEGER           -- 接收时间
is_read         INTEGER           -- 是否已读
```

## 🔐 业务规则

### 1. 访问控制 (Access Guard)

**游客 (access_level = 0)**：
- ❌ 无法访问 Ghost Mail
- 显示 "ACCESS DENIED" 界面
- 提供两个选项：
  - 支付 0.001 ETH
  - 完成拉新任务

**VIP (access_level = 1)**：
- ✅ 可以使用所有功能
- 生成邮箱
- 接收邮件
- 删除邮箱

### 2. 资源配额 (Resource Quota)

**限制**：
- 每个用户最多 **5 个活跃邮箱**
- 达到上限后必须删除旧邮箱才能生成新邮箱

**循环机制**：
```
生成邮箱 → 使用 → 删除 → 生成新邮箱 → 无限循环
```

### 3. 命名规则 (Naming Rules)

**邮箱格式**：
- 系统生成 **7 位随机数字**
- 例如：`8392011@free-node.xyz`
- 正则验证：`/^\d{7}$/`

**保护机制**：
- 不允许用户自定义邮箱名
- 保留优质域名（英文单词）用于未来销售
- 代码强制正则验证，防止 API 绕过

### 4. 安全措施 (Security)

**唯一 ID**：
- 完全基于钱包地址
- 无法伪造身份

**数据隔离**：
- 用户只能看到自己的邮箱和邮件
- 删除邮箱时级联删除相关邮件

**敏感词过滤**：
- 检测 "公安、网贷、诈骗" 等关键词
- 自动丢弃可疑邮件

## 🎨 前端组件

### AccessGuard (门卫组件)

**职责**：
- 检查钱包连接状态
- 验证 VIP 权限
- 提供升级入口

**状态**：
1. 未连接钱包 → 提示连接
2. 已连接但非 VIP → 显示升级选项
3. 已是 VIP → 放行进入主界面

### MailTerminal (主界面)

**左侧仪表盘**：
- 配额显示：`3 / 5`
- 生成按钮：`[ GENERATE NEW ID ]`
- 邮箱列表：显示所有邮箱，带删除按钮

**右侧邮件流**：
- Matrix 风格滚动列表
- 点击展开查看详情
- 自动刷新（30秒）

### 邮件详情路由管理

**URL 参数控制**：
- 使用 `?mail=<id>` 参数管理邮件详情显示
- 支持浏览器前进/后退
- 点击邮件 → 更新 URL → 显示详情
- 关闭详情 → 清除参数 → 返回列表

**优势**：
- 功能解耦：邮件详情独立于组件状态
- 可分享：可以直接分享邮件详情链接
- 用户体验：支持浏览器导航

### UI 优化

**列表内容截断**：
- 发件人、主题、预览都设置了 `text-overflow: ellipsis`
- 避免长内容撑宽布局
- 点击查看详情才显示完整信息

**邮件详情布局**：
- 使用 `max-height` 而非 `flex: 1` 避免顶部大面积透明占位
- 内容区域独立滚动
- 移动端适配：90vh 最大高度

**共享组件**：
- 统一使用 `Backdrop` 组件
- 删除重复的 backdrop 样式
- 保持视觉一致性

## 🔌 API 接口

### 1. 验证支付
```http
POST /api/auth/verify
Body: { address, txHash }
```

### 2. 生成邮箱
```http
POST /api/alias/generate
Body: { address }
```

### 3. 删除邮箱
```http
DELETE /api/alias/:name
Body: { address }
```

### 4. 获取邮件
```http
GET /api/inbox?address=0x...
```

### 5. 获取状态
```http
GET /api/status?address=0x...
```

## 📱 用户流程

### 首次使用

1. 访问 Ghost Mail 页面
2. 连接 Web3 钱包
3. 看到 "ACCESS DENIED" 提示
4. 选择支付 0.001 ETH 或完成任务
5. 升级为 VIP
6. 进入主界面

### 日常使用

1. 点击 `[ GENERATE NEW ID ]` 生成邮箱
2. 复制邮箱地址：`8392011@free-node.xyz`
3. 用于注册网站、接收验证码
4. 在右侧邮件流查看收到的邮件
5. 点击邮件查看详情
6. 不需要时删除邮箱，释放配额

### 达到上限

1. 已有 5 个邮箱
2. 生成按钮变灰
3. 显示警告：`⚠️ Max limit reached`
4. 删除不需要的旧邮箱
5. 重新生成新邮箱

## 🚀 部署指南

### 后端部署

```bash
cd workers/ghost-mail

# 1. 创建数据库
npm run db:create

# 2. 初始化 Schema
npm run db:init

# 3. 部署 Worker
npm run deploy
```

### 前端集成

```tsx
// 在 App.tsx 中添加路由
import GhostMail from './features/ghost-mail';

// 添加到路由配置
<Route path="/ghost-mail" element={<GhostMail />} />
```

## 📈 商业模式

### 收入来源

1. **直接付费**：
   - 0.001 ETH / 用户
   - 假设 1000 用户 = 1 ETH

2. **拉新任务**：
   - 用户完成交易所注册
   - 获得返佣

3. **优质域名销售**：
   - 保留的英文单词邮箱
   - 未来高价出售

### 成本控制

- Cloudflare Workers：免费额度 100,000 请求/天
- D1 数据库：免费额度 5GB
- 域名：$10/年

## 🔮 未来规划

### Phase 1 (已完成)
- ✅ 基础架构
- ✅ 前端组件
- ✅ API 服务
- ✅ 数据库设计

### Phase 2 (待实现)
- [ ] 邮件接收 Worker
- [ ] Cloudflare Email Routing 集成
- [ ] 敏感词过滤
- [ ] 链上交易验证

### Phase 3 (未来)
- [ ] 自动清理旧邮件 (Cron)
- [ ] 邮件转发功能
- [ ] 邮件搜索
- [ ] 邮件标签
- [ ] 移动端 App

## 🐛 已知问题

- [ ] 邮件接收功能未实现（需要 Email Routing）
- [ ] 链上交易验证未实现（需要 Etherscan API）
- [ ] 拉新任务链接待配置

## 📚 相关文档

- [后端 API 文档](../workers/ghost-mail/README.md)
- [数据库 Schema](../workers/ghost-mail/schema.sql)
- [类型定义](../src/types/ghost-mail.ts)

---

**创建时间**：2024-12-06
**状态**：✅ 核心功能已完成
**下一步**：实现邮件接收 Worker
