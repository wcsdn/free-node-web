/**
 * 商城路由 - D1数据库版本
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

// 根路径 - 获取商城物品
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  // shop.json 是对象格式 { "1": {...}, "2": {...} }
  const items = Object.entries(shopConfigs as Record<string, any>).map(([id, item]) => ({
    id: parseInt(id),
    name: item.Name || item.name,
    type: item.Type || item.type,
    price: item.Price || item.price,
    description: item.Description || item.description || '',
  }));

  return success(c, items);
});

// 购买物品
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item = (shopConfigs as Record<string, any>)[item_id];
    if (!item) return error(c, 'Item not found');

    const price = (item.Price || item.price) * (count || 1);

    // 扣钱并添加到背包
    const charResult = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!charResult || (charResult as any).gold < price) {
      return error(c, 'Not enough gold');
    }

    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    await db.prepare(`
      INSERT OR REPLACE INTO inventory (wallet_address, item_id, count)
      VALUES (?, ?, COALESCE((SELECT count FROM inventory WHERE wallet_address = ? AND item_id = ?) + ?, ?))
    `).bind(walletAddress, item_id, walletAddress, item_id, count || 1, count || 1).run();

    return success(c, { 
      itemId: item_id, 
      count: count || 1,
      price,
      message: 'Item purchased' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 使用物品
app.post('/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const inv = await db.prepare(`
      SELECT * FROM inventory WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, item_id).first();

    if (!inv || (inv as any).count < (count || 1)) {
      return error(c, 'Not enough items');
    }

    await db.prepare(`
      UPDATE inventory SET count = count - ? WHERE wallet_address = ? AND item_id = ?
    `).bind(count || 1, walletAddress, item_id).run();

    return success(c, { itemId: item_id, count: count || 1, message: 'Item used' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 出售物品
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const inv = await db.prepare(`
      SELECT * FROM inventory WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, item_id).first();

    if (!inv || (inv as any).count < (count || 1)) {
      return error(c, 'Not enough items');
    }

    const item = (shopConfigs as Record<string, any>)[item_id];
    const sellPrice = Math.floor((item.Price || item.price) * 0.5) * (count || 1);

    await db.prepare(`
      UPDATE inventory SET count = count - ? WHERE wallet_address = ? AND item_id = ?
    `).bind(count || 1, walletAddress, item_id).run();

    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(sellPrice, walletAddress).run();

    return success(c, { itemId: item_id, count: count || 1, price: sellPrice, message: 'Item sold' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
