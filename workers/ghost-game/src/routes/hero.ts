/**
 * Hero Routes - 武将接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { heroService } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取武将列表
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await heroService.getList(db, walletAddress);
    return success(c, result);
  } catch (err: any) {
    return error(c, err.message || 'Failed to get heroes');
  }
});

// 获取武将详情
app.post('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json<{ hero_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  const result = await heroService.getDetail(db, hero_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get hero', r.status || 500);
  }

  return success(c, r.data);
});

// 招募武将
app.post('/recruit', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, name, quality } = await c.req.json<{ city_id?: number; name?: string; quality?: number }>();
  if (!city_id || !name) return error(c, 'city_id and name are required');

  const result = await heroService.recruit(db, walletAddress, city_id, name, quality);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to recruit hero', r.status || 500);
  }

  return success(c, r.data);
});

// 升级武将
app.post('/levelup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { hero_id } = await c.req.json<{ hero_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  const result = await heroService.levelUp(db, hero_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to level up hero', r.status || 500);
  }

  return success(c, r.data);
});

// 训练武将
app.post('/:heroId/train', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.train(db, heroId);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to train hero', r.status || 500);
  }

  return success(c, r.data);
});

// 升级武将 (带heroId路径)
app.post('/:heroId/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await heroService.levelUp(db, heroId);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to upgrade hero', r.status || 500);
  }

  return success(c, r.data);
});


// GetCityHero - GET /hero/list
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const cityId = city_id ? parseInt(city_id) : undefined;
    const result = await heroService.getList(db, walletAddress, { cityId });
    const r = result as any;
    
    if (!r.ok) {
      return error(c, r.error || 'Failed to get heroes', r.status || 500);
    }

    return success(c, r.data);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroByID - GET /hero/detail
app.get('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!hero_id) return error(c, 'hero_id is required');
    
    const result = await heroService.getDetail(db, parseInt(hero_id));
    const r = result as any;
    
    if (!r.ok) {
      return error(c, r.error || 'Failed to get hero', r.status || 500);
    }

    return success(c, r.data);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCanEenageHero - GET /hero/can-engage
app.get('/can-engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, building_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取可雇佣的武将 (state = 0, 空闲状态)
    const heroes = await db.prepare(`
      SELECT * FROM heroes 
      WHERE wallet_address = ? AND city_id = ? AND state = 0
      ORDER BY quality DESC, level DESC
    `).bind(walletAddress, city_id).all();

    return success(c, {
      heroes: heroes.results || [],
      count: heroes.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCanUseHero - GET /hero/can-use
app.get('/can-use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, level, sex, union } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取可用武将 (根据条件筛选)
    let query = `SELECT * FROM heroes WHERE wallet_address = ? AND city_id = ?`;
    const params: any[] = [walletAddress, city_id];

    if (level) {
      query += ` AND level >= ?`;
      params.push(parseInt(level));
    }

    query += ` ORDER BY quality DESC, level DESC`;

    const heroes = await db.prepare(query).bind(...params).all();

    return success(c, {
      heroes: heroes.results || [],
      count: heroes.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// EngageHero - POST /hero/engage
app.post('/engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, heroID } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 雇佣武将 (将武将分配到建筑)
    await db.prepare(`
      UPDATE heroes SET state = 1, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(heroID, walletAddress).run();

    return success(c, { message: '武将已雇佣' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// FireTheHero - POST /hero/fire
app.post('/fire', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 解雇武将 (删除武将)
    await db.prepare(`
      DELETE FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    return success(c, { message: '武将已解雇' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateHeroName - POST /hero/name
app.post('/name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, name } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!name || name.length < 2 || name.length > 10) {
      return error(c, '武将名称必须为2-10个字符');
    }

    await db.prepare(`
      UPDATE heroes SET name = ?, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(name, hero_id, walletAddress).run();

    return success(c, { message: '武将名称已修改' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddHeroEvent - POST /hero/event
app.post('/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, actionType, objType, objID, subjoin } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 武将事件处理
    // actionType: 1=训练, 2=升级, 3=装备, 4=卸载装备
    switch (actionType) {
      case 1: // 训练
        await db.prepare(`
          UPDATE heroes SET exp = exp + 50, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(objID, walletAddress).run();
        break;
      case 2: // 升级
        await db.prepare(`
          UPDATE heroes SET level = level + 1, exp = 0, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(objID, walletAddress).run();
        break;
      case 3: // 装备
      case 4: // 卸载装备
        // 装备系统由 Item 模块处理
        break;
    }

    return success(c, { message: '事件已处理' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddHeroEventEx - POST /hero/event-ex
app.post('/event-ex', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, actionType, objType, objID, subjoin, flag } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 扩展事件处理 (与 AddHeroEvent 类似,但支持更多参数)
    switch (actionType) {
      case 1: // 训练
        const trainExp = subjoin || 50;
        await db.prepare(`
          UPDATE heroes SET exp = exp + ?, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(trainExp, objID, walletAddress).run();
        break;
      case 2: // 升级
        await db.prepare(`
          UPDATE heroes SET level = level + 1, exp = 0, updated_at = datetime('now')
          WHERE id = ? AND wallet_address = ?
        `).bind(objID, walletAddress).run();
        break;
    }

    return success(c, { message: '扩展事件已处理' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// FireCanEenageHero - POST /hero/fire-can-engage
app.post('/fire-can-engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 解雇可雇佣的武将 (将武将状态改为空闲)
    await db.prepare(`
      UPDATE heroes SET state = 0, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    return success(c, { message: '武将已解雇' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUserHeros - GET /hero/user-heroes
app.get('/user-heroes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 根据用户名查询武将
    const user = await db.prepare(`
      SELECT wallet_address FROM characters WHERE name = ?
    `).bind(username).first();

    if (!user) {
      return success(c, { heroes: [], count: 0 });
    }

    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ?
      ORDER BY quality DESC, level DESC
    `).bind((user as any).wallet_address).all();

    return success(c, {
      heroes: heroes.results || [],
      count: heroes.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroCount - GET /hero/count
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).first();

    return success(c, {
      count: (result as any)?.count || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroAutoExpBreak - GET /hero/auto-exp-break
app.get('/auto-exp-break', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, heroID } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取武将自动升级突破信息
    const hero = await db.prepare(`
      SELECT level, exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroID, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    const currentLevel = (hero as any).level;
    const currentExp = (hero as any).exp;
    const nextLevelExp = currentLevel * 100;
    const canBreak = currentExp >= nextLevelExp;

    return success(c, {
      heroId: heroID,
      level: currentLevel,
      exp: currentExp,
      nextLevelExp,
      canBreak,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetAutoExpPercent - GET /hero/auto-exp-percent
app.get('/auto-exp-percent', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取所有武将的平均经验百分比
    const heroes = await db.prepare(`
      SELECT level, exp FROM heroes WHERE wallet_address = ?
    `).bind(walletAddress).all();

    if (!heroes.results || heroes.results.length === 0) {
      return success(c, { percent: 0 });
    }

    let totalPercent = 0;
    for (const hero of heroes.results) {
      const h = hero as any;
      const nextLevelExp = h.level * 100;
      const percent = Math.min(100, (h.exp / nextLevelExp) * 100);
      totalPercent += percent;
    }

    const avgPercent = Math.floor(totalPercent / heroes.results.length);

    return success(c, {
      percent: avgPercent,
      heroCount: heroes.results.length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetExpPer - GET /hero/exp-percent
app.get('/exp-percent', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { hero_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const hero = await db.prepare(`
      SELECT level, exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    // 计算经验百分比 (简化公式: 下一级需要 level * 100 经验)
    const currentLevel = (hero as any).level;
    const currentExp = (hero as any).exp;
    const nextLevelExp = currentLevel * 100;
    const percent = Math.min(100, Math.floor((currentExp / nextLevelExp) * 100));

    return success(c, {
      heroId: hero_id,
      level: currentLevel,
      exp: currentExp,
      nextLevelExp,
      percent,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// HeroFastHealth - POST /hero/fast-health
app.post('/fast-health', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 快速恢复武将生命值
    await db.prepare(`
      UPDATE heroes SET hp = max_hp, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    return success(c, { message: '武将生命已恢复' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// SetHeroDefence - POST /hero/set-defence
app.post('/set-defence', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, defence_pos } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 设置武将到城防位置
    // 这里简化处理,实际应该更新 defence 表
    await db.prepare(`
      UPDATE heroes SET state = 2, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    return success(c, { message: '武将已设置到城防' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DebusHeroEquip - POST /hero/unequip
app.post('/unequip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, heroID } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 卸载武将装备 (将装备的 hero_id 设为 null)
    await db.prepare(`
      UPDATE items SET hero_id = NULL, equipped = 0, updated_at = datetime('now')
      WHERE hero_id = ? AND wallet_address = ?
    `).bind(heroID, walletAddress).run();

    return success(c, { message: '装备已卸载' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// HeroExpToItem - POST /hero/exp-to-item
app.post('/exp-to-item', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 将武将经验转换为物品
    const hero = await db.prepare(`
      SELECT exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    const exp = (hero as any).exp;
    if (exp < 100) {
      return error(c, '经验不足');
    }

    // 扣除经验
    await db.prepare(`
      UPDATE heroes SET exp = exp - 100, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // 添加物品 (简化处理)
    await db.prepare(`
      INSERT INTO items (wallet_address, type, config_id, count, source, created_at)
      VALUES (?, 'consumable', ?, 1, 'hero_exp', datetime('now'))
    `).bind(walletAddress, item_id).run();

    return success(c, { message: '经验已转换为物品' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroBySkillLevel - GET /hero/by-skill-level
app.get('/by-skill-level', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, skill_level } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 根据技能等级获取武将 (简化处理,实际应该关联 skills 表)
    const heroes = await db.prepare(`
      SELECT * FROM heroes 
      WHERE wallet_address = ? AND city_id = ?
      ORDER BY quality DESC, level DESC
    `).bind(walletAddress, city_id).all();

    return success(c, {
      heroes: heroes.results || [],
      count: heroes.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPerSistEffectFlags - GET /hero/persist-effect-flags
app.get('/persist-effect-flags', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取持续效果标记 (简化处理)
    // 实际应该查询 persist_effects 表
    return success(c, {
      effects: [],
      count: 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
