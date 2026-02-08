/**
 * Market Route - 市场路由 (重构版)
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

// 市场商品配置
const COMMODITIES = [
  { id: 1, name: '木材', type: 'material', buyPrice: 10, sellPrice: 8 },
  { id: 2, name: '石料', type: 'material', buyPrice: 12, sellPrice: 9 },
  { id: 3, name: '铁锭', type: 'material', buyPrice: 20, sellPrice: 15 },
  { id: 4, name: '粮食', type: 'resource', buyPrice: 5, sellPrice: 4 },
  { id: 5, name: '丝绸', type: 'material', buyPrice: 50, sellPrice: 40 },
];

// 获取市场列表
app.get('/', async (c) => {
  return success(c, { items: COMMODITIES, total: COMMODITIES.length });
});

// 购买商品
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item = COMMODITIES.find(i => i.id === parseInt(item_id));
    if (!item) return error(c, 'Item not found');

    const totalPrice = item.buyPrice * count;

    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(totalPrice, walletAddress).run();

    await db.prepare(`
      INSERT INTO items (wallet_address, config_id, count, source)
      VALUES (?, ?, ?, 'market')
    `).bind(walletAddress, item_id, count).run();

    return success(c, { itemId: item_id, count, price: totalPrice, message: 'Purchased' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 出售商品
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item = COMMODITIES.find(i => i.id === parseInt(item_id));
    if (!item) return error(c, 'Item not found');

    const sellPrice = item.sellPrice * count;

    await db.prepare(`
      UPDATE items SET count = count - ? WHERE wallet_address = ? AND config_id = ?
    `).bind(count, walletAddress, item_id).run();

    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(sellPrice, walletAddress).run();

    return success(c, { itemId: item_id, count, price: sellPrice, message: 'Sold' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
