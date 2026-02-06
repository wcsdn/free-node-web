/**
 * 市场路由 - D1数据库版本
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

// 根路径 - 获取市场物品
app.get('/', async (c) => {
  // 模拟市场物品
  const items = [
    { id: 1, name: '粮食', price: 10, sellPrice: 8, type: 'resource' },
    { id: 2, name: '铁矿', price: 20, sellPrice: 15, type: 'resource' },
    { id: 3, name: '木材', price: 15, sellPrice: 10, type: 'resource' },
    { id: 4, name: '初级经验书', price: 100, sellPrice: 50, type: 'item' },
    { id: 5, name: '中级经验书', price: 300, sellPrice: 150, type: 'item' },
  ];

  return success(c, items);
});

// 购买
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  return success(c, { itemId: item_id, count: count || 1, message: 'Purchased' });
});

// 出售
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  return success(c, { itemId: item_id, count: count || 1, message: 'Sold' });
});

export default app;
