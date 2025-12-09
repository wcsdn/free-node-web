-- Ghost Mail Database Schema
-- Cloudflare D1 Database

-- 1. 用户表 (权限控制)
CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY,       -- 钱包地址 (0x...)
  access_level INTEGER DEFAULT 0, -- 0:游客, 1:VIP(已付费/已拉新)
  created_at INTEGER NOT NULL     -- 创建时间戳
);

-- 2. 邮箱别名表 (资源配额)
-- 记录谁拥有哪个邮箱，比如 '8392011' 属于 '0xABC...'
CREATE TABLE IF NOT EXISTS aliases (
  alias_name TEXT PRIMARY KEY,    -- 7位数字 (如 '8392011')
  owner_address TEXT NOT NULL,    -- 关联 users.address
  created_at INTEGER NOT NULL,    -- 创建时间戳
  FOREIGN KEY (owner_address) REFERENCES users(address) ON DELETE CASCADE
);

-- 3. 邮件内容表 (收件箱)
CREATE TABLE IF NOT EXISTS inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias_name TEXT NOT NULL,       -- 接收的别名
  sender TEXT NOT NULL,           -- 发件人
  subject TEXT NOT NULL,          -- 标题
  preview TEXT NOT NULL,          -- 预览文字
  body TEXT NOT NULL,             -- 完整内容
  created_at INTEGER NOT NULL,    -- 接收时间戳
  is_read INTEGER DEFAULT 0,      -- 是否已读 (0:未读, 1:已读)
  FOREIGN KEY (alias_name) REFERENCES aliases(alias_name) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_owner ON aliases(owner_address);
CREATE INDEX IF NOT EXISTS idx_inbox_alias ON inbox(alias_name);
CREATE INDEX IF NOT EXISTS idx_inbox_created ON inbox(created_at);
CREATE INDEX IF NOT EXISTS idx_users_access ON users(access_level);

-- 初始化说明
-- 使用 Wrangler 创建数据库:
-- npx wrangler d1 create ghost-mail-db
-- 
-- 执行 Schema:
-- npx wrangler d1 execute ghost-mail-db --file=./schema.sql
--
-- 本地开发:
-- npx wrangler d1 execute ghost-mail-db --local --file=./schema.sql
