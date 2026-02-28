/**
 * 城防路由 - D1数据库版本
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

// 根路径 - 获取城防信息
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    const defenses = await db.prepare(`
      SELECT * FROM defence_buildings WHERE city_id = ?
    `).bind((city as any).id).all();

    // 返回 C# DBDefenceBuilding 格式
    const defenseList = (defenses.results || []).map((d: any) => ({
      // C# 字段
      DefenceID: d.id,
      UserName: d.user_name,
      CityID: d.city_id,
      Position: d.position,
      State: d.state || 1,
      DefenceLevel: d.defence_level || 1,
      StaticIndex: d.static_index,
      Durability: d.durability || 100,
      // 兼容字段
      id: d.id,
      type: d.type,
      level: d.defence_level,
    }));

    return success(c, {
      wallLevel: 1,
      trapCount: defenses.results?.length || 0,
      defenses: defenseList,
      totalDefense: defenses.results?.reduce((sum: number, d: any) => sum + (d.defence_level || 0), 0) || 0
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 建造城防
app.post('/build', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, position } = await c.req.json();
  if (!type) return error(c, 'Missing type');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    await db.prepare(`
      INSERT INTO defence_buildings (city_id, user_name, static_index, position, defence_level)
      VALUES (?, ?, ?, ?, 1)
    `).bind((city as any).id, walletAddress, type, position || 0).run();

    return success(c, { type, message: 'Defense built' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 升级城防
app.post('/:id/upgrade', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const defId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE defence_buildings SET defence_level = defence_level + 1 WHERE id = ?
    `).bind(defId).run();

    return success(c, { id: defId, message: 'Defense upgraded' });
  } catch (err: any) {
    return error(c, err.message);
  }
});


// GetDefenceLandform - GET /defense/landform
app.get('/landform', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // 返回城防地形配置
    return success(c, {
      landforms: [
        { id: 1, name: '平原', defenseBonus: 0, movementCost: 1 },
        { id: 2, name: '丘陵', defenseBonus: 5, movementCost: 1.2 },
        { id: 3, name: '山地', defenseBonus: 10, movementCost: 1.5 },
        { id: 4, name: '河流', defenseBonus: 2, movementCost: 2 },
        { id: 5, name: '森林', defenseBonus: 3, movementCost: 1.3 },
      ],
      cityId: (city as any).id,
      currentTerrain: '平原',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetDefenceNum - GET /defense/count
// C# 返回: int (城防建筑数量)
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 如果没有指定 city_id，使用第一个城市
    let cityId = city_id;
    if (!cityId) {
      const city = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();
      
      if (!city) {
        // 没有城市时返回 0
        return success(c, 0);
      }
      cityId = (city as any).id;
    }

    // 查询城防建筑数量
    const result: any = await db.prepare(`
      SELECT COUNT(*) as count FROM buildings 
      WHERE city_id = ? AND type = 'defense'
    `).bind(cityId).first();

    // 前端期望: result.value = int (数字)
    // C# 返回: int GetDefenceNum(int cityID)
    return success(c, result?.count || 0);
  } catch (err: any) {
    console.error('GetDefenceNum error:', err);
    // 如果表不存在或查询失败，返回 0
    return success(c, 0);
  }
});

// GetDefencePosHero - GET /defense/pos-hero
app.get('/pos-hero', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城防驻守的武将
    const heroes: any = await db.prepare(`
      SELECT h.* FROM heroes h
      WHERE h.wallet_address = ? AND h.state = 2  -- 2 表示城防状态
    `).bind(walletAddress).all();

    return success(c, {
      heroes: (heroes.results || []).map((h: any) => ({
        id: h.id,
        name: h.name,
        level: h.level,
        atk: h.atk,
        def: h.def,
        hp: h.hp,
        position: h.defence_position || 0,
        state: h.state,
      }))
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetDefenceNpcCorps - GET /defense/npc-corps
app.get('/npc-corps', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_pos } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 返回NPC城防军团数据
    return success(c, {
      npcCorps: [
        {
          id: 1,
          name: '守城卫队',
          level: 5,
          power: 5000,
          position: city_pos || 'center',
          heroes: [
            { id: 101, name: '守卫队长', level: 10 },
            { id: 102, name: '副队长', level: 8 },
          ],
          units: [
            { type: '步兵', count: 50, level: 5 },
            { type: '弓箭手', count: 30, level: 4 },
          ]
        }
      ],
      canAttack: true,
      attackCooldown: 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
