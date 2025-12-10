-- ============================================
-- 任务与成就系统 Schema
-- ============================================

-- 任务定义表 (静态配置)
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,                -- 任务ID (如 'daily_checkin', 'invite_5')
  type TEXT NOT NULL,                 -- 类型: daily(每日), growth(成长), special(特殊)
  name_zh TEXT NOT NULL,              -- 中文名称
  name_en TEXT NOT NULL,              -- 英文名称
  desc_zh TEXT,                       -- 中文描述
  desc_en TEXT,                       -- 英文描述
  icon TEXT,                          -- 图标 emoji
  target INTEGER DEFAULT 1,           -- 目标值 (如邀请5人则为5)
  reward_type TEXT,                   -- 奖励类型: xp, mail_quota, badge
  reward_value INTEGER DEFAULT 0,     -- 奖励数值
  reward_badge TEXT,                  -- 奖励徽章ID (如果有)
  sort_order INTEGER DEFAULT 0,       -- 排序
  is_active INTEGER DEFAULT 1         -- 是否启用
);

-- 用户任务进度表
CREATE TABLE IF NOT EXISTS user_quests (
  address TEXT NOT NULL,              -- 用户钱包地址
  quest_id TEXT NOT NULL,             -- 任务ID
  progress INTEGER DEFAULT 0,         -- 当前进度
  completed INTEGER DEFAULT 0,        -- 是否完成 (0/1)
  claimed INTEGER DEFAULT 0,          -- 是否领取奖励 (0/1)
  completed_at INTEGER,               -- 完成时间戳
  reset_date TEXT,                    -- 重置日期 (每日任务用)
  PRIMARY KEY (address, quest_id)
);

-- 成就定义表 (静态配置)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,                -- 成就ID (如 'first_chat', 'inviter_master')
  name_zh TEXT NOT NULL,              -- 中文名称
  name_en TEXT NOT NULL,              -- 英文名称
  desc_zh TEXT,                       -- 中文描述
  desc_en TEXT,                       -- 英文描述
  icon TEXT,                          -- 图标 emoji
  badge TEXT,                         -- 徽章图标
  rarity TEXT DEFAULT 'common',       -- 稀有度: common, rare, epic, legendary
  condition_type TEXT,                -- 条件类型: quest_complete, referral_count, level, etc
  condition_value INTEGER DEFAULT 1,  -- 条件值
  xp_reward INTEGER DEFAULT 0,        -- 经验奖励
  sort_order INTEGER DEFAULT 0,       -- 排序
  is_active INTEGER DEFAULT 1         -- 是否启用
);

-- 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
  address TEXT NOT NULL,              -- 用户钱包地址
  achievement_id TEXT NOT NULL,       -- 成就ID
  unlocked_at INTEGER,                -- 解锁时间戳
  PRIMARY KEY (address, achievement_id)
);

-- 用户经验值表 (扩展 users 表)
-- ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN xp_level INTEGER DEFAULT 1;

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_quests_address ON user_quests(address);
CREATE INDEX IF NOT EXISTS idx_user_achievements_address ON user_achievements(address);

-- ============================================
-- 初始任务数据
-- ============================================

-- 每日任务
INSERT OR IGNORE INTO quests (id, type, name_zh, name_en, desc_zh, desc_en, icon, target, reward_type, reward_value, sort_order) VALUES
('daily_checkin', 'daily', '每日签到', 'Daily Check-in', '每天登录一次', 'Log in once a day', '📅', 1, 'xp', 10, 1),
('daily_chat_3', 'daily', 'AI 对话', 'AI Chat', '与神谕兔兔对话3次', 'Chat with Oracle 3 times', '🐰', 3, 'xp', 20, 2),
('daily_chat_10', 'daily', '深度对话', 'Deep Chat', '与神谕兔兔对话10次', 'Chat with Oracle 10 times', '💬', 10, 'xp', 50, 3);

-- 成长任务
INSERT OR IGNORE INTO quests (id, type, name_zh, name_en, desc_zh, desc_en, icon, target, reward_type, reward_value, sort_order) VALUES
('growth_connect_wallet', 'growth', '连接钱包', 'Connect Wallet', '首次连接钱包', 'Connect wallet for the first time', '🔗', 1, 'xp', 50, 10),
('growth_verify', 'growth', '身份认证', 'Verify Identity', '完成签名认证', 'Complete signature verification', '🔐', 1, 'xp', 100, 11),
('growth_invite_1', 'growth', '初次邀请', 'First Invite', '成功邀请1位好友', 'Invite 1 friend', '👥', 1, 'mail_quota', 2, 12),
('growth_invite_5', 'growth', '邀请达人', 'Invite Master', '成功邀请5位好友', 'Invite 5 friends', '🌟', 5, 'mail_quota', 5, 13),
('growth_invite_10', 'growth', '社交之星', 'Social Star', '成功邀请10位好友', 'Invite 10 friends', '⭐', 10, 'xp', 500, 14);

-- ============================================
-- 初始成就数据
-- ============================================

INSERT OR IGNORE INTO achievements (id, name_zh, name_en, desc_zh, desc_en, icon, badge, rarity, condition_type, condition_value, xp_reward, sort_order) VALUES
('first_login', '初入矩阵', 'Enter the Matrix', '首次访问 Free-Node', 'First visit to Free-Node', '🚪', '🟢', 'common', 'first_login', 1, 10, 1),
('awakened', '觉醒者', 'Awakened', '连接钱包成为觉醒者', 'Connect wallet to become Awakened', '💊', '🔵', 'common', 'level', 1, 50, 2),
('the_one', '救世主', 'The One', '升级为 VIP 用户', 'Upgrade to VIP', '🕶️', '🟡', 'legendary', 'level', 2, 500, 3),
('chat_novice', '对话新手', 'Chat Novice', '累计 AI 对话 10 次', 'Total 10 AI chats', '💬', '🗨️', 'common', 'total_chat', 10, 20, 10),
('chat_expert', '对话专家', 'Chat Expert', '累计 AI 对话 100 次', 'Total 100 AI chats', '🎯', '💎', 'rare', 'total_chat', 100, 100, 11),
('inviter_bronze', '邀请铜牌', 'Bronze Inviter', '成功邀请 3 位好友', 'Invite 3 friends', '🥉', '🥉', 'common', 'referral_count', 3, 30, 20),
('inviter_silver', '邀请银牌', 'Silver Inviter', '成功邀请 10 位好友', 'Invite 10 friends', '🥈', '🥈', 'rare', 'referral_count', 10, 100, 21),
('inviter_gold', '邀请金牌', 'Gold Inviter', '成功邀请 50 位好友', 'Invite 50 friends', '🥇', '🥇', 'epic', 'referral_count', 50, 500, 22);
