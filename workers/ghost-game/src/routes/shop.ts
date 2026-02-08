/**
 * Shop Route - 商城路由 (重构版)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import shopConfigs from '../config/shop.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取商城物品列表
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const type = c.req.query('type') || '1';
  const typeNum = parseInt(type);

  const items = Object.entries(shopConfigs as Record<string, any>).map(([id, item]) => ({
    id: parseInt(id),
    name: item.Name || item.name,
    type: item.Type || item.type,
    price: item.Price || item.price,
    description: item.Description || item.description || '',
    icon: item.Image || item.Icon,
  }));

  const filtered = type ? items.filter(i => i.type === typeNum) : items;

  return success(c, { items: filtered, total: filtered.length, type: typeNum });
});

// 购买物品
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item = (shopConfigs as Record<string, any>)[item_id];
    if (!item) return error(c, 'Item not found');

    const price = (item.Price || item.price) * count;

    // 扣钱
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    // 添加物品
    await db.prepare(`
      INSERT INTO items (wallet_address, config_id, count, source)
      VALUES (?, ?, ?, 'shop')
    `).bind(walletAddress, item_id, count).run();

    return success(c, { itemId: item_id, count, price, message: 'Purchased' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 出售物品
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item = (shopConfigs as Record<string, any>)[item_id];
    const sellPrice = Math.floor((item.Price || item.price) * 0.5) * count;

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
