/**
 * Ghost Core - 中央用户服务
 * Project Hierarchy: 用户分级 + 配额管理 + 邀请系统
 * 
 * 所有 Worker (Oracle, Mail, Payment) 都调用此服务
 */

interface Env {
  DB: D1Database;
  SERVICE_SECRET?: string;  // 内部服务通信密钥 (可选)
  ADMIN_KEY?: string;       // 管理员密钥
}

// ============================================
// 类型定义
// ============================================

interface User {
  address: string;
  level: number;
  invite_code: string | null;
  invited_by: string | null;
  mail_quota: number;
  referral_count: number;
  balance: number;
  created_at: number;
}

interface DailyUsage {
  identifier: string;
  date: string;
  ai_count: number;
  mail_count: number;
}

// 用户等级
const UserLevel = {
  WANDERER: 0,   // 流浪者 (IP)
  AWAKENED: 1,   // 觉醒者 (钱包)
  THE_ONE: 2,    // 救世主 (VIP)
} as const;

const LEVEL_NAMES = ['Wanderer', 'Awakened', 'The One'];

// XP 等级配置 (累计 XP 阈值)
const XP_LEVELS = [
  0,      // Lv.1: 0 XP
  100,    // Lv.2: 100 XP
  300,    // Lv.3: 300 XP
  600,    // Lv.4: 600 XP
  1000,   // Lv.5: 1000 XP
  1500,   // Lv.6: 1500 XP
  2100,   // Lv.7: 2100 XP
  2800,   // Lv.8: 2800 XP
  3600,   // Lv.9: 3600 XP
  4500,   // Lv.10: 4500 XP
];

// 根据 XP 计算等级
function calculateXpLevel(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) return i + 1;
  }
  return 1;
}

// 每日限额配置
const DAILY_LIMITS = {
  ai: {
    [UserLevel.WANDERER]: 10,
    [UserLevel.AWAKENED]: 20,
    [UserLevel.THE_ONE]: Infinity,
  },
  mail: {
    [UserLevel.WANDERER]: 0,
    [UserLevel.AWAKENED]: 10,
    [UserLevel.THE_ONE]: Infinity,
  },
} as const;

// ============================================
// 工具函数
// ============================================

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FN-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// 解析钱包认证头
function parseWalletAuth(authHeader: string | null): { valid: boolean; address: string | null } {
  if (!authHeader) {
    console.log('[DEBUG] parseWalletAuth: no authHeader');
    return { valid: false, address: null };
  }
  
  const parts = authHeader.split(':');
  if (parts.length !== 2) {
    console.log('[DEBUG] parseWalletAuth: invalid format, parts:', parts.length);
    return { valid: false, address: null };
  }
  
  const address = parts[0].toLowerCase();
  if (!isValidAddress(address)) {
    console.log('[DEBUG] parseWalletAuth: invalid address format:', address);
    return { valid: false, address: null };
  }
  
  console.log('[DEBUG] parseWalletAuth: valid, address:', address);
  // TODO: 实际签名验证 (viem/ethers)
  return { valid: true, address };
}


// ============================================
// 数据库操作
// ============================================

async function getUser(db: D1Database, address: string): Promise<User | null> {
  return await db.prepare('SELECT * FROM users WHERE address = ?')
    .bind(address).first<User>();
}

