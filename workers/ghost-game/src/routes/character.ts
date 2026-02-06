/**
 * 角色路由 - D1数据库版本
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 根路径 - 获取角色信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character) {
      // 自动注册新角色
      const charName = `玩家_${walletAddress.substring(2, 8)}`;
      await db.prepare(`
        INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level)
        VALUES (?, ?, 1, 0, 1000, 0)
      `).bind(walletAddress, charName).run();

      return success(c, {
        walletAddress,
        name: charName,
        level: 1,
        exp: 0,
        gold: 1000,
        vipLevel: 0,
        autoCreated: true,
        message: '自动创建角色成功'
      });
    }

    return success(c, {
      walletAddress: character.wallet_address,
      name: character.name,
      level: character.level,
      exp: character.exp,
      gold: character.gold,
      vipLevel: character.vip_level,
      createdAt: character.created_at,
      lastLogin: character.last_login
    });
  } catch (err: any) {
    console.error('Get character error:', err);
    return error(c, err.message || '获取角色失败');
  }
});

// 创建角色 (如果需要手动创建)
app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name } = await c.req.json();
  if (!name || name.length < 2 || name.length > 12) {
    return error(c, 'Name must be 2-12 characters');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const existing = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existing) return error(c, 'Character already exists');

    await db.prepare(`
      INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level)
      VALUES (?, ?, 1, 0, 1000, 0)
    `).bind(walletAddress, name).run();

    return success(c, {
      walletAddress,
      name,
      level: 1,
      gold: 1000,
      message: 'Character created successfully'
    });
  } catch (err: any) {
    console.error('Create character error:', err);
    return error(c, err.message || '创建角色失败');
  }
});

// 获取角色信息 (兼容旧路径)
app.get('/info', async (c) => {
  return c.redirect('/api/character');
});

// 更新登录时间
app.post('/login', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE characters SET last_login = CURRENT_TIMESTAMP WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: 'Login recorded' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
