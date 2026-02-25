/**
 * Item Extended Routes - 物品系统扩展接口
 * 包含：物品合成、强化、镶嵌、耐久度、分解
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { ItemServiceExtension, ITEM_TYPES_EXT, COMPOSE_RECIPES, ENHANCE_CONFIG, GEM_SLOTS, DURABILITY_CONFIG, DISMANTLE_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 物品合成 ====================

// 获取合成配方列表
app.get('/compose/recipes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { category } = c.req.query();
  const service = new ItemServiceExtension(db);
  const result = await service.getComposeRecipes(category);

  return success(c, result);
});

// 检查合成材料
app.post('/compose/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { recipe_id } = await c.req.json();
  if (!recipe_id) return error(c, 'recipe_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.checkComposeMaterials(walletAddress, recipe_id);

  return success(c, result);
});

// 执行合成
app.post('/compose', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { recipe_id } = await c.req.json();
  if (!recipe_id) return error(c, 'recipe_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.composeItem(walletAddress, recipe_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// ==================== 物品强化 ====================

// 获取强化配置
app.get('/enhance/config', async (c) => {
  const { level } = c.req.query();
  const currentLevel = parseInt(level || '0');

  const config = {
    maxLevel: ENHANCE_CONFIG.MAX_LEVEL,
    successRates: ENHANCE_CONFIG.SUCCESS_RATES,
    baseCosts: ENHANCE_CONFIG.BASE_COST,
    currentLevel,
    nextConfig: {
      level: currentLevel,
      cost: ENHANCE_CONFIG.BASE_COST[currentLevel] || 0,
      successRate: ENHANCE_CONFIG.SUCCESS_RATES[currentLevel] || 0,
    },
  };

  return success(c, config);
});

// 检查强化
app.post('/enhance/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id } = await c.req.json();
  if (!item_id) return error(c, 'item_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.checkEnhance(walletAddress, item_id, 0);

  return success(c, result);
});

// 执行强化
app.post('/enhance', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id } = await c.req.json();
  if (!item_id) return error(c, 'item_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.enhanceItem(walletAddress, item_id);

  if (!result.success) {
    const errorResult = result as { success: false; error: string };
    return error(c, errorResult.error);
  }

  return success(c, result);
});

// ==================== 镶嵌系统 ====================

// 获取镶嵌信息
app.get('/gem/slots/:itemId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const itemId = parseInt(c.req.param('itemId'));
  const service = new ItemServiceExtension(db);
  const result = await service.getGemSlots(walletAddress, itemId);

  return success(c, result);
});

// 镶嵌宝石
app.post('/gem/equip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id, gem_id, slot } = await c.req.json();
  if (!item_id || !gem_id) return error(c, 'item_id and gem_id are required');

  const service = new ItemServiceExtension(db);
  const result = await service.equipGem(walletAddress, item_id, gem_id, slot);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// 卸下宝石
app.post('/gem/unequip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { gem_id } = await c.req.json();
  if (!gem_id) return error(c, 'gem_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.unequipGem(walletAddress, gem_id);

  return success(c, result);
});

// ==================== 耐久度系统 ====================

// 获取耐久度状态
app.get('/durability/:itemId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const itemId = parseInt(c.req.param('itemId'));
  const service = new ItemServiceExtension(db);
  const result = await service.getDurability(walletAddress, itemId);

  return success(c, result);
});

// 使用物品（减少耐久度）
app.post('/durability/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id, decay } = await c.req.json();
  if (!item_id) return error(c, 'item_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.useWithDurability(walletAddress, item_id, decay);

  return success(c, result);
});

// 修理物品
app.post('/repair', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id, repair_all } = await c.req.json();
  if (!item_id) return error(c, 'item_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.repairItem(walletAddress, item_id, repair_all);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// ==================== 物品分解 ====================

// 检查分解
app.post('/dismantle/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id } = await c.req.json();
  if (!item_id) return error(c, 'item_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.checkDismantle(walletAddress, item_id);

  return success(c, result);
});

// 执行分解
app.post('/dismantle', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id } = await c.req.json();
  if (!item_id) return error(c, 'item_id is required');

  const service = new ItemServiceExtension(db);
  const result = await service.dismantleItem(walletAddress, item_id);

  if (!result.success) {
    const errorResult = result as { success: false; error: string };
    return error(c, errorResult.error);
  }

  return success(c, result);
});

export default app;
