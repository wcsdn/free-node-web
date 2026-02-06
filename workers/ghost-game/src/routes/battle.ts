/**
 * 战斗路由 - D1数据库版本
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

// 根路径 - 获取战斗记录
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const battles = await db.prepare(`
      SELECT * FROM battles WHERE attacker_address = ? ORDER BY created_at DESC LIMIT 20
    `).bind(walletAddress).all();

    return success(c, battles.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发起战斗
app.post('/attack', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { defender_address, battle_type } = await c.req.json();
  if (!defender_address) return error(c, 'Missing defender_address');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 模拟战斗结果
    const win = Math.random() > 0.4;
    const report = {
      attacker: walletAddress.substring(0, 8),
      defender: defender_address.substring(0, 8),
      result: win ? 'victory' : 'defeat',
      rounds: Math.floor(Math.random() * 5) + 1,
      exp: win ? 50 : 10,
    };

    await db.prepare(`
      INSERT INTO battles (attacker_address, defender_address, battle_type, result, report)
      VALUES (?, ?, ?, ?, ?)
    `).bind(walletAddress, defender_address, battle_type || 'pvp', win ? 'win' : 'loss', JSON.stringify(report)).run();

    return success(c, { ...report, message: win ? 'Victory!' : 'Defeated' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取战斗报告
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const battleId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const battle = await db.prepare(`
      SELECT * FROM battles WHERE id = ? AND attacker_address = ?
    `).bind(battleId, walletAddress).first();

    if (!battle) return error(c, 'Battle not found');

    return success(c, battle);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 计算战斗力
app.get('/power', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const heroes = await db.prepare(`
      SELECT SUM(attack + defense + hp) as total FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const power = (heroes as any)?.total || 0;

    return success(c, { 
      power, 
      heroCount: 0,
      message: 'Battle power calculated' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
