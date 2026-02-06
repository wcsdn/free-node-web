/**
 * 竞技场路由 - D1数据库版本
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

// 根路径 - 获取竞技场信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取排名
    const rankings = await db.prepare(`
      SELECT wallet_address, name, level, 
        (SELECT COALESCE(SUM(attack + defense + hp), 0) FROM heroes WHERE wallet_address = characters.wallet_address) as power
      FROM characters
      ORDER BY power DESC LIMIT 100
    `).all();

    // 获取自己的记录
    const myRecords = await db.prepare(`
      SELECT * FROM arena_records WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 10
    `).bind(walletAddress).all();

    const myRank = rankings.results?.findIndex((r: any) => r.wallet_address === walletAddress) + 1 || 0;

    return success(c, {
      rank: myRank || 999,
      score: 1000,
      winCount: myRecords.results?.filter((r: any) => r.result === 'win').length || 0,
      totalCount: myRecords.results?.length || 0,
      rankings: rankings.results || [],
      recentRecords: myRecords.results || []
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发起挑战
app.post('/challenge', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { opponent_address } = await c.req.json();
  if (!opponent_address) return error(c, 'Missing opponent_address');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const win = Math.random() > 0.5;
    const reward = win ? 50 : 10;

    await db.prepare(`
      INSERT INTO arena_records (wallet_address, opponent_address, opponent_name, result, reward, rounds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(walletAddress, opponent_address, '对手', win ? 'win' : 'loss', reward, Math.floor(Math.random() * 5) + 1).run();

    return success(c, {
      result: win ? 'win' : 'loss',
      reward,
      message: win ? 'Victory!' : 'Defeated'
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
