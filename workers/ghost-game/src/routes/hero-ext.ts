/**
 * Hero Extended Routes - 武将系统扩展接口
 * 包含：缘分、觉醒、突破、兵种适性、伤病、技能升级
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { HeroServiceExtension, HERO_FATE_CONFIG, HERO_AWAKE_CONFIG, HERO_QUALITY突破_CONFIG, HERO_UNIT_ADAPT, HERO_RECOVER_CONFIG, HERO_SKILL_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 武将缘分 ====================

// 获取缘分配置
app.get('/fate/config', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new HeroServiceExtension(db);
  const result = await service.getFateConfig();

  return success(c, result);
});

// 检查缘分激活
app.post('/fate/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_ids } = await c.req.json();
  if (!hero_ids || !Array.isArray(hero_ids)) {
    return error(c, 'hero_ids is required and must be an array');
  }

  const service = new HeroServiceExtension(db);
  const result = await service.checkFateActivation(walletAddress, hero_ids);

  return success(c, result);
});

// 计算缘分加成
app.get('/fate/bonus', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new HeroServiceExtension(db);
  const result = await service.calculateFateBonus(walletAddress);

  return success(c, result);
});

// ==================== 武将觉醒 ====================

// 获取觉醒配置
app.get('/awake/config', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new HeroServiceExtension(db);
  const result = await service.getAwakeConfig();

  return success(c, result);
});

// 检查觉醒条件
app.post('/awake/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json();
  if (!hero_id) return error(c, 'hero_id is required');

  const service = new HeroServiceExtension(db);
  const result = await service.checkAwake(walletAddress, hero_id);

  return success(c, result);
});

// 执行觉醒
app.post('/awake', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json();
  if (!hero_id) return error(c, 'hero_id is required');

  const service = new HeroServiceExtension(db);
  const result = await service.awakeHero(walletAddress, hero_id);

  if (!result.success) {
    const errorResult = result as { success: false; error: string };
    return error(c, errorResult.error);
  }

  return success(c, result);
});

// ==================== 资质突破 ====================

// 获取突破配置
app.get('/breakthrough/config', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new HeroServiceExtension(db);
  const result = await service.getBreakthroughConfig();

  return success(c, result);
});

// 检查突破条件
app.post('/breakthrough/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json();
  if (!hero_id) return error(c, 'hero_id is required');

  const service = new HeroServiceExtension(db);
  const result = await service.checkBreakthrough(walletAddress, hero_id);

  return success(c, result);
});

// 执行突破
app.post('/breakthrough', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json();
  if (!hero_id) return error(c, 'hero_id is required');

  const service = new HeroServiceExtension(db);
  const result = await service.breakthroughHero(walletAddress, hero_id);

  if (!result.success) {
    const errorResult = result as { success: false; error: string };
    return error(c, errorResult.error);
  }

  return success(c, result);
});

// ==================== 兵种适性 ====================

// 获取兵种适性配置
app.get('/unit-adapt/config', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const service = new HeroServiceExtension(db);
  const result = await service.getUnitAdaptConfig();

  return success(c, result);
});

// 获取武将兵种适性
app.get('/unit-adapt/:heroId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const heroId = parseInt(c.req.param('heroId'));
  const { unit_type } = await c.req.json();
  if (!unit_type) return error(c, 'unit_type is required');

  const service = new HeroServiceExtension(db);
  const result = await service.getHeroUnitAdapt(walletAddress, heroId, unit_type);

  return success(c, result);
});

// 检查适性提升
app.post('/unit-adapt/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id, unit_type } = await c.req.json();
  if (!hero_id || !unit_type) return error(c, 'hero_id and unit_type are required');

  const service = new HeroServiceExtension(db);
  const result = await service.getHeroUnitAdapt(walletAddress, hero_id, unit_type);

  return success(c, result);
});

// 提升兵种适性
app.post('/unit-adapt/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id, unit_type } = await c.req.json();
  if (!hero_id || !unit_type) return error(c, 'hero_id and unit_type are required');

  const service = new HeroServiceExtension(db);
  const result = await service.upgradeUnitAdapt(walletAddress, hero_id, unit_type);

  if (!result.success) {
    const errorResult = result as { success: false; error: string };
    return error(c, errorResult.error);
  }

  return success(c, result);
});

// ==================== 伤病恢复 ====================

// 获取伤病状态
app.get('/injury/:heroId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const heroId = parseInt(c.req.param('heroId'));
  const service = new HeroServiceExtension(db);
  const result = await service.getHeroInjuryStatus(walletAddress, heroId);

  return success(c, result);
});

// 使用恢复道具
app.post('/injury/recover', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id, item_id } = await c.req.json();
  if (!hero_id || !item_id) return error(c, 'hero_id and item_id are required');

  const service = new HeroServiceExtension(db);
  const result = await service.useRecoverItem(walletAddress, hero_id, item_id);

  if (!result.success) {
    return error(c, result.error);
  }

  return success(c, result);
});

// ==================== 技能升级 ====================

// 获取武将技能信息
app.get('/skills/:heroId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const heroId = parseInt(c.req.param('heroId'));
  const service = new HeroServiceExtension(db);
  const result = await service.getHeroSkills(walletAddress, heroId);

  return success(c, result);
});

// 检查技能升级
app.post('/skills/upgrade/check', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id, skill_slot } = await c.req.json();
  if (!hero_id || skill_slot === undefined) return error(c, 'hero_id and skill_slot are required');

  const service = new HeroServiceExtension(db);
  const result = await service.checkSkillUpgrade(walletAddress, hero_id, skill_slot);

  return success(c, result);
});

// 升级技能
app.post('/skills/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id, skill_slot } = await c.req.json();
  if (!hero_id || skill_slot === undefined) return error(c, 'hero_id and skill_slot are required');

  const service = new HeroServiceExtension(db);
  const result = await service.upgradeSkill(walletAddress, hero_id, skill_slot);

  if (!result.success) {
    const errorResult = result as { success: false; error: string };
    return error(c, errorResult.error);
  }

  return success(c, result);
});

export default app;
