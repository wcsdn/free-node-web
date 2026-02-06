/**
 * 每日签到路由 - D1数据库版本
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

// 根路径 - 获取签到信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const today = new Date().toISOString().split('T')[0];
    const signin = await db.prepare(`
      SELECT * FROM daily_signin WHERE wallet_address = ? AND signin_date = ?
    `).bind(walletAddress, today).first();

    const lastSignin = await db.prepare(`
      SELECT * FROM daily_signin WHERE wallet_address = ? ORDER BY signin_date DESC LIMIT 1
    `).bind(walletAddress).first();

    return success(c, {
      signedIn: !!signin,
      signedToday: !!signin,
      consecutiveDays: (lastSignin as any)?.consecutive_days || 0,
      today,
      rewardGold: 100
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 签到
app.post('/signin', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const lastSignin = await db.prepare(`
      SELECT * FROM daily_signin WHERE wallet_address = ? ORDER BY signin_date DESC LIMIT 1
    `).bind(walletAddress).first();

    let consecutiveDays = 1;
    if (lastSignin) {
      const lastDate = new Date((lastSignin as any).signin_date);
      const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      consecutiveDays = diffDays === 1 ? (lastSignin as any).consecutive_days + 1 : 1;
    }

    await db.prepare(`
      INSERT OR REPLACE INTO daily_signin (wallet_address, signin_date, consecutive_days, reward_gold)
      VALUES (?, ?, ?, ?)
    `).bind(walletAddress, today, consecutiveDays, 100).run();

    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(100, walletAddress).run();

    return success(c, {
      consecutiveDays,
      rewardGold: 100,
      message: 'Signin successful!'
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取签到记录
app.get('/history', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const history = await db.prepare(`
      SELECT * FROM daily_signin WHERE wallet_address = ? ORDER BY signin_date DESC LIMIT 30
    `).bind(walletAddress).all();

    return success(c, history.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
