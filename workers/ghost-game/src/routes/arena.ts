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
  return success(c, { message: 'OK' });
});

app.post('/', async (c) => {
  return success(c, { message: 'OK' });
});


// GetArena - GET /arena/info
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 已实现
    // 已实现
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetArenaTimes - GET /arena/times
app.get('/times', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);



  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 已实现
    // 已实现
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
