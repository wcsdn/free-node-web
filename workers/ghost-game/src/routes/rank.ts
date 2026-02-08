/**
 * Rank Route - 排行榜路由 (重构版)
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

// 获取排行榜
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type = 'level' } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let orderBy: string;
    switch (type) {
      case 'power':
        orderBy = '(attack * 2 + defense * 2 + hp) DESC';
        break;
      case 'wealth':
        orderBy = 'gold DESC';
        break;
      default:
        orderBy = 'level DESC';
    }

    const result = await db.prepare(`
      SELECT id, name, level, gold, attack, defense, hp, created_at
      FROM characters ORDER BY ${orderBy} LIMIT 100
    `).all();

    return success(c, {
      type,
      items: (result.results || []).map((c: any, i: number) => ({
        rank: i + 1,
        id: c.id,
        name: c.name,
        level: c.level,
        gold: c.gold,
        power: c.attack * 2 + c.defense * 2 + c.hp,
      })),
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
