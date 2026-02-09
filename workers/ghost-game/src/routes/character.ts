/**
 * Character Route - 角色路由
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import type { Character, ServiceResult } from '../models';
import { verifyWalletAuth } from '../utils/auth';
import { characterService } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status?: number) {
  return c.json({ success: false, error: message }, status as number);
}

// 类型守卫：检查是否是错误结果
function isErrorResult<T>(result: ServiceResult<T>): result is { ok: false; error: string; status?: number } {
  return !result.ok;
}

// GET /api/character - 获取角色信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await characterService.getInfo(db, walletAddress);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  const ch = result.data;
  return success(c, {
    walletAddress: ch.wallet_address,
    name: ch.name,
    level: ch.level,
    exp: ch.exp,
    gold: ch.gold,
    vipLevel: ch.vip_level,
    createdAt: ch.created_at,
    lastLogin: ch.last_login,
  });
});

// POST /api/character - 创建角色 (手动)
app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { name } = await c.req.json();
  if (!name || name.length < 2 || name.length > 12) {
    return error(c, 'Name must be 2-12 characters');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const exists = await characterService.exists(db, walletAddress);
  if (exists) return error(c, 'Character already exists');

  try {
    await db.prepare(`
      INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level)
      VALUES (?, ?, 1, 0, 1000, 0)
    `).bind(walletAddress, name).run();

    return success(c, { walletAddress, name, level: 1, gold: 1000 });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// GET /api/character/info - 获取角色信息 (兼容旧版)
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await characterService.getOrCreate(db, walletAddress);
  if (isErrorResult(result)) return error(c, result.error, result.status);

  const { character, isNew } = result.data;
  return c.json({
    success: true,
    data: {
      walletAddress: character.wallet_address,
      name: character.name,
      level: character.level,
      exp: character.exp,
      gold: character.gold,
      vipLevel: character.vip_level,
      autoCreated: isNew,
    },
  });
});

// POST /api/character/login - 更新登录时间
app.post('/login', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE characters SET last_login = CURRENT_TIMESTAMP
      WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: 'Login recorded' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
