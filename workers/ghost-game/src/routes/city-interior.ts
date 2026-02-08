/**
 * CityInterior Route - 繁荣度系统路由 (重构版)
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

// 繁荣度配置
const PROSPERITY_THRESHOLDS = [150, 350, 600, 900, 1300, 1800, 2500, 3500, 4800, 6500, 8800, 11900, 16200, 22000, 29800, 40400, 54700, 74000, 100000];
const PROSPERITY_NAMES = ['平民', '秀才', '举人', '进士', '知县', '知府', '道台', '按察使', '布政使', '巡抚', '总督', '提督', '将军', '都督', '司马', '太尉', '司空', '司徒', '丞相', '皇帝'];

// 获取繁荣度信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const prosperity = city.prosperity || 0;
    let level = 1;
    for (let i = 0; i < PROSPERITY_THRESHOLDS.length; i++) {
      if (PROSPERITY_THRESHOLDS[i] > prosperity) { level = i + 1; break; }
    }
    if (prosperity >= PROSPERITY_THRESHOLDS[PROSPERITY_THRESHOLDS.length - 1]) level = PROSPERITY_THRESHOLDS.length + 1;

    return success(c, {
      prosperity,
      level,
      name: PROSPERITY_NAMES[level - 1] || '未知',
      nextThreshold: PROSPERITY_THRESHOLDS[level - 1] || null,
      resources: {
        moneyCap: 30000 * level,
        foodCap: 30000 * level,
        populationCap: 300 * level,
      },
    });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 提升繁荣度
app.post('/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { prosperity } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE cities SET prosperity = prosperity + ? WHERE wallet_address = ?
    `).bind(prosperity || 10, walletAddress).run();

    return success(c, { message: 'Prosperity increased' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
