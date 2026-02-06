/**
 * 签到路由 (别名)
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

    return success(c, {
      signedIn: !!signin,
      signinDays: 0,
      today
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const today = new Date().toISOString().split('T')[0];
    
    await db.prepare(`
      INSERT OR IGNORE INTO daily_signin (wallet_address, signin_date, consecutive_days, reward_gold)
      VALUES (?, ?, 1, 100)
    `).bind(walletAddress, today).run();

    return success(c, { message: 'Signin recorded' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
