/**
 * Battle Route - 战斗路由 (重构版)
 * 简化版：只保留核心战斗功能
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

// 简易战斗计算
function simpleBattle(attackerPower: number, defenderPower: number): { win: boolean; damage: number } {
  const powerRatio = attackerPower / defenderPower;
  const win = powerRatio >= 0.7; // 70% 把握
  const damage = Math.floor(Math.random() * 50) + 20;
  return { win, damage: win ? damage : damage * 2 };
}

// 获取战斗记录
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const battles = await db.prepare(`
      SELECT * FROM battles WHERE attacker_address = ? OR defender_address = ?
      ORDER BY created_at DESC LIMIT 50
    `).bind(walletAddress, walletAddress).all();

    return success(c, battles.results || []);
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// 获取战斗力
app.get('/power', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? AND state IN (0, 1)
    `).bind(walletAddress).all();

    const power = (heroes.results || []).reduce((sum: number, h: any) => {
      const qualityBonus = 1 + (h.quality - 1) * 0.2;
      const levelBonus = 1 + (h.level - 1) * 0.1;
      return sum + Math.floor((h.atk * 2 + h.def * 2 + h.hp) * qualityBonus * levelBonus);
    }, 0);

    return success(c, { power, heroes: heroes.results || [] });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// PVE 战斗
app.post('/pve', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { enemy_id, hero_ids } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取武将战斗力
    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE id IN (${hero_ids?.join(',') || 0})
    `).all();

    const attackerPower = (heroes.results || []).reduce((sum: number, h: any) => {
      return sum + (h.atk * 2 + h.def * 2 + h.hp);
    }, 0);

    // 敌方配置
    const enemyPower = (enemy_id || 1) * 100;
    const { win, damage } = simpleBattle(attackerPower, enemyPower);

    // 记录战斗
    await db.prepare(`
      INSERT INTO battles (wallet_address, battle_type, enemy_name, enemy_level, result, damage_dealt, damage_taken, reward_exp)
      VALUES (?, 'pve', ?, ?, ?, ?, ?, ?)
    `).bind(walletAddress, `敌人${enemy_id}`, enemy_id || 1, win ? 'win' : 'lose', damage, damage / 2, win ? 50 : 10).run();

    // 更新武将经验
    if (win) {
      for (const hero of (heroes.results || [])) {
        await db.prepare(`
          UPDATE heroes SET exp = exp + 50, level = exp / 500 + 1 WHERE id = ?
        `).bind((hero as any).id).run();
      }
    }

    return success(c, { win, damage, expGained: win ? 50 : 10 });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

// PVP 战斗
app.post('/pvp', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { target_wallet } = await c.req.json();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取双方战斗力
    const [myHeroes, targetHeroes] = await Promise.all([
      db.prepare(`SELECT * FROM heroes WHERE wallet_address = ? AND state IN (0, 1)`).bind(walletAddress).all(),
      db.prepare(`SELECT * FROM heroes WHERE wallet_address = ? AND state IN (0, 1)`).bind(target_wallet).all(),
    ]);

    const myPower = (myHeroes.results || []).reduce((sum: number, h: any) => sum + (h.atk * 2 + h.def * 2 + h.hp), 0);
    const targetPower = (targetHeroes.results || []).reduce((sum: number, h: any) => sum + (h.atk * 2 + h.def * 2 + h.hp), 0);

    const { win, damage } = simpleBattle(myPower, targetPower);

    // 记录战斗
    await db.prepare(`
      INSERT INTO battles (wallet_address, battle_type, enemy_name, result, damage_dealt, damage_taken)
      VALUES (?, 'pvp', ?, ?, ?, ?)
    `).bind(walletAddress, target_wallet.substring(0, 8), win ? 'win' : 'lose', damage, damage).run();

    return success(c, { win, damage });
  } catch (err) {
    return error(c, (err as Error).message);
  }
});

export default app;
