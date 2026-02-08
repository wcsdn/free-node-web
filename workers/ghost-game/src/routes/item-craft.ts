/**
 * ItemCraft Route - 物品合成路由 (重构版)
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

// 合成配方
const RECIPES = [
  { id: 1, name: '初级生命药剂', inputs: { 1: 5, 2: 3 }, output: 101, outputGold: 50 },
  { id: 2, name: '中级生命药剂', inputs: { 1: 10, 2: 8 }, output: 102, outputGold: 150 },
  { id: 3, name: '精制铁剑', inputs: { 201: 3, 202: 2 }, output: 20101, outputGold: 100 },
  { id: 4, name: '精制皮甲', inputs: { 203: 3, 204: 2 }, output: 20201, outputGold: 100 },
];

// 获取合成列表
app.get('/', async (c) => {
  return success(c, { recipes: RECIPES, total: RECIPES.length });
});

// 执行合成
app.post('/craft', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { recipe_id } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const recipe = RECIPES.find(r => r.id === parseInt(recipe_id));
    if (!recipe) return error(c, 'Recipe not found');

    // 检查材料
    for (const [itemId, count] of Object.entries(recipe.inputs)) {
      const item: any = await db.prepare(`
        SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
      `).bind(walletAddress, itemId).first();

      if (!item || (item as any).count < count) {
        return error(c, `Not enough materials: ${itemId}`);
      }
    }

    // 扣除材料
    for (const [itemId, count] of Object.entries(recipe.inputs)) {
      await db.prepare(`
        UPDATE items SET count = count - ? WHERE wallet_address = ? AND config_id = ?
      `).bind(count, walletAddress, itemId).run();
    }

    // 添加产物
    await db.prepare(`
      INSERT INTO items (wallet_address, config_id, count, source)
      VALUES (?, ?, ?, 'craft')
    `).bind(walletAddress, recipe.output, 1).run();

    return success(c, { name: recipe.name, output: recipe.output, message: 'Crafted' });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
