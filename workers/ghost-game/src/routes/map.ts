/**
 * 地图系统路由
 * 支持：地图数据、世界探索、NPC位置、地图移动
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import worldNpcs from '../config/world_npcs.json';
import landforms from '../config/landforms.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 地图大小配置
const MAP_CONFIG = {
  WIDTH: 400,      // 地图宽度
  HEIGHT: 400,     // 地图高度
  WORLD_SIZE: 160000, // 世界大小
};

// 地形类型
const TERRAIN_TYPES = {
  PLAIN: 1,        // 平原
  MOUNTAIN: 2,     // 山地
  WATER: 3,        // 水域
  FOREST: 4,       // 森林
  DESERT: 5,       // 沙漠
};

// 获取地图配置
app.get('/config', async (c) => {
  return success(c, {
    width: MAP_CONFIG.WIDTH,
    height: MAP_CONFIG.HEIGHT,
    worldSize: MAP_CONFIG.WORLD_SIZE,
    terrainTypes: TERRAIN_TYPES,
  });
});

// 获取玩家位置
app.get('/position', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT position, name FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    return success(c, {
      position: city.position,
      name: city.name,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取指定区域地图数据
app.get('/area/:x/:y', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const x = parseInt(c.req.param('x'));
  const y = parseInt(c.req.param('y'));
  const radius = parseInt(c.req.query('radius')) || 5;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取范围内的城市
    const cities = await db.prepare(`
      SELECT c.*, ch.name as character_name
      FROM cities c
      LEFT JOIN characters ch ON c.wallet_address = ch.wallet_address
      WHERE c.position >= ? AND c.position <= ?
    `).bind(
      y * 400 + Math.max(1, x - radius),
      y * 400 + Math.min(400, x + radius)
    ).all();

    // 获取范围内的NPC
    const npcs = (worldNpcs as any[]).filter(npc => {
      const pos = npc.Pos || npc.pos || 0;
      const npcX = pos % 400;
      const npcY = Math.floor(pos / 400);
      return Math.abs(npcX - x) <= radius && Math.abs(npcY - y) <= radius;
    });

    // 获取地形数据
    const terrains = (landforms as any[]).filter(l => {
      const pos = l.Pos || l.pos || 0;
      const lx = pos % 400;
      const ly = Math.floor(pos / 400);
      return Math.abs(lx - x) <= radius && Math.abs(ly - y) <= radius;
    });

    return success(c, {
      center: { x, y },
      radius,
      cities: (cities.results || []).map(c => ({
        id: c.id,
        position: c.position,
        name: c.name,
        owner: c.character_name,
        type: 'city',
      })),
      npcs: npcs.map(n => ({
        position: n.Pos || n.pos,
        name: n.Name || n.name,
        level: n.Level || n.level,
        type: 'npc',
      })),
      terrains,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取指定位置详情
app.get('/position/:pos', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const pos = parseInt(c.req.param('pos'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否城市
    const city: any = await db.prepare(`
      SELECT c.*, ch.name as owner_name, ch.level as owner_level
      FROM cities c
      LEFT JOIN characters ch ON c.wallet_address = ch.wallet_address
      WHERE c.position = ?
    `).bind(pos).first();

    if (city) {
      return success(c, {
        position: pos,
        type: 'city',
        name: city.name,
        owner: city.owner_name,
        ownerLevel: city.owner_level,
        prosperity: city.prosperity,
      });
    }

    // 检查是否NPC
    const npc = (worldNpcs as any[]).find(n => (n.Pos || n.pos) === pos);
    if (npc) {
      return success(c, {
        position: pos,
        type: 'npc',
        name: npc.Name || npc.name,
        level: npc.Level || npc.level,
        portraitIndex: npc.PicIndex || npc.picIndex,
      });
    }

    // 地形
    const terrain = (landforms as any[]).find(l => (l.Pos || l.pos) === pos);
    if (terrain) {
      return success(c, {
        position: pos,
        type: 'terrain',
        terrainType: terrain.Type || terrain.type,
        picIndex: terrain.PicIndex || terrain.picIndex,
      });
    }

    return success(c, {
      position: pos,
      type: 'empty',
      message: 'Empty tile',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 探索地图
app.post('/explore', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { targetPosition, useGold } = await c.req.json();
  if (!targetPosition) return error(c, 'Missing targetPosition');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT c.*, ch.gold 
      FROM cities c
      LEFT JOIN characters ch ON c.wallet_address = ch.wallet_address
      WHERE c.wallet_address = ? ORDER BY c.id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    const currentPos = city.position;
    const distance = Math.abs(targetPosition - currentPos);

    // 检查距离
    if (distance > 50) {
      return error(c, 'Target too far');
    }

    // 检查资源
    if (distance > 20) {
      const costGold = 10;
      if ((city.gold || 0) < costGold) {
        return error(c, `Need ${costGold} gold to explore this far`);
      }
    }

    // 检查是否已有城市
    const existingCity: any = await db.prepare(`
      SELECT id FROM cities WHERE position = ?
    `).bind(targetPosition).first();

    if (existingCity) {
      return error(c, 'Position already occupied');
    }

    // 探索成功，创建记录
    const explored: any = await db.prepare(`
      SELECT * FROM map_explored WHERE wallet_address = ? AND position = ?
    `).bind(walletAddress, targetPosition).first();

    if (!explored) {
      await db.prepare(`
        INSERT INTO map_explored (wallet_address, position, explored_at)
        VALUES (?, ?, datetime('now'))
      `).bind(walletAddress, targetPosition).run();

      // 消耗金条
      if (distance > 20) {
        await db.prepare(`
          UPDATE characters SET gold = gold - 10 WHERE wallet_address = ?
        `).bind(walletAddress).run();
      }
    }

    // 获取地形
    const terrain = (landforms as any[]).find(l => (l.Pos || l.pos) === targetPosition);

    return success(c, {
      position: targetPosition,
      distance,
      explored: true,
      terrain: terrain || { type: 1 },
      message: `探索成功，距离 ${distance}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取已探索区域
app.get('/explored', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const explored = await db.prepare(`
      SELECT position, explored_at FROM map_explored 
      WHERE wallet_address = ?
      ORDER BY explored_at DESC
    `).bind(walletAddress).all();

    return success(c, {
      positions: (explored.results || []).map((e: any) => e.position),
      total: explored.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 移动到指定位置
app.post('/move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { targetPosition } = await c.req.json();
  if (!targetPosition) return error(c, 'Missing targetPosition');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'No city found');

    const currentPos = city.position;
    const distance = Math.abs(targetPosition - currentPos);
    const travelTime = distance * 2; // 2秒/格

    // 检查目标位置
    const targetCity: any = await db.prepare(`
      SELECT id FROM cities WHERE position = ?
    `).bind(targetPosition).first();

    if (targetCity) {
      return error(c, 'Position occupied');
    }

    // 开始移动
    const arriveTime = new Date(Date.now() + travelTime * 1000).toISOString();

    await db.prepare(`
      INSERT INTO city_movements (wallet_address, city_id, from_position, to_position, start_time, arrive_time)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(walletAddress, city.id, currentPos, targetPosition, arriveTime).run();

    return success(c, {
      from: currentPos,
      to: targetPosition,
      distance,
      travelTime,
      arriveTime,
      message: `移动中，预计 ${travelTime} 秒到达`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取移动状态
app.get('/movement/status', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const movement: any = await db.prepare(`
      SELECT * FROM city_movements 
      WHERE wallet_address = ? AND arrive_time > datetime('now')
      ORDER BY start_time DESC LIMIT 1
    `).bind(walletAddress).first();

    if (!movement) {
      return success(c, { moving: false });
    }

    const now = new Date();
    const arriveTime = new Date(movement.arrive_time);
    const remainingSeconds = Math.max(0, Math.floor((arriveTime.getTime() - now.getTime()) / 1000));

    return success(c, {
      moving: true,
      from: movement.from_position,
      to: movement.to_position,
      startTime: movement.start_time,
      arriveTime: movement.arrive_time,
      remainingSeconds,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 取消移动
app.post('/movement/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const movement: any = await db.prepare(`
      SELECT * FROM city_movements 
      WHERE wallet_address = ? AND arrive_time > datetime('now')
      ORDER BY start_time DESC LIMIT 1
    `).bind(walletAddress).first();

    if (!movement) return error(c, 'No active movement');

    // 删除移动记录
    await db.prepare(`
      DELETE FROM city_movements WHERE id = ?
    `).bind(movement.id).run();

    return success(c, { message: 'Movement cancelled' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取NPC列表
app.get('/npcs', async (c) => {
  const { level } = c.req.query();
  
  let npcs = worldNpcs as any[];
  
  if (level) {
    const lvl = parseInt(level);
    npcs = npcs.filter(n => (n.Level || n.level) === lvl);
  }

  return success(c, {
    npcs: npcs.map(n => ({
      position: n.Pos || n.pos,
      name: n.Name || n.name,
      level: n.Level || n.level,
      portraitIndex: n.PicIndex || n.picIndex,
    })),
    total: npcs.length,
  });
});

export default app;
