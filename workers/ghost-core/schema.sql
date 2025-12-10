-- ============================================
-- Ghost Core Database Schema
-- Project Hierarchy - 中央用户分级系统
-- ============================================

-- Users 表: 用户核心数据
CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY,           -- 钱包地址 (0x...)
  level INTEGER DEFAULT 1,            -- 0=Wanderer, 1=Awakened, 2=The One
  invite_code TEXT UNIQUE,            -- 专属邀请码
  invited_by TEXT,                    -- 邀请人的邀请码
  mail_quota INTEGER DEFAULT 5,       -- 邮箱别名额度 (上限 20)
  referral_count INTEGER DEFAULT 0,   -- 推荐人数 (任务统计)
  balance INTEGER DEFAULT 0,          -- 余额 (单位: 分)
  created_at INTEGER DEFAULT (unixepoch())
);

-- Daily Usage 表: 每日用量统计
CREATE TABLE IF NOT EXISTS daily_usage (
  identifier TEXT NOT NULL,           -- 钱包地址 OR IP地址 (ip:x.x.x.x)
  date TEXT NOT NULL,                 -- 日期 "YYYY-MM-DD"
  ai_count INTEGER DEFAULT 0,         -- AI 调用次数
  mail_count INTEGER DEFAULT 0,       -- 邮箱操作次数
  PRIMARY KEY (identifier, date)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_usage_date ON daily_usage(date);
