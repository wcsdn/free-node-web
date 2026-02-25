/**
 * 竞技场路由 - 简化版
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  return c.json({ success: true, data: { message: 'OK' } });
});

app.post('/', async (c) => {
  return c.json({ success: true, data: { message: 'OK' } });
});

// GetArena - GET /arena/info
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { pos = '1' } = c.req.query();

  return c.json({
    success: true,
    data: {
      position: parseInt(pos as string) || 1,
      status: 'open',
      opponents: [
        { name: '挑战者A', level: 10, power: 5000 },
        { name: '挑战者B', level: 15, power: 8000 },
        { name: '挑战者C', level: 20, power: 12000 },
      ],
      myRank: 999,
      challengeTimes: 10,
      maxTimes: 10,
    }
  });
});

// GetArenaTimes - GET /arena/times
app.get('/times', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({
    success: true,
    data: {
      remaining: 10,
      max: 10,
      lastChallengeTime: null,
      resetTime: '00:00:00'
    }
  });
});

export default app;
