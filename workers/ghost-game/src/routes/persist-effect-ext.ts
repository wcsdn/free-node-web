import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { PersistEffectServiceExtension, EFFECT_TYPES, EFFECT_CATEGORIES } from '../services';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) { return c.json({ success: true, data }); }
function error(c: any, msg: string) { return c.json({ success: false, error: msg }); }

// 获取所有效果
app.get('/list', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new PersistEffectServiceExtension(db).getAllEffects(wallet);
  return success(c, result);
});

// 获取武将效果
app.get('/hero/:heroId', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const heroId = parseInt(c.req.param('heroId'));
  const result = await new PersistEffectServiceExtension(db).getHeroEffects(wallet, heroId);
  return success(c, result);
});

// 计算综合效果
app.get('/calculate', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const result = await new PersistEffectServiceExtension(db).calculateTotalEffects(wallet);
  return success(c, result);
});

// 计算战斗属性加成
app.get('/combat-bonus', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { hero_id } = c.req.query();
  const result = await new PersistEffectServiceExtension(db).calculateCombatBonus(wallet, hero_id ? parseInt(hero_id) : undefined);
  return success(c, result);
});

// 应用效果
app.post('/apply', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { category, type, value, duration, source, hero_id, stackable } = await c.req.json();
  const result = await new PersistEffectServiceExtension(db).applyEffect(wallet, {
    category, type, value, duration, source, heroId: hero_id, stackable
  });
  return success(c, result);
});

// 移除效果
app.post('/remove', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { effect_id, hero_id } = await c.req.json();
  const result = await new PersistEffectServiceExtension(db).removeEffect(wallet, effect_id, hero_id);
  return success(c, result);
});

// 清除所有效果
app.post('/clear', async (c) => {
  const wallet = await verifyWalletAuth(c); if (!wallet) return error(c, 'Unauthorized');
  const db = c.env.DB; if (!db) return error(c, 'DB error');
  const { hero_id } = await c.req.json();
  const result = await new PersistEffectServiceExtension(db).clearAllEffects(wallet, hero_id);
  return success(c, result);
});

export default app;
