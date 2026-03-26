/**
 * Admin Routes - 管理员接口
 * 参考 jx/BLL/Server.cs 和 jx/Web/Main.aspx.cs
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth, verifyAdminAuth } from '../utils/auth';
import initConfig from '../config/init.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 管理员配置 - 从环境变量读取
// 注意：C# 中 OnlineOffset 取负值：int offset = -int.Parse(config["OnlineOffset"])
//       SQL: datetimeadd(minute, offset, getdate()) -> 向过去推算offset秒
const _ONLINE_OFFSET_RAW = parseInt((process.env.ONLINE_OFFSET as string) || '3600');
const ADMIN_CONFIG = {
  // 在线人数偏移量(秒) - 对应 C# OnlineOffset (3600秒 = 1小时)
  // C# 中是负数：int offset = -3600 (用于datetimeadd向过去推算)
  ONLINE_OFFSET: -_ONLINE_OFFSET_RAW,
  // 在线判定时间窗口(分钟) - 取绝对值，不取反
  ONLINE_WINDOW_MINUTES: Math.max(1, Math.floor(_ONLINE_OFFSET_RAW / 60)),
};

// ==================== GET /admin/server-info - 获取服务器状态 ====================
// 参考 BLL.Server.GetServerInfo()

app.get('/server-info', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    // 获取总用户数
    const userCountResult: any = await db.prepare(`SELECT COUNT(*) as count FROM characters`).first();
    const userCount = userCountResult?.count || 0;

    // 获取今日新用户数
    const today = new Date().toISOString().split('T')[0];
    const newUserResult: any = await db.prepare(
      `SELECT COUNT(*) as count FROM characters WHERE DATE(created_at) = ?`
    ).bind(today).first();
    const newUserCount = newUserResult?.count || 0;

    // 当前时间
    const now = new Date();
    const timePercent = 100; // 默认100%

    return success(c, {
      // 兼容 C# ServerInfo 字段 (参考 jx/BLL/Server.cs GetServerInfo)
      Time: now.toLocaleTimeString('zh-CN'),
      TimePercent: initConfig.Init.EventTimePercent,
      JuntaNum: initConfig.Init.JuntaNum,
      ExpPer: 1.0,
      // R = 注册人数 (RegistrationNum)
      R: userCount,
      RegistrationNum: userCount,
      // O = 在线人数
      O: 0,
      // 兼容字段
      userCount,
      newUserCount,
      serverTime: now.toISOString(),
      serverStatus: 'online',
      timePercent,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== GET /admin/stats - 管理员统计面板 ====================

app.get('/stats', async (c) => {
  const walletAddress = await verifyAdminAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    // 用户总数
    const userCountResult: any = await db.prepare(`SELECT COUNT(*) as count FROM characters`).first();
    const userCount = userCountResult?.count || 0;

    // 今日活跃
    const today = new Date().toISOString().split('T')[0];
    const activeTodayResult: any = await db.prepare(
      `SELECT COUNT(*) as count FROM characters WHERE DATE(updated_at) = ?`
    ).bind(today).first();
    const activeToday = activeTodayResult?.count || 0;

    // 竞技场参与人数
    const arenaCountResult: any = await db.prepare(
      `SELECT COUNT(*) as count FROM arena_records`
    ).first();
    const arenaCount = arenaCountResult?.count || 0;

    // 今日竞技场挑战次数
    const arenaTodayResult: any = await db.prepare(
      `SELECT SUM(win_count + lose_count) as count FROM arena_records WHERE DATE(updated_at) = ?`
    ).bind(today).first();
    const arenaChallengesToday = (arenaTodayResult as any)?.count || 0;

    // 武将总数
    const heroCountResult: any = await db.prepare(`SELECT COUNT(*) as count FROM heroes`).first();
    const heroCount = heroCountResult?.count || 0;

    // 军团数量
    const corpsCountResult: any = await db.prepare(`SELECT COUNT(*) as count FROM corps`).first();
    const corpsCount = corpsCountResult?.count || 0;

    // 金币总量（角色金币 + 背包金币）
    const totalGoldResult: any = await db.prepare(`
      SELECT SUM(c.gold) as total
      FROM characters c
    `).first();
    const totalGold = (totalGoldResult as any)?.total || 0;

    return success(c, {
      userCount,
      activeToday,
      arenaCount,
      arenaChallengesToday,
      heroCount,
      corpsCount,
      totalGold,
      today,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== GET /admin/online-count - 在线人数 ====================
// 参考 BLL.Server.GetUserOnlineCount() + BLLEX.ServerEx
// 使用最近30分钟有活动的用户数作为在线人数
// serverUnit: 区服标识 (参考 C# GetUserOnlineCount(serverUnit) 重载)

app.get('/online-count', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    // serverUnit 参数 (参考 C#: GetUserOnlineCount(string serverUnit))
    const serverUnit = c.req.query('serverUnit') || '1';
    // 在线定义：从配置读取偏移量，默认3600秒(1小时)
    // C#: offset = -int.Parse(ConfigurationManager.AppSettings["OnlineOffset"])
    const offsetMinutes = ADMIN_CONFIG.ONLINE_WINDOW_MINUTES;
    const onlineResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM characters
      WHERE state = 99
        AND updated_at >= datetime('now', '-' || ? || ' minutes')
    `).bind(offsetMinutes).first();

    const activeResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM characters
      WHERE updated_at >= datetime('now', '-' || ? || ' minutes')
    `).bind(offsetMinutes).first();

    // 在线峰值（当日）
    const today = new Date().toISOString().split('T')[0];
    const peakResult: any = await db.prepare(`
      SELECT MAX(cnt) as peak FROM (
        SELECT COUNT(*) as cnt FROM characters
        WHERE DATE(updated_at) = ?
        GROUP BY strftime('%H', updated_at)
      )
    `).bind(today).first();

    return success(c, {
      onlineCount: onlineResult?.count || 0,
      activeCount: activeResult?.count || 0,
      peakCount: peakResult?.peak || 0,
      windowMinutes: offsetMinutes,
      onlineOffset: ADMIN_CONFIG.ONLINE_OFFSET,
      serverUnit,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== GET /admin/server-time - 服务器时间 ====================
// 参考 Main.aspx.cs GetServerTimeNow()

app.get('/server-time', async (c) => {
  const now = new Date();
  return success(c, {
    serverTime: now.toISOString(),
    time: now.toLocaleTimeString('zh-CN'),
    timestamp: now.getTime(),
    timezone: 'Asia/Shanghai',
    date: now.toISOString().split('T')[0],
  });
});

// ==================== GET /admin/server-list - 区服列表 ====================
// 参考 BLL.Server.GetServerInfo() 和 BLLEX.ServerEx

app.get('/server-list', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const userCountResult: any = await db.prepare(`SELECT COUNT(*) as count FROM characters`).first();
    const userCount = userCountResult?.count || 0;

    // 在线人数（30分钟内活跃）
    const onlineResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM characters
      WHERE updated_at >= datetime('now', '-30 minutes')
    `).first();
    const onlineCount = onlineResult?.count || 0;

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 今日新用户
    const newUserResult: any = await db.prepare(
      `SELECT COUNT(*) as count FROM characters WHERE DATE(created_at) = ?`
    ).bind(today).first();
    const newUserCount = newUserResult?.count || 0;

    // 单区服配置（参考C#多区服逻辑，单区返回单一列表）
    const servers = [
      {
        serverId: '1',
        serverName: '一区-虎牢关',
        onlineCount,
        userCount,
        newUserCount,
        status: 'online',
        openTime: '2024-01-01 00:00:00',
        eventTimePercent: 100,
        expPercent: 1.0,
        serverTime: now.toLocaleTimeString('zh-CN'),
      },
    ];

    return success(c, { servers });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== POST /admin/kick-user - 踢出用户 ====================
// 参考 Main.aspx.cs KickUser()
// 功能：强制用户下线，并写入 ban 记录（踢出也是一种封禁记录）

app.post('/kick-user', async (c) => {
  const adminAddress = await verifyAdminAuth(c);
  if (!adminAddress) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const targetUserName = body.userName as string;
    const targetAddress = body.walletAddress as string;
    const kickReason = body.reason || 'Admin kick';

    if (!targetUserName && !targetAddress) {
      return error(c, 'userName or walletAddress is required');
    }

    // 查询目标用户
    let query;
    if (targetAddress) {
      query = await db.prepare(`SELECT * FROM characters WHERE wallet_address = ?`).bind(targetAddress).first();
    } else {
      query = await db.prepare(`SELECT * FROM characters WHERE name = ?`).bind(targetUserName).first();
    }

    if (!query) {
      return error(c, 'User not found', 404);
    }

    const target = query as any;
    const previousState = target.state || 0;

    // 写入踢出记录到 user_bans（ban_type=1 表示踢出）
    await db.prepare(`
      INSERT INTO user_bans (wallet_address, ban_reason, ban_until, banned_by, ban_type, is_active)
      VALUES (?, ?, datetime('now', '+5 minutes'), ?, 1, 1)
    `).bind(target.wallet_address, kickReason, adminAddress).run();

    // 写入管理员操作日志
    await db.prepare(`
      INSERT INTO admin_logs (admin_address, action, target_address, target_name, details)
      VALUES (?, 'kick_user', ?, ?, ?)
    `).bind(adminAddress, target.wallet_address, target.name, JSON.stringify({ reason: kickReason, previousState })).run();

    // 更新用户状态为离线（state=0）
    await db.prepare(`
      UPDATE characters SET state = 0, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(target.wallet_address).run();

    return success(c, {
      kicked: true,
      targetAddress: target.wallet_address,
      targetName: target.name,
      previousState,
      reason: kickReason,
      message: 'User kicked and logged',
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== GET /admin/users - 分页获取用户列表 ====================

app.get('/users', async (c) => {
  const adminAddress = await verifyAdminAuth(c);
  if (!adminAddress) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20')));
    const offset = (page - 1) * pageSize;
    const search = c.req.query('search') || '';

    let whereClause = '';
    const bindings: any[] = [];
    if (search) {
      whereClause = `WHERE name LIKE ? OR wallet_address LIKE ?`;
      bindings.push(`%${search}%`, `%${search}%`);
    }

    const countResult: any = await db.prepare(
      `SELECT COUNT(*) as count FROM characters ${whereClause}`
    ).bind(...bindings).first();
    const total = countResult?.count || 0;

    const users: any[] = await (db.prepare(`
      SELECT c.wallet_address, c.name, c.level, c.gold, c.state, c.updated_at,
             COALESCE(h.count, 0) as hero_count
      FROM characters c
      LEFT JOIN (SELECT wallet_address, COUNT(*) as count FROM heroes GROUP BY wallet_address) h
             ON h.wallet_address = c.wallet_address
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all() as any).results || [];

    return success(c, {
      users: users.map((u: any) => ({
        walletAddress: u.wallet_address,
        name: u.name,
        level: u.level,
        gold: u.gold,
        state: u.state,
        heroCount: u.hero_count,
        lastActive: u.updated_at,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== POST /admin/ban-user - 封禁用户 ====================

app.post('/ban-user', async (c) => {
  const adminAddress = await verifyAdminAuth(c);
  if (!adminAddress) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const targetAddress = body.walletAddress as string;
    const targetUserName = body.userName as string;
    const banReason = body.reason || 'Admin ban';
    const durationDays = Math.max(1, parseInt(body.durationDays as string) || -1); // -1 = permanent

    if (!targetAddress && !targetUserName) {
      return error(c, 'walletAddress or userName is required');
    }

    let query;
    if (targetAddress) {
      query = await db.prepare(`SELECT * FROM characters WHERE wallet_address = ?`).bind(targetAddress).first();
    } else {
      query = await db.prepare(`SELECT * FROM characters WHERE name = ?`).bind(targetUserName).first();
    }

    if (!query) {
      return error(c, 'User not found', 404);
    }

    const target = query as any;
    const banUntil = durationDays === -1
      ? '9999-12-31 23:59:59'
      : new Date(Date.now() + durationDays * 86400000).toISOString().replace('T', ' ').slice(0, 19);

    // 先标记旧记录为非活跃
    await db.prepare(`
      UPDATE user_bans SET is_active = 0
      WHERE wallet_address = ? AND is_active = 1
    `).bind(target.wallet_address).run();

    // 写入新的 ban 记录
    await db.prepare(`
      INSERT INTO user_bans (wallet_address, ban_reason, ban_until, banned_by, ban_type, is_active)
      VALUES (?, ?, ?, ?, 0, 1)
    `).bind(target.wallet_address, banReason, banUntil, adminAddress).run();

    // 写入管理员操作日志
    await db.prepare(`
      INSERT INTO admin_logs (admin_address, action, target_address, target_name, details)
      VALUES (?, 'ban_user', ?, ?, ?)
    `).bind(adminAddress, target.wallet_address, target.name, JSON.stringify({ reason: banReason, durationDays, banUntil })).run();

    // 更新用户状态为封禁（state=99）
    await db.prepare(`
      UPDATE characters SET state = 99, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(target.wallet_address).run();

    return success(c, {
      banned: true,
      walletAddress: target.wallet_address,
      targetName: target.name,
      reason: banReason,
      durationDays,
      banUntil,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== POST /admin/unban-user - 解封用户 ====================

app.post('/unban-user', async (c) => {
  const adminAddress = await verifyAdminAuth(c);
  if (!adminAddress) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const targetAddress = body.walletAddress as string;
    const targetUserName = body.userName as string;

    if (!targetAddress && !targetUserName) {
      return error(c, 'walletAddress or userName is required');
    }

    let walletToUnban = targetAddress;
    let targetName = '';
    if (!walletToUnban) {
      const user: any = await db.prepare(`SELECT wallet_address, name FROM characters WHERE name = ?`).bind(targetUserName).first();
      if (!user) return error(c, 'User not found', 404);
      walletToUnban = user.wallet_address;
      targetName = user.name;
    } else {
      const user: any = await db.prepare(`SELECT name FROM characters WHERE wallet_address = ?`).bind(walletToUnban).first();
      if (user) targetName = user.name;
    }

    // 标记 ban 记录为非活跃（软删除，保留历史记录）
    await db.prepare(`
      UPDATE user_bans SET is_active = 0
      WHERE wallet_address = ? AND is_active = 1
    `).bind(walletToUnban).run();

    // 写入管理员操作日志
    await db.prepare(`
      INSERT INTO admin_logs (admin_address, action, target_address, target_name, details)
      VALUES (?, 'unban_user', ?, ?, '{}')
    `).bind(adminAddress, walletToUnban, targetName).run();

    // 恢复用户状态
    await db.prepare(`
      UPDATE characters SET state = 0, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletToUnban).run();

    return success(c, {
      unbanned: true,
      walletAddress: walletToUnban,
      targetName,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

// ==================== GET /admin/currency-rank - 货币排行榜分页 ====================
// 参考 BLL.User.GetCurrencyRankByPageNum()
// type: 1=用户排名, 2=金币排名, 3=武将排名
// pageSize: 每页数量
// serverUnit: 区服标识 (参考 C# serverUnit 参数)

app.get('/currency-rank', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ success: false, error: 'Database not configured' }, 503);
  }

  try {
    const type = c.req.query('type') || '1';
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20')));
    const serverUnit = c.req.query('serverUnit') || '1'; // 默认区服1

    let rankData: any[] = [];

    if (type === '1') {
      // 用户排名 - 按等级/经验排名
      const users = await db.prepare(`
        SELECT wallet_address as UserName, level as UserValue
        FROM characters
        ORDER BY level DESC, exp DESC
        LIMIT ?
      `).bind(pageSize).all() as any;
      rankData = (users.results || []).map((u: any, idx: number) => ({
        RankID: idx + 1,
        UserName: u.UserName,
        UserValue: u.UserValue,
      }));
    } else if (type === '2') {
      // 金币排名 - 按金币数量排名
      const goldRanks = await db.prepare(`
        SELECT wallet_address as UserName, gold as UserValue
        FROM characters
        ORDER BY gold DESC
        LIMIT ?
      `).bind(pageSize).all() as any;
      rankData = (goldRanks.results || []).map((u: any, idx: number) => ({
        RankID: idx + 1,
        UserName: u.UserName,
        UserValue: u.UserValue,
      }));
    } else if (type === '3') {
      // 武将排名 - 按武将战力/等级排名
      const heroRanks = await db.prepare(`
        SELECT wallet_address as UserName, level as UserValue
        FROM heroes
        ORDER BY level DESC, attack DESC
        LIMIT ?
      `).bind(pageSize).all() as any;
      rankData = (heroRanks.results || []).map((u: any, idx: number) => ({
        RankID: idx + 1,
        UserName: u.UserName,
        UserValue: u.UserValue,
      }));
    }
    // type === '4' 预留，返回空

    return success(c, {
      type: parseInt(type),
      pageSize,
      serverUnit,
      ranks: rankData,
    });
  } catch (err: any) {
    return error(c, err.message, 500);
  }
});

export default app;
