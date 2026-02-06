/**
 * 物品合成路由 - D1数据库版本
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

// 根路径 - 获取合成配方
app.get('/', async (c) => {
  const recipes = [
    { id: 1, name: '初级药剂', inputs: { 1: 5, 2: 3 }, output: { itemId: 101, count: 1 }, outputGold: 50 },
    { id: 2, name: '中级药剂', inputs: { 1: 10, 2: 8, 3: 5 }, output: { itemId: 102, count: 1 }, outputGold: 150 },
    { id: 3, name: '高级药剂', inputs: { 1: 20, 2: 15, 3: 10, 4: 5 }, output: { itemId: 103, count: 1 }, outputGold: 400 },
  ];

  return success(c, recipes);
});

// 合成
app.post('/craft', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { recipe_id } = await c.req.json();
  if (!recipe_id) return error(c, 'Missing recipe_id');

  return success(c, { recipeId: recipe_id, message: 'Item crafted' });
});

export default app;
