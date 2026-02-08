/**
 * Arena Route - 竞技场路由 (重构版)
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

// 获取竞技场信息
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
      FROM characters ORDER BY power DESC LIMIT 100
    `).all();

    const myPower = await db.prepare(`
      SELECT COALESCE(SUM(attack + defense + hp), 0) as power FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const myRecords = await db.prepare(`
      SELECT * FROM arena_records WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 10
    `).bind(walletAddress).all();

    const myRank = rankings.results?.findIndex((r: any) => r.wallet_address === walletAddress) + 1 || 999;

    return success(c, {
      myRank,
      myPower: (myPower as any)?.power || 0,
      score: 1000 + Math.max(0, 1000 - myRank * 10),
      rankings: rankings.results || [],
      records: myRecords.results || [],
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
