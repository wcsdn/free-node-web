/**
 * 副本路由 - D1数据库版本
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 根路径 - 获取副本列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const dungeons = [
      { id: 1, name: '初级副本', difficulty: 1, stages: 5, recommendedPower: 100 },
      { id: 2, name: '中级副本', difficulty: 2, stages: 10, recommendedPower: 500 },
      { id: 3, name: '高级副本', difficulty: 3, stages: 15, recommendedPower: 2000 },
      { id: 4, name: '精英副本', difficulty: 4, stages: 20, recommendedPower: 5000 },
      { id: 5, name: '史诗副本', difficulty: 5, stages: 25, recommendedPower: 10000 },
    ];

    return success(c, dungeons);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 进入副本
app.post('/enter', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { dungeon_id, stage_id } = await c.req.json();
  if (!dungeon_id) return error(c, 'Missing dungeon_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城市
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    // 模拟战斗结果
    const win = Math.random() > 0.3;
    const exp = Math.floor(Math.random() * 100) + 50;
    const gold = Math.floor(Math.random() * 200) + 100;

    await db.prepare(`
      INSERT INTO dungeon_records (wallet_address, dungeon_id, stage_id, city_id, result, rounds, exp, gold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(walletAddress, dungeon_id, stage_id || 1, (city as any).id, win ? 'win' : 'loss', Math.floor(Math.random() * 5) + 1, exp, gold).run();

    if (win) {
      await db.prepare(`
        UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
      `).bind(exp, walletAddress).run();
    }

    return success(c, {
      result: win ? 'win' : 'loss',
      exp,
      gold,
      message: win ? 'Stage cleared!' : 'Failed'
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取副本进度
app.get('/progress', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const progress = await db.prepare(`
      SELECT * FROM dungeon_progress WHERE wallet_address = ?
    `).bind(walletAddress).all();

    return success(c, progress.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取副本记录
app.get('/records', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const records = await db.prepare(`
      SELECT * FROM dungeon_records WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 20
    `).bind(walletAddress).all();

    return success(c, records.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
