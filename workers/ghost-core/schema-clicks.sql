-- 交易所点击埋点表
CREATE TABLE IF NOT EXISTS exchange_clicks (
  id TEXT PRIMARY KEY,
  exchange_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  referer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  ip_hash TEXT,
  ua_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_exchange_clicks_created_at
  ON exchange_clicks(created_at);

CREATE INDEX IF NOT EXISTS idx_exchange_clicks_exchange_id
  ON exchange_clicks(exchange_id);
