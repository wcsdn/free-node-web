-- ============================================
-- 交易所活动与访问统计 Schema
-- ============================================

-- 交易所活动表
CREATE TABLE IF NOT EXISTS exchange_activities (
  id TEXT PRIMARY KEY,                -- 活动ID (UUID)
  exchange TEXT NOT NULL,             -- 交易所: binance/okx/bybit/bitget/gate
  title TEXT NOT NULL,                -- 活动标题 (英文)
  title_cn TEXT,                      -- 活动标题 (中文)
  url TEXT NOT NULL,                  -- 活动链接
  type TEXT DEFAULT 'other',          -- 类型: airdrop/bonus/competition/other
  end_time TEXT,                      -- 截止时间 (ISO 8601)
  is_active INTEGER DEFAULT 1,        -- 是否有效
  created_at INTEGER DEFAULT (unixepoch())
);

-- 页面访问统计表
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,                 -- 页面路径: /exchanges, /home, etc
  date TEXT NOT NULL,                 -- 日期 YYYY-MM-DD
  count INTEGER DEFAULT 0,            -- 访问次数
  UNIQUE(page, date)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_activities_exchange ON exchange_activities(exchange);
CREATE INDEX IF NOT EXISTS idx_activities_type ON exchange_activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_active ON exchange_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_pageviews_page ON page_views(page);
CREATE INDEX IF NOT EXISTS idx_pageviews_date ON page_views(date);

-- ============================================
-- 示例活动数据 (可选)
-- ============================================

-- INSERT OR IGNORE INTO exchange_activities (id, exchange, title, title_cn, url, type, end_time) VALUES
-- ('demo-1', 'binance', 'New User Welcome Bonus', '新用户注册奖励', 'https://www.binance.com/activity/xxx', 'bonus', '2025-01-31'),
-- ('demo-2', 'okx', 'Trading Competition', '交易大赛', 'https://www.okx.com/activity/xxx', 'competition', '2025-01-15');
