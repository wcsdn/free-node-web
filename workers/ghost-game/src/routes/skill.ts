/**
 * 技能路由 - 完整版 (使用 src/config/skills.json)
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import skillConfigs from '../config/skills.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取所有技能配置
app.get('/configs', async (c) => {
  const skills = Object.values(skillConfigs as Record<string, any>).map((skill: any) => ({
    id: skill.id,
    randomID: skill.randomID,
    union: skill.union,
    unionName: skill.unionName,
    name: skill.name,
    type: skill.type,
    typeText: skill.typeText,
    description: skill.description,
    probability: skill.probability,
    upProbability: skill.upProbability,
    effectId: skill.effID,
    effectValue: skill.effectValue,
    upEffectValue: skill.upEffectValue,
    effectRange: skill.effectRange,
    needItemType: skill.needItemType,
    icon: skill.icon,
  }));

  return success(c, {
    skills,
    total: skills.length,
  });
});

// 获取技能列表 (玩家拥有的技能)
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skills = await db.prepare(`
      SELECT * FROM skills WHERE wallet_address = ? ORDER BY static_index
    `).bind(walletAddress).all();

    const skillsWithConfig = (skills.results || []).map((skill: any) => {
      const config = (skillConfigs as Record<string, any>)[skill.static_index];
      
      if (config) {
        // 根据等级计算效果值
        const levelMultiplier = 1 + (skill.skill_level - 1) * 0.1;
        const currentEffect = Math.floor(config.effectValue * levelMultiplier);
        const currentProb = Math.min(100, config.probability + (skill.skill_level - 1) * config.upProbability);

        const nextMultiplier = 1 + skill.skill_level * 0.1;
        const nextEffect = Math.floor(config.effectValue * nextMultiplier);

        return {
          ...skill,
          name: config.name,
          union: config.union,
          unionName: config.unionName,
          type: config.type,
          typeText: config.typeText,
          description: config.description,
          effectId: config.effID,
          effectValue: currentEffect,
          probability: currentProb,
          effectRange: config.effectRange,
          needItemType: config.needItemType,
          icon: config.icon,
          levelInfo: {
            currentLevel: skill.skill_level,
            maxLevel: 10,
            currentEffect,
            nextEffect,
            exp: skill.exp,
            expToNext: getLevelUpExp(skill.skill_level),
          },
        };
      }
      return skill;
    });

    return success(c, {
      skills: skillsWithConfig,
      total: skillsWithConfig.length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取武将已装备的技能
app.get('/equipped/:heroId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) return error(c, 'Hero not found or not owned', 404);

    const heroSkills = await db.prepare(`
      SELECT hs.*, s.name, s.type, s.typeText, s.effectValue, s.effID, s.probability, s.description
      FROM hero_skills hs
      JOIN skills s ON hs.static_index = s.static_index
      WHERE hs.hero_id = ?
    `).bind(heroId).all();

    return success(c, {
      heroId,
      skills: heroSkills.results || [],
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 学习新技能
app.post('/learn', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { static_index } = await c.req.json();
  if (!static_index) return error(c, 'Missing static_index');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skillConfig = (skillConfigs as Record<string, any>)[static_index];
    if (!skillConfig) return error(c, 'Invalid skill static_index');

    const existing = await db.prepare(`
      SELECT * FROM skills WHERE wallet_address = ? AND static_index = ?
    `).bind(walletAddress, static_index).first();

    if (existing) return error(c, 'Already learned this skill');

    const char: any = await db.prepare(`
      SELECT level FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!char || char.level < 5) return error(c, 'Character level 5 required to learn skills');

    const result = await db.prepare(`
      INSERT INTO skills (wallet_address, static_index, skill_level, exp)
      VALUES (?, ?, 1, 0)
    `).bind(walletAddress, static_index).run();

    return success(c, {
      id: result.meta.last_row_id,
      staticIndex: static_index,
      name: skillConfig.name,
      typeText: skillConfig.typeText,
      level: 1,
      message: `学会技能: ${skillConfig.name}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 装备技能到武将
app.post('/equip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { hero_id, skill_ids } = await c.req.json();
  if (!hero_id || !skill_ids || !Array.isArray(skill_ids)) {
    return error(c, 'Missing hero_id or skill_ids (array)');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) return error(c, 'Hero not found or not owned', 404);

    if (skill_ids.length > 4) {
      return error(c, 'Max 4 skills per hero');
    }

    // 验证技能所有权
    for (const skillId of skill_ids) {
      const skill: any = await db.prepare(`
        SELECT * FROM skills WHERE id = ? AND wallet_address = ?
      `).bind(skillId, walletAddress).first();

      if (!skill) return error(c, `Skill ${skillId} not found or not owned`);
    }

    // 删除旧的装备
    await db.prepare(`DELETE FROM hero_skills WHERE hero_id = ?`).bind(hero_id).run();

    // 装备新技能
    for (const skillId of skill_ids) {
      const skill: any = await db.prepare(`
        SELECT static_index FROM skills WHERE id = ?
      `).bind(skillId).first();

      if (skill) {
        await db.prepare(`
          INSERT INTO hero_skills (hero_id, static_index, skill_level, exp)
          VALUES (?, ?, 1, 0)
        `).bind(hero_id, skill.static_index).run();
      }
    }

    await db.prepare(`
      UPDATE heroes SET skill_ids = ? WHERE id = ?
    `).bind(JSON.stringify(skill_ids), hero_id).run();

    return success(c, {
      heroId: hero_id,
      skillIds: skill_ids,
      message: `已装备 ${skill_ids.length} 个技能`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 卸载武将技能
app.post('/unequip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { hero_id, skill_ids } = await c.req.json();
  if (!hero_id || !skill_ids || !Array.isArray(skill_ids)) {
    return error(c, 'Missing hero_id or skill_ids (array)');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) return error(c, 'Hero not found or not owned', 404);

    for (const skillId of skill_ids) {
      const skill: any = await db.prepare(`
        SELECT id FROM hero_skills WHERE hero_id = ? AND static_index IN (
          SELECT static_index FROM skills WHERE id = ?
        )
      `).bind(hero_id, skillId).first();

      if (skill) {
        await db.prepare(`DELETE FROM hero_skills WHERE id = ?`).bind(skill.id).run();
      }
    }

    return success(c, {
      heroId: hero_id,
      message: `已卸载 ${skill_ids.length} 个技能`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级技能
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const skillId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skill: any = await db.prepare(`
      SELECT * FROM skills WHERE id = ? AND wallet_address = ?
    `).bind(skillId, walletAddress).first();

    if (!skill) return error(c, 'Skill not found or not owned', 404);

    const config = (skillConfigs as Record<string, any>)[skill.static_index];
    const maxLevel = 10;

    if (skill.skill_level >= maxLevel) {
      return error(c, 'Skill already at max level');
    }

    const expRequired = getLevelUpExp(skill.skill_level);

    if (skill.exp < expRequired) {
      return error(c, `Need ${expRequired} EXP to upgrade, have ${skill.exp}`);
    }

    await db.prepare(`
      UPDATE skills SET skill_level = skill_level + 1, exp = exp - ? WHERE id = ?
    `).bind(expRequired, skillId).run();

    const newLevel = skill.skill_level + 1;
    const levelMultiplier = 1 + (newLevel - 1) * 0.1;
    const newEffect = Math.floor(config.effectValue * levelMultiplier);

    return success(c, {
      id: skillId,
      previousLevel: skill.skill_level,
      newLevel,
      effectValue: newEffect,
      costExp: expRequired,
      message: `${config.name} 升级到 ${newLevel} 级`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 消耗经验提升技能
app.post('/:id/add-exp', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const skillId = parseInt(c.req.param('id'));
  const { exp_amount } = await c.req.json();
  
  if (!exp_amount || exp_amount <= 0) {
    return error(c, 'Missing exp_amount');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skill: any = await db.prepare(`
      SELECT * FROM skills WHERE id = ? AND wallet_address = ?
    `).bind(skillId, walletAddress).first();

    if (!skill) return error(c, 'Skill not found or not owned', 404);

    const maxLevel = 10;

    if (skill.skill_level >= maxLevel) {
      return error(c, 'Skill already at max level');
    }

    await db.prepare(`
      UPDATE skills SET exp = exp + ? WHERE id = ?
    `).bind(exp_amount, skillId).run();

    // 检查是否升级
    let totalExp = skill.exp + exp_amount;
    let currentLevel = skill.skill_level;
    let leveledUp = false;

    while (totalExp >= getLevelUpExp(currentLevel) && currentLevel < maxLevel) {
      totalExp -= getLevelUpExp(currentLevel);
      currentLevel++;
    }

    if (currentLevel > skill.skill_level) {
      leveledUp = true;
      await db.prepare(`
        UPDATE skills SET skill_level = ?, exp = ? WHERE id = ?
      `).bind(currentLevel, totalExp, skillId).run();
    }

    return success(c, {
      id: skillId,
      addedExp: exp_amount,
      totalExp: totalExp,
      levelUp: leveledUp,
      newLevel: currentLevel,
      expToNext: getLevelUpExp(currentLevel) - totalExp,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 忘记技能
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const skillId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const skill: any = await db.prepare(`
      SELECT * FROM skills WHERE id = ? AND wallet_address = ?
    `).bind(skillId, walletAddress).first();

    if (!skill) return error(c, 'Skill not found or not owned', 404);

    const config = (skillConfigs as Record<string, any>)[skill.static_index];

    const equippedHeroes = await db.prepare(`
      SELECT hero_id FROM hero_skills WHERE static_index = ?
    `).bind(skill.static_index).all();

    if (equippedHeroes.results && equippedHeroes.results.length > 0) {
      return error(c, 'Cannot forget skill while equipped on heroes');
    }

    await db.prepare(`DELETE FROM skills WHERE id = ?`).bind(skillId).run();

    return success(c, {
      id: skillId,
      name: config?.name,
      message: `已忘记技能: ${config?.name || '未知'}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 计算升级所需经验
function getLevelUpExp(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export default app;
