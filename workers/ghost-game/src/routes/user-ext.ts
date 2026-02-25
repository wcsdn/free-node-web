import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { UserServiceExtension, SIGNIN_CONFIG, VIP_CONFIG, LEVEL_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) { return c.json({ success: true, data }); }
function error(c: any, msg: string) { return c.json({ success: false, error: msg }); }

app.get('/signin', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).getSigninInfo(wallet);
  return success(c, result);
});

app.post('/signin', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).signin(wallet);
  if (!result.success) return error(c, result.error);
  return success(c, result);
});

app.get('/vip', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).getVipInfo(wallet);
  return success(c, result);
});

app.get('/stats', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new UserServiceExtension(db).getUserStats(wallet);
  return success(c, result);
});

export default app;
