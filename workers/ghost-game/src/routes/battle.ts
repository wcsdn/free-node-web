/**
 * 战斗路由 - 增强版 (v2.0)
 * 
 * 使用 battle-engine.ts 提供的核心战斗逻辑
 * 包含：
 * - 回合制战斗
 * - 胜负判定
 * - 奖励系统
 * - 战报生成
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import heroConfigs from '../config/heroes.json';
import skillConfigs from '../config/skills.json';
import battleDefense from '../config/battle_defense.json';
import battleTerrains from '../config/battle_terrains.json';
import {
  generateBattleRounds,
  calculateRewards,
  calculateWinRate,
  validateBattle,
  determineWinType,
  calculatePowerFromHeroes,
  DEFAULT_CONFIG,
  type BattleRound,
  type BattleReport,
  type BattleUnit,
} from '../utils/battle-engine';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 基础功能 ====================

// 获取战斗记录列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const battles = await db.prepare(`
      SELECT * FROM battles 
      WHERE attacker_address = ? OR defender_address = ?
      ORDER BY created_at DESC 
      LIMIT 50
    `).bind(walletAddress, walletAddress).all();

    return success(c, battles.results || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取战斗报告详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const battleId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const battle = await db.prepare(`
      SELECT * FROM battles 
      WHERE id = ? AND (attacker_address = ? OR defender_address = ?)
    `).bind(battleId, walletAddress, walletAddress).first();

    if (!battle) return error(c, 'Battle not found', 404);

    // 解析战报
    if (battle.report && typeof battle.report === 'string') {
      battle.report = JSON.parse(battle.report);
    }

    return success(c, battle);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== 战斗力系统 ====================

// 计算战斗力
app.get('/power', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? AND state IN (0, 1)
    `).bind(walletAddress).all();

    const totalPower = calculatePowerFromHeroes(heroes.results || [], heroConfigs);
    
    const heroDetails = (heroes.results || []).map((hero: any) => {
      const portrait = (heroConfigs.Portrait || []).find((p: any) => p.Index === hero.config_id);
      const ability = (heroConfigs.Ability || []).find((a: any) => a.Index === portrait?.AbilityIndex);
      
      const qualityBonus = 1 + (hero.quality - 1) * 0.2;
      const levelBonus = 1 + (hero.level - 1) * 0.1;
      
      return {
        id: hero.id,
        name: hero.name,
        level: hero.level,
        quality: hero.quality,
        stats: {
          attack: Math.floor((ability?.Attack || 10) * qualityBonus * levelBonus),
          defense: Math.floor((ability?.Defence || 8) * qualityBonus * levelBonus),
          hp: Math.floor((ability?.MaxHp || 100) * qualityBonus * levelBonus),
        },
        portrait: portrait?.Icon || '',
      };
    });

    return success(c, {
      totalPower,
      heroCount: heroDetails.length,
      heroDetails,
      message: `战斗力 ${totalPower}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取竞技场对手列表
app.get('/arena/opponents', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const myPower = calculatePowerFromHeroes(
      (await db.prepare(`SELECT * FROM heroes WHERE wallet_address = ? AND state IN (0, 1)`).bind(walletAddress).all()).results || [],
      heroConfigs
    );
    
    const opponents = [];
    const opponentNames = ['无名侠客', '江湖散人', '绿林好汉', '流浪剑客', '隐士高人'];

    for (let i = 0; i < 5; i++) {
      const power = Math.floor(myPower * (0.8 + Math.random() * 0.4));
      opponents.push({
        id: `arena_${i}_${Date.now()}`,
        name: opponentNames[i],
        power,
        rank: 1000 + Math.floor(Math.random() * 100),
        winRate: Math.floor(40 + Math.random() * 40),
        heroCount: 3 + Math.floor(Math.random() * 3),
      });
    }

    return success(c, {
      myPower,
      opponents,
      message: `你的战斗力: ${myPower}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== PVE 战斗 ====================

// PVE 关卡战斗
app.post('/pve/dungeon', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { dungeon_id, stage_id } = await c.req.json();
  if (!dungeon_id || !stage_id) return error(c, 'Missing dungeon_id or stage_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 验证关卡
    const dungeon = await db.prepare(`
      SELECT * FROM dungeons WHERE id = ? AND stage_id = ?
    `).bind(dungeon_id, stage_id).first();

    if (!dungeon) return error(c, 'Dungeon not found');

    // 获取玩家武将
    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? AND state = 0
    `).bind(walletAddress).all();

    // 模拟敌人（从关卡配置）
    const defenderPower = (dungeon as any).difficulty * 500 || 1000;
    const attackerPower = calculatePowerFromHeroes(heroes.results || [], heroConfigs);

    const winRate = calculateWinRate(attackerPower, defenderPower);
    const isWin = Math.random() < winRate;

    const rounds = generateBattleRounds(
      heroes.results || [],
      [], // PVE 不需要防守方武将数据
      defenderPower,
      isWin
    );

    let exp = 0;
    let gold = 0;
    let items: any[] = [];

    if (isWin) {
      exp = Math.floor(DEFAULT_CONFIG.expBase * (1 + defenderPower / 2000));
      gold = Math.floor(defenderPower / 50);
    } else {
      exp = Math.floor(DEFAULT_CONFIG.expBase * 0.5);
    }

    // 保存战斗记录
    await db.prepare(`
      INSERT INTO battles 
      (attacker_address, defender_address, battle_type, result, report, dungeon_id, stage_id)
      VALUES (?, ?, 'pve', ?, ?, ?, ?)
    `).bind(walletAddress, `dungeon_${dungeon_id}`, isWin ? 'win' : 'loss', JSON.stringify({
      rounds,
      attackerPower,
      defenderPower,
      winRate,
      rewards: { exp, gold, items },
    }), dungeon_id, stage_id).run();

    // 发放奖励
    if (exp > 0) {
      await db.prepare(`
        UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
      `).bind(exp, walletAddress).run();

      for (const hero of (heroes.results || [])) {
        await db.prepare(`
          UPDATE heroes SET exp = exp + ? WHERE id = ?
        `).bind(Math.floor(exp / 2), hero.id).run();
      }
    }

    return success(c, {
      result: isWin ? 'win' : 'loss',
      dungeonId: dungeon_id,
      stageId: stage_id,
      winRate,
      rounds,
      rewards: {
        exp,
        gold,
        items,
        message: isWin ? `通关成功！获得 ${exp} 经验，${gold} 金币` : `挑战失败`,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== PVP 战斗 ====================

// 发起 PVP 战斗
app.post('/pvp/fight', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { defender_address } = await c.req.json();
  if (!defender_address) return error(c, 'Missing defender_address');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 验证防守方
    const defender = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(defender_address).first();

    if (!defender) return error(c, 'Defender not found');

    // 获取双方武将
    const attackers = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? AND state = 0
    `).bind(walletAddress).all();

    const defenders = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ? AND state = 1
    `).bind(defender_address).all();

    // 计算战斗力
    const attackerPower = calculatePowerFromHeroes(attackers.results || [], heroConfigs);
    const defenderPower = calculatePowerFromHeroes(defenders.results || [], heroConfigs);

    // 验证战斗合法性
    const validation = validateBattle(attackerPower, defenderPower);
    if (!validation.valid) {
      return error(c, validation.reason || 'Battle validation failed', 400);
    }

    // 计算胜率
    const winRate = calculateWinRate(attackerPower, defenderPower);
    const isWin = Math.random() < winRate;

    // 生成战斗回合
    const rounds = generateBattleRounds(
      attackers.results || [],
      defenders.results || [],
      defenderPower,
      isWin
    );

    // 计算奖励
    const rewards = calculateRewards(isWin, defenderPower, 'pvp');

    // 生成战报
    const winType = determineWinType(rounds, attackers.results?.length || 0, defenders.results?.length || 0);

    // 保存战斗记录
    await db.prepare(`
      INSERT INTO battles 
      (attacker_address, defender_address, battle_type, result, report)
      VALUES (?, ?, 'pvp', ?, ?)
    `).bind(walletAddress, defender_address, isWin ? 'win' : 'loss', JSON.stringify({
      rounds,
      winType,
      attackerPower,
      defenderPower,
      winRate,
      rewards,
      timestamp: new Date().toISOString(),
    })).run();

    // 发放奖励
    if (rewards.exp > 0) {
      // 更新角色经验
      await db.prepare(`
        UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
      `).bind(rewards.exp, walletAddress).run();

      // 更新武将经验
      for (const hero of (attackers.results || [])) {
        await db.prepare(`
          UPDATE heroes SET exp = exp + ? WHERE id = ?
        `).bind(Math.floor(rewards.exp / 2), hero.id).run();
      }
    }

    return success(c, {
      result: isWin ? 'win' : 'loss',
      defender: defender_address.substring(0, 8) + '...',
      winRate,
      winType,
      rounds: rounds.length,
      rewards: {
        exp: rewards.exp,
        gold: rewards.gold,
        fame: rewards.fame,
        prestige: rewards.prestige,
        message: isWin ? `胜利！获得 ${rewards.exp} 经验，${rewards.gold} 金币` : `战败`,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== 战斗录像 ====================

// 获取战斗录像
app.get('/replay/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const battleId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const battle = await db.prepare(`
      SELECT * FROM battles WHERE id = ?
    `).bind(battleId).first();

    if (!battle) return error(c, 'Battle not found', 404);

    // 检查权限
    if (battle.attacker_address !== walletAddress && battle.defender_address !== walletAddress) {
      return error(c, 'Access denied', 403);
    }

    // 解析战报
    const report = typeof battle.report === 'string' 
      ? JSON.parse(battle.report) 
      : battle.report;

    return success(c, {
      id: battle.id,
      type: battle.battle_type,
      result: battle.result,
      timestamp: battle.created_at,
      report: {
        rounds: report.rounds,
        winner: report.winner || (battle.result === 'win' ? 'attacker' : 'defender'),
        winType: report.winType,
        attackerPower: report.attackerPower,
        defenderPower: report.defenderPower,
        rewards: report.rewards,
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ==================== 战斗统计 ====================

// 获取战斗统计
app.get('/stats', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_battles,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN battle_type = 'pvp' THEN 1 ELSE 0 END) as pvp_battles,
        SUM(CASE WHEN battle_type = 'pve' THEN 1 ELSE 0 END) as pve_battles
      FROM battles 
      WHERE attacker_address = ?
    `).bind(walletAddress).first();

    const total = (stats?.total_battles as number) || 0;
    const wins = (stats?.wins as number) || 0;

    return success(c, {
      totalBattles: total,
      wins,
      losses: total - wins,
      winRate: total > 0 ? Math.floor((wins / total) * 100) : 0,
      pvpBattles: stats?.pvp_battles || 0,
      pveBattles: stats?.pve_battles || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
