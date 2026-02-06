/**
 * 武将路由 - D1数据库版本
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import heroConfigs from '../config/heroes.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

const HERO_STATE = {
  FREE: 0,
  GUARD: 1,
  TRAINING: 2,
  NOT_HIRED: 6,
};

// 根路径 - 获取武将列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();

    const transformedHeroes = (heroes.results || []).map((hero: any) => ({
      id: hero.id,
      name: hero.name,
      level: hero.level,
      exp: hero.exp,
      attack: hero.attack,
      defense: hero.defense,
      hp: hero.hp,
      maxHp: hero.max_hp,
      quality: hero.quality,
      state: hero.state,
      configId: hero.config_id,
      portrait: `hero_${hero.config_id}.png`,
    }));

    return success(c, transformedHeroes);
  } catch (err: any) {
    console.error('Get hero list error:', err);
    return error(c, err.message || 'Failed to get heroes');
  }
});

// 获取武将列表 (兼容旧路径)
app.get('/list', async (c) => {
  return c.redirect('/api/hero');
});

// 招募武将
app.post('/recruit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = await c.req.json();
  if (!city_id) return error(c, 'Please select a city');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(city_id, walletAddress).first();

    if (!city) return error(c, 'City not found');

    const heroCount = await db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ? AND city_id = ?
    `).bind(walletAddress, city_id).first();

    if ((heroCount as any)?.count >= 5) {
      return error(c, 'Max 5 heroes per city');
    }

    // 随机选择武将配置
    const configId = Math.floor(Math.random() * 16) + 1;
    const hero = (heroConfigs as Record<string, any>)[configId];
    const quality = configId <= 5 ? 4 : configId <= 12 ? 3 : 2;
    const bonus = 1 + quality * 0.1;

    const result = await db.prepare(`
      INSERT INTO heroes (wallet_address, city_id, name, level, exp, quality, training, hp, max_hp, attack, defense, config_id, state)
      VALUES (?, ?, ?, 1, 0, ?, 0, ?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress, city_id, 
      hero?.Name || '小兵', quality,
      Math.floor((hero?.HitPoint || 100) * bonus),
      Math.floor((hero?.HitPoint || 100) * bonus),
      Math.floor((hero?.Attack || 50) * bonus),
      Math.floor((hero?.Defense || 30) * bonus),
      configId, HERO_STATE.FREE
    ).run();

    return success(c, { 
      id: result.meta.last_row_id,
      name: hero?.Name || '小兵',
      quality,
      message: 'Hero recruited' 
    });
  } catch (err: any) {
    return error(c, err.message || 'Recruit failed');
  }
});

// 训练武将
app.post('/:id/train', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('id'));
  if (!heroId) return error(c, 'Invalid hero ID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) return error(c, 'Hero not found');

    const newLevel = (hero.level || 1) + 1;
    const newExp = (hero.exp || 0) + 100;
    const newMaxHp = Math.floor((hero.max_hp || 100) * 1.1);
    const newAttack = Math.floor((hero.attack || 10) * 1.08);
    const newDefense = Math.floor((hero.defense || 5) * 1.08);

    await db.prepare(`
      UPDATE heroes SET level = ?, exp = ?, max_hp = ?, hp = ?, attack = ?, defense = ? WHERE id = ?
    `).bind(newLevel, newExp, newMaxHp, newMaxHp, newAttack, newDefense, heroId).run();

    return success(c, { id: heroId, level: newLevel, exp: newExp });
  } catch (err: any) {
    return error(c, err.message || 'Train failed');
  }
});

export default app;