async function createUser(db: D1Database, address: string): Promise<User> {
  const inviteCode = generateInviteCode();
  const now = Math.floor(Date.now() / 1000);
  
  await db.prepare(`
    INSERT INTO users (address, level, invite_code, mail_quota, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(address, UserLevel.AWAKENED, inviteCode, 5, now).run();
  
  return {
    address,
    level: UserLevel.AWAKENED,
    invite_code: inviteCode,
    invited_by: null,
    mail_quota: 5,
    referral_count: 0,
    balance: 0,
    created_at: now,
  };
}

async function getOrCreateUser(db: D1Database, address: string): Promise<User> {
  let user = await getUser(db, address);
  if (!user) {
    user = await createUser(db, address);
  }
  return user;
}

async function getDailyUsage(db: D1Database, identifier: string, service: 'ai' | 'mail'): Promise<number> {
  const today = getTodayDate();
  const result = await db.prepare(
    'SELECT * FROM daily_usage WHERE identifier = ? AND date = ?'
  ).bind(identifier, today).first<DailyUsage>();
  
  if (!result) return 0;
  return service === 'ai' ? result.ai_count : result.mail_count;
}

async function incrementUsage(db: D1Database, identifier: string, service: 'ai' | 'mail'): Promise<void> {
  const today = getTodayDate();
  const column = service === 'ai' ? 'ai_count' : 'mail_count';
  
  await db.prepare(`
    INSERT INTO daily_usage (identifier, date, ${column})
    VALUES (?, ?, 1)
    ON CONFLICT (identifier, date) DO UPDATE SET ${column} = ${column} + 1
  `).bind(identifier, today).run();
}

// ============================================
// CORS 配置
// ============================================

const ALLOWED_ORIGINS = [
  'https://free-node.xyz',
  'https://www.free-node.xyz',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

// 允许的内部服务
const ALLOWED_SERVICES = ['ghost-oracle', 'ghost-mail', 'ghost-payment'];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d+\.\d+:\d+$/.test(origin)) {
    return true;
  }
  return false;
}

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = isAllowedOrigin(origin) ? origin || '*' : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Wallet-Auth, X-Service-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: object, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
  });
}

function errorResponse(message: string, status: number, origin: string | null): Response {
  return jsonResponse({ error: message }, status, origin);
}


// ============================================
// API: 配额检查 (供其他 Worker 调用)
// ============================================

async function handleQuotaCheck(request: Request, env: Env, origin: string | null): Promise<Response> {
  try {
    const body = await request.json() as {
      service: 'ai' | 'mail';
      walletAuth?: string;
      clientIP?: string;
    };
    
    const { service, walletAuth, clientIP } = body;
    
    if (!service || !['ai', 'mail'].includes(service)) {
      return errorResponse('Invalid service type', 400, origin);
    }
    
    let identifier: string;
    let level: number;
    let user: User | null = null;
    
    // 识别身份
    const authResult = parseWalletAuth(walletAuth || null);
    
    if (authResult.valid && authResult.address) {
      user = await getOrCreateUser(env.DB, authResult.address);
      identifier = authResult.address;
      level = user.level;
    } else {
      identifier = `ip:${clientIP || 'unknown'}`;
      level = UserLevel.WANDERER;
    }
    
    // VIP 直接放行
    if (level === UserLevel.THE_ONE) {
      return jsonResponse({
        allowed: true,
        identifier,
        level,
        levelName: LEVEL_NAMES[level],
        currentCount: 0,
        limit: 'unlimited',
        skipTurnstile: true,
        user: user ? { address: user.address, mailQuota: user.mail_quota } : null,
      }, 200, origin);
    }
    
    // 查询今日用量
    const currentCount = await getDailyUsage(env.DB, identifier, service);
    const limits = DAILY_LIMITS[service];
    const limit = limits[level as keyof typeof limits] ?? limits[UserLevel.WANDERER];
    
    const allowed = currentCount < limit;
    
    return jsonResponse({
      allowed,
      identifier,
      level,
      levelName: LEVEL_NAMES[level],
      currentCount,
      limit: limit === Infinity ? 'unlimited' : limit,
      skipTurnstile: false,
      user: user ? { address: user.address, mailQuota: user.mail_quota } : null,
    }, 200, origin);
  } catch (err) {
    console.error('Quota check error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// API: 记录用量 (供其他 Worker 调用)
// ============================================

async function handleQuotaRecord(request: Request, env: Env, origin: string | null): Promise<Response> {
  try {
    const body = await request.json() as {
      identifier: string;
      service: 'ai' | 'mail';
    };
    
    const { identifier, service } = body;
    
    if (!identifier || !service) {
      return errorResponse('Missing identifier or service', 400, origin);
    }
    
    await incrementUsage(env.DB, identifier, service);
    
    return jsonResponse({ success: true }, 200, origin);
  } catch (err) {
    console.error('Record usage error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// API: 获取用户信息 (前端调用)
// ============================================

async function handleGetUser(request: Request, env: Env, origin: string | null): Promise<Response> {
  const walletAuth = request.headers.get('X-Wallet-Auth');
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  const authResult = parseWalletAuth(walletAuth);
  
  if (authResult.valid && authResult.address) {
    const user = await getOrCreateUser(env.DB, authResult.address);
    const aiUsage = await getDailyUsage(env.DB, authResult.address, 'ai');
    const aiLimit = DAILY_LIMITS.ai[user.level as keyof typeof DAILY_LIMITS.ai];
    
    return jsonResponse({
      address: user.address,
      level: user.level,
      levelName: LEVEL_NAMES[user.level],
      inviteCode: user.invite_code,
      invitedBy: user.invited_by,
      mailQuota: user.mail_quota,
      balance: user.balance,
      xp: (user as any).xp || 0,
      xp_level: (user as any).xp_level || 1,
      usage: {
        ai: { today: aiUsage, limit: aiLimit === Infinity ? 'unlimited' : aiLimit },
      },
    }, 200, origin);
  }
  
  // IP 用户
  const identifier = `ip:${clientIP}`;
  const aiUsage = await getDailyUsage(env.DB, identifier, 'ai');
  
  return jsonResponse({
    address: null,
    level: UserLevel.WANDERER,
    levelName: 'Wanderer',
    inviteCode: null,
    invitedBy: null,
    mailQuota: 0,
    balance: 0,
    usage: {
      ai: { today: aiUsage, limit: DAILY_LIMITS.ai[UserLevel.WANDERER] },
    },
  }, 200, origin);
}


// ============================================
// API: 绑定邀请码
// ============================================

async function handleBindInvite(request: Request, env: Env, origin: string | null): Promise<Response> {
  try {
    const body = await request.json() as { inviteCode?: string };
    const walletAuth = request.headers.get('X-Wallet-Auth');
    
    const authResult = parseWalletAuth(walletAuth);
    if (!authResult.valid || !authResult.address) {
      return errorResponse('Wallet authentication required', 401, origin);
    }
    
    const { inviteCode } = body;
    if (!inviteCode) {
      return errorResponse('Invite code required', 400, origin);
    }
    
    // 查找邀请人
    const inviter = await env.DB.prepare(
      'SELECT * FROM users WHERE invite_code = ?'
    ).bind(inviteCode).first<User>();
    
    if (!inviter) {
      return errorResponse('Invalid invite code', 404, origin);
    }
    
    if (inviter.address === authResult.address) {
      return errorResponse('Cannot invite yourself', 400, origin);
    }
    
    const user = await getOrCreateUser(env.DB, authResult.address);
    
    if (user.invited_by) {
      return errorResponse('Already bound to an inviter', 400, origin);
    }
    
    // 绑定邀请关系 + 奖励邀请人
    // mail_quota 上限 20，referral_count 无上限
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET invited_by = ? WHERE address = ?')
        .bind(inviteCode, authResult.address),
      env.DB.prepare(`
        UPDATE users SET 
          mail_quota = MIN(mail_quota + 2, 20),
          referral_count = COALESCE(referral_count, 0) + 1
        WHERE address = ?
      `).bind(inviter.address),
    ]);
    
    return jsonResponse({
      success: true,
      message: 'Invite code bound successfully',
      inviter: inviter.address.slice(0, 6) + '...' + inviter.address.slice(-4),
    }, 200, origin);
  } catch (err) {
    console.error('Bind invite error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// API: 升级用户等级 (管理接口)
// ============================================

async function handleUpgradeUser(request: Request, env: Env, origin: string | null): Promise<Response> {
  // TODO: 添加管理员验证
  try {
    const body = await request.json() as { address: string; level: number };
    const { address, level } = body;
    
    if (!isValidAddress(address)) {
      return errorResponse('Invalid address', 400, origin);
    }
    
    if (![0, 1, 2].includes(level)) {
      return errorResponse('Invalid level (0-2)', 400, origin);
    }
    
    await env.DB.prepare('UPDATE users SET level = ? WHERE address = ?')
      .bind(level, address.toLowerCase()).run();
    
    return jsonResponse({ success: true, address, level, levelName: LEVEL_NAMES[level] }, 200, origin);
  } catch (err) {
    console.error('Upgrade user error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// API: 获取任务列表
// ============================================

interface Quest {
  id: string;
  type: string;
  name_zh: string;
  name_en: string;
  desc_zh: string;
  desc_en: string;
  icon: string;
  target: number;
  reward_type: string;
  reward_value: number;
}

interface UserQuest {
  quest_id: string;
  progress: number;
  completed: number;
  claimed: number;
}

async function handleGetQuests(request: Request, env: Env, origin: string | null): Promise<Response> {
  const walletAuth = request.headers.get('X-Wallet-Auth');
  const authResult = parseWalletAuth(walletAuth);
  
  // 调试日志
  console.log('[DEBUG] handleGetQuests:', {
    hasWalletAuth: !!walletAuth,
    authValid: authResult.valid,
    address: authResult.address,
  });
  
  // 获取所有任务
  const quests = await env.DB.prepare(
    'SELECT * FROM quests WHERE is_active = 1 ORDER BY sort_order'
  ).all<Quest>();
  
  let userProgress: UserQuest[] = [];
  let userStats = { referral_count: 0, xp: 0, xp_level: 1 };
  
  if (authResult.valid && authResult.address) {
    // 获取用户任务进度
    const progress = await env.DB.prepare(
      'SELECT quest_id, progress, completed, claimed FROM user_quests WHERE address = ?'
    ).bind(authResult.address).all<UserQuest>();
    userProgress = progress.results || [];
    
    // 获取用户统计
    const user = await getUser(env.DB, authResult.address);
    if (user) {
      userStats = {
        referral_count: (user as any).referral_count || 0,
        xp: (user as any).xp || 0,
        xp_level: (user as any).xp_level || 1,
      };
    }
  }
  
  // 合并任务和进度
  const questList = (quests.results || []).map((q) => {
    const up = userProgress.find((p) => p.quest_id === q.id);
    let progress = up?.progress || 0;
    let completed = up?.completed || 0;
    
    // 自动计算某些任务的进度
    if (q.id.startsWith('growth_invite_')) {
      progress = userStats.referral_count;
      completed = progress >= q.target ? 1 : 0;
    }
    
    // 自动完成连接钱包和签名认证任务
    if (authResult.valid && authResult.address) {
      if (q.id === 'growth_connect_wallet' || q.id === 'growth_verify') {
        console.log('[DEBUG] Auto-completing quest:', q.id);
        progress = 1;
        completed = 1;
      }
    }
    
    return {
      ...q,
      progress,
      completed,
      claimed: up?.claimed || 0,
    };
  });
  
  return jsonResponse({
    quests: questList,
    stats: userStats,
  }, 200, origin);
}

// ============================================
// API: 领取任务奖励
// ============================================

async function handleClaimQuest(request: Request, env: Env, origin: string | null): Promise<Response> {
  const walletAuth = request.headers.get('X-Wallet-Auth');
  const authResult = parseWalletAuth(walletAuth);
  
  if (!authResult.valid || !authResult.address) {
    return errorResponse('Wallet authentication required', 401, origin);
  }
  
  try {
    const body = await request.json() as { questId: string };
    const { questId } = body;
    
    if (!questId) {
      return errorResponse('Quest ID required', 400, origin);
    }
    
    // 获取任务信息
    const quest = await env.DB.prepare(
      'SELECT * FROM quests WHERE id = ?'
    ).bind(questId).first<Quest>();
    
    if (!quest) {
      return errorResponse('Quest not found', 404, origin);
    }
    
    // 检查是否已领取
    const userQuest = await env.DB.prepare(
      'SELECT * FROM user_quests WHERE address = ? AND quest_id = ?'
    ).bind(authResult.address, questId).first<UserQuest>();
    
    if (userQuest?.claimed) {
      return errorResponse('Already claimed', 400, origin);
    }
    
    // 获取用户当前进度
    const user = await getOrCreateUser(env.DB, authResult.address);
    let progress = userQuest?.progress || 0;
    
    // 自动计算进度
    if (questId.startsWith('growth_invite_')) {
      progress = (user as any).referral_count || 0;
    } else if (questId === 'growth_connect_wallet' || questId === 'growth_verify') {
      progress = 1; // 已连接/认证
    }
    
    if (progress < quest.target) {
      return errorResponse('Quest not completed', 400, origin);
    }
    
    // 发放奖励
    const updates: D1PreparedStatement[] = [];
    
    if (quest.reward_type === 'xp') {
      updates.push(
        env.DB.prepare('UPDATE users SET xp = xp + ? WHERE address = ?')
          .bind(quest.reward_value, authResult.address)
      );
    } else if (quest.reward_type === 'mail_quota') {
      updates.push(
        env.DB.prepare('UPDATE users SET mail_quota = MIN(mail_quota + ?, 20) WHERE address = ?')
          .bind(quest.reward_value, authResult.address)
      );
    }
    
    // 更新任务状态
    updates.push(
      env.DB.prepare(`
        INSERT INTO user_quests (address, quest_id, progress, completed, claimed, completed_at)
        VALUES (?, ?, ?, 1, 1, ?)
        ON CONFLICT (address, quest_id) DO UPDATE SET completed = 1, claimed = 1, completed_at = ?
      `).bind(authResult.address, questId, progress, Date.now(), Date.now())
    );
    
    await env.DB.batch(updates);
    
    // 如果是 XP 奖励，更新 XP 等级
    let newXpLevel: number | null = null;
    if (quest.reward_type === 'xp') {
      const updatedUser = await env.DB.prepare('SELECT xp, xp_level FROM users WHERE address = ?')
        .bind(authResult.address).first<{ xp: number; xp_level: number }>();
      if (updatedUser) {
        const calculatedLevel = calculateXpLevel(updatedUser.xp);
        if (calculatedLevel > (updatedUser.xp_level || 1)) {
          await env.DB.prepare('UPDATE users SET xp_level = ? WHERE address = ?')
            .bind(calculatedLevel, authResult.address).run();
          newXpLevel = calculatedLevel;
        }
      }
    }
    
    return jsonResponse({
      success: true,
      reward: { type: quest.reward_type, value: quest.reward_value },
      newXpLevel,
    }, 200, origin);
  } catch (err) {
    console.error('Claim quest error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// API: 获取成就列表
// ============================================

interface Achievement {
  id: string;
  name_zh: string;
  name_en: string;
  desc_zh: string;
  desc_en: string;
  icon: string;
  badge: string;
  rarity: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
}

async function handleGetAchievements(request: Request, env: Env, origin: string | null): Promise<Response> {
  const walletAuth = request.headers.get('X-Wallet-Auth');
  const authResult = parseWalletAuth(walletAuth);
  
  // 获取所有成就
  const achievements = await env.DB.prepare(
    'SELECT * FROM achievements WHERE is_active = 1 ORDER BY sort_order'
  ).all<Achievement>();
  
  let unlockedIds: string[] = [];
  let userStats = { level: 0, referral_count: 0, total_chat: 0 };
  
  if (authResult.valid && authResult.address) {
    // 获取已解锁成就
    const unlocked = await env.DB.prepare(
      'SELECT achievement_id FROM user_achievements WHERE address = ?'
    ).bind(authResult.address).all<{ achievement_id: string }>();
    unlockedIds = (unlocked.results || []).map((u) => u.achievement_id);
    
    // 获取用户统计
    const user = await getUser(env.DB, authResult.address);
    if (user) {
      // 累计总对话次数 (从 daily_usage 表)
      const chatSum = await env.DB.prepare(
        'SELECT COALESCE(SUM(ai_count), 0) as total FROM daily_usage WHERE identifier = ?'
      ).bind(authResult.address).first<{ total: number }>();
      
      userStats = {
        level: user.level,
        referral_count: (user as any).referral_count || 0,
        total_chat: chatSum?.total || 0,
      };
    }
    
    // 自动解锁成就检测
    const newUnlocks: string[] = [];
    for (const a of (achievements.results || [])) {
      if (unlockedIds.includes(a.id)) continue;
      
      let progress = 0;
      if (a.condition_type === 'level') progress = userStats.level;
      else if (a.condition_type === 'referral_count') progress = userStats.referral_count;
      else if (a.condition_type === 'first_login') progress = 1;
      
      if (progress >= a.condition_value) {
        newUnlocks.push(a.id);
      }
    }
    
    // 批量解锁新成就
    if (newUnlocks.length > 0) {
      const unlockStmts = newUnlocks.map(id => 
        env.DB.prepare(
          'INSERT OR IGNORE INTO user_achievements (address, achievement_id, unlocked_at) VALUES (?, ?, ?)'
        ).bind(authResult.address, id, Date.now())
      );
      await env.DB.batch(unlockStmts);
      unlockedIds.push(...newUnlocks);
    }
  }
  
  // 合并成就和解锁状态
  const isAuthenticated = authResult.valid && authResult.address;
  const achievementList = (achievements.results || []).map((a) => {
    const unlocked = unlockedIds.includes(a.id);
    let progress = 0;
    
    // 计算进度 (未认证用户只显示 0)
    if (isAuthenticated) {
      if (a.condition_type === 'level') {
        progress = userStats.level;
      } else if (a.condition_type === 'referral_count') {
        progress = userStats.referral_count;
      } else if (a.condition_type === 'total_chat') {
        progress = userStats.total_chat;
      } else if (a.condition_type === 'first_login') {
        progress = 1; // 认证用户自动满足
      }
    }
    
    return {
      ...a,
      progress,
      unlocked,
    };
  });
  
  return jsonResponse({
    achievements: achievementList,
    stats: userStats,
    newUnlocks: [], // 可以返回新解锁的成就 ID
  }, 200, origin);
}

// ============================================
// API: 交易所活动
// ============================================

interface Activity {
  id: string;
  exchange: string;
  title: string;
  title_cn: string | null;
  url: string;
  type: string;
  end_time: string | null;
  is_active: number;
  created_at: number;
}

async function handleGetActivities(request: Request, env: Env, origin: string | null): Promise<Response> {
  const url = new URL(request.url);
  const exchange = url.searchParams.get('exchange');
  const type = url.searchParams.get('type');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  let query = 'SELECT * FROM exchange_activities WHERE is_active = 1';
  const params: string[] = [];
  
  if (exchange) {
    query += ' AND exchange = ?';
    params.push(exchange);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit.toString());
  
  const stmt = env.DB.prepare(query);
  const result = await stmt.bind(...params).all<Activity>();
  
  return jsonResponse({
    activities: result.results || [],
    total: result.results?.length || 0,
  }, 200, origin);
}

async function handleCreateActivity(request: Request, env: Env, origin: string | null): Promise<Response> {
  // 验证管理员密钥
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== env.ADMIN_KEY) {
    return errorResponse('Unauthorized', 401, origin);
  }
  
  try {
    const body = await request.json() as {
      exchange: string;
      title: string;
      title_cn?: string;
      url: string;
      type?: string;
      end_time?: string;
    };
    
    const { exchange, title, title_cn, url, type = 'other', end_time } = body;
    
    if (!exchange || !title || !url) {
      return errorResponse('Missing required fields: exchange, title, url', 400, origin);
    }
    
    const validExchanges = ['binance', 'okx', 'bybit', 'bitget', 'gate'];
    if (!validExchanges.includes(exchange)) {
      return errorResponse('Invalid exchange', 400, origin);
    }
    
    // 检查 URL 是否已存在（去重）
    const existing = await env.DB.prepare(
      'SELECT id FROM exchange_activities WHERE url = ?'
    ).bind(url).first();
    
    if (existing) {
      return jsonResponse({ success: false, message: 'Activity already exists', duplicate: true }, 200, origin);
    }
    
    const id = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO exchange_activities (id, exchange, title, title_cn, url, type, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, exchange, title, title_cn || null, url, type, end_time || null).run();
    
    return jsonResponse({ success: true, id }, 201, origin);
  } catch (err) {
    console.error('Create activity error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

async function handleDeleteActivity(request: Request, env: Env, origin: string | null, activityId: string): Promise<Response> {
  // 验证管理员密钥
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== env.ADMIN_KEY) {
    return errorResponse('Unauthorized', 401, origin);
  }
  
  await env.DB.prepare('UPDATE exchange_activities SET is_active = 0 WHERE id = ?')
    .bind(activityId).run();
  
  return jsonResponse({ success: true }, 200, origin);
}

// ============================================
// API: 页面访问统计
// ============================================

async function handleGetPageViews(request: Request, env: Env, origin: string | null): Promise<Response> {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || '/exchanges';
  const days = parseInt(url.searchParams.get('days') || '30');
  
  // 获取指定天数内的访问量
  const result = await env.DB.prepare(`
    SELECT COALESCE(SUM(count), 0) as total
    FROM page_views 
    WHERE page = ? AND date >= date('now', '-' || ? || ' days')
  `).bind(page, days).first<{ total: number }>();
  
  // 获取今日访问量
  const today = new Date().toISOString().split('T')[0];
  const todayResult = await env.DB.prepare(
    'SELECT count FROM page_views WHERE page = ? AND date = ?'
  ).bind(page, today).first<{ count: number }>();
  
  return jsonResponse({
    page,
    total: result?.total || 0,
    today: todayResult?.count || 0,
    days,
  }, 200, origin);
}

async function handleRecordPageView(request: Request, env: Env, origin: string | null): Promise<Response> {
  try {
    const body = await request.json() as { page: string };
    const { page } = body;
    
    if (!page) {
      return errorResponse('Missing page', 400, origin);
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    await env.DB.prepare(`
      INSERT INTO page_views (page, date, count)
      VALUES (?, ?, 1)
      ON CONFLICT (page, date) DO UPDATE SET count = count + 1
    `).bind(page, today).run();
    
    return jsonResponse({ success: true }, 200, origin);
  } catch (err) {
    console.error('Record page view error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// API: 每日签到
// ============================================

async function handleCheckin(request: Request, env: Env, origin: string | null): Promise<Response> {
  const walletAuth = request.headers.get('X-Wallet-Auth');
  const authResult = parseWalletAuth(walletAuth);
  
  if (!authResult.valid || !authResult.address) {
    return errorResponse('Wallet authentication required', 401, origin);
  }
  
  const today = new Date().toISOString().split('T')[0];
  const questId = 'daily_checkin';
  
  // 检查今天是否已签到
  const existing = await env.DB.prepare(
    'SELECT * FROM user_quests WHERE address = ? AND quest_id = ? AND reset_date = ?'
  ).bind(authResult.address, questId, today).first();
  
  if (existing) {
    return jsonResponse({ success: false, message: 'Already checked in today' }, 200, origin);
  }
  
  // 记录签到
  await env.DB.prepare(`
    INSERT INTO user_quests (address, quest_id, progress, completed, reset_date)
    VALUES (?, ?, 1, 1, ?)
    ON CONFLICT (address, quest_id) DO UPDATE SET progress = 1, completed = 1, claimed = 0, reset_date = ?
  `).bind(authResult.address, questId, today, today).run();
  
  return jsonResponse({ success: true, message: 'Checked in successfully' }, 200, origin);
}

// ============================================
// API: 记录任务进度 (内部调用)
// ============================================

async function handleQuestProgress(request: Request, env: Env, origin: string | null): Promise<Response> {
  try {
    const body = await request.json() as {
      address: string;
      questId: string;
      increment?: number;
    };
    
    const { address, questId, increment = 1 } = body;
    if (!address || !questId) {
      return errorResponse('Missing address or questId', 400, origin);
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 获取任务目标
    const quest = await env.DB.prepare('SELECT target FROM quests WHERE id = ?')
      .bind(questId).first<{ target: number }>();
    
    if (!quest) {
      return errorResponse('Quest not found', 404, origin);
    }
    
    // 更新进度 (每日任务按日期重置)
    const isDaily = questId.startsWith('daily_');
    
    if (isDaily) {
      // 每日任务：检查是否需要重置
      const existing = await env.DB.prepare(
        'SELECT progress, reset_date FROM user_quests WHERE address = ? AND quest_id = ?'
      ).bind(address.toLowerCase(), questId).first<{ progress: number; reset_date: string }>();
      
      let newProgress = increment;
      if (existing && existing.reset_date === today) {
        newProgress = Math.min(existing.progress + increment, quest.target);
      }
      
      await env.DB.prepare(`
        INSERT INTO user_quests (address, quest_id, progress, completed, reset_date)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (address, quest_id) DO UPDATE SET 
          progress = ?,
          completed = CASE WHEN ? >= ? THEN 1 ELSE 0 END,
          reset_date = ?
      `).bind(
        address.toLowerCase(), questId, newProgress, newProgress >= quest.target ? 1 : 0, today,
        newProgress,
        newProgress, quest.target,
        today
      ).run();
    } else {
      // 成长任务：累计进度
      await env.DB.prepare(`
        INSERT INTO user_quests (address, quest_id, progress, completed)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (address, quest_id) DO UPDATE SET 
          progress = MIN(progress + ?, ?),
          completed = CASE WHEN progress + ? >= ? THEN 1 ELSE completed END
      `).bind(
        address.toLowerCase(), questId, increment, increment >= quest.target ? 1 : 0,
        increment, quest.target,
        increment, quest.target
      ).run();
    }
    
    return jsonResponse({ success: true }, 200, origin);
  } catch (err) {
    console.error('Quest progress error:', err);
    return errorResponse('Internal server error', 500, origin);
  }
}

// ============================================
// 路由分发
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);
    
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
    }
    
    // 验证来源 (内部服务或允许的前端)
    const serviceKey = request.headers.get('X-Service-Key');
    const isInternalService = serviceKey && ALLOWED_SERVICES.includes(serviceKey);
    
    if (!isInternalService && !isAllowedOrigin(origin)) {
      return errorResponse('Forbidden', 403, origin);
    }
    
    // 路由
    const path = url.pathname;
    
    switch (path) {
      // 内部服务 API
      case '/api/quota/check':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleQuotaCheck(request, env, origin);
      
      case '/api/quota/record':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleQuotaRecord(request, env, origin);
      
      case '/api/quest/progress':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleQuestProgress(request, env, origin);
      
      // 前端 API
      case '/api/user':
        return handleGetUser(request, env, origin);
      
      case '/api/user/bind-invite':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleBindInvite(request, env, origin);
      
      // 管理 API
      case '/api/admin/upgrade':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleUpgradeUser(request, env, origin);
      
      // 任务系统 API
      case '/api/quests':
        return handleGetQuests(request, env, origin);
      
      case '/api/quests/claim':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleClaimQuest(request, env, origin);
      
      case '/api/quests/checkin':
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, origin);
        return handleCheckin(request, env, origin);
      
      // 成就系统 API
      case '/api/achievements':
        return handleGetAchievements(request, env, origin);
      
      // 交易所活动 API
      case '/api/activities':
        if (request.method === 'GET') return handleGetActivities(request, env, origin);
        if (request.method === 'POST') return handleCreateActivity(request, env, origin);
        return errorResponse('Method not allowed', 405, origin);
      
      // 页面访问统计 API
      case '/api/stats/pageviews':
        if (request.method === 'GET') return handleGetPageViews(request, env, origin);
        if (request.method === 'POST') return handleRecordPageView(request, env, origin);
        return errorResponse('Method not allowed', 405, origin);
      
      // 健康检查
      case '/health':
        return jsonResponse({ status: 'ok', service: 'ghost-core' }, 200, origin);
      
      default:
        // 动态路由: /api/activities/:id
        if (path.startsWith('/api/activities/') && request.method === 'DELETE') {
          const activityId = path.split('/')[3];
          return handleDeleteActivity(request, env, origin, activityId);
        }
        return errorResponse('Not found', 404, origin);
    }
  },
};
