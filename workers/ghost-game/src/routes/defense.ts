/**
 * 城防路由 - D1数据库版本
 * 从 jx/BLL/DefenceBuilding.cs 迁移
 * 
 * 主要功能：
 * 1. GetDefenceNum - 获取城防数量 = 城防建筑数量 + 进行中的城防事件数量
 * 2. setHeroDefencePos - 设置武将驻防位置（含完整校验）
 * 3. FullDefence - 获取完整城防信息（含建筑属性）
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import buildingConfigs from '../config/buildings.json';
import worldNpcs from '../config/world_npcs.json';

const worldNpcsData = (worldNpcs as any).CityInfo || [];

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 确保 schema 列存在（防御相关）
async function ensureDefenceSchema(db: any) {
  try {
    // 确保 time_events 有 object_type 和 action_type 列（城防事件用）
    await db.prepare(`
      ALTER TABLE time_events ADD COLUMN object_type INTEGER DEFAULT 0
    `).run().catch(() => {}); // 忽略列已存在的错误
    await db.prepare(`
      ALTER TABLE time_events ADD COLUMN action_type INTEGER DEFAULT 0
    `).run().catch(() => {}); // 忽略列已存在的错误

    // 确保 heroes 有驻防相关列
    await db.prepare(`
      ALTER TABLE heroes ADD COLUMN defence_position INTEGER DEFAULT -1
    `).run().catch(() => {});
    await db.prepare(`
      ALTER TABLE heroes ADD COLUMN list_type INTEGER DEFAULT 0
    `).run().catch(() => {});
    await db.prepare(`
      ALTER TABLE heroes ADD COLUMN prentice_num INTEGER DEFAULT 1
    `).run().catch(() => {});
  } catch (e) {
    // 列已存在时忽略
  }
}

// 错误码转中文描述
function getErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    3: '武将不存在',
    30134: '学徒数量为0，无法驻防',
    503: '城防位置不合法',
    504: '武将已重伤，无法驻防',
    505: '驻防队列已满（最多5人）',
    506: '该位置已被其他武将占据',
  };
  return messages[code] || `操作失败(${code})`;
}

// GET /defense/info - 城防信息（FullDefence，别名）
// C#: public static int FullDefence(ref List<BuildingInfo> buildList)
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = c.req.query();

  try {
    let cityId = city_id ? parseInt(city_id) : null;
    if (!cityId) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();
      if (!city) return error(c, 'City not found', 404);
      cityId = city.id;
    }

    const defenses: any = await db.prepare(`
      SELECT * FROM defence_buildings WHERE city_id = ?
    `).bind(cityId).all();

    const defenceConfigs = (buildingConfigs as any).DefenceBuilding || [];

    const defenseList = (defenses.results || []).map((d: any) => {
      const config = defenceConfigs.find((b: any) => b.ID === d.static_index);
      const level = d.defence_level || 1;
      let battleProps = { Attack: 0, HitPoint: 0, AttackRange: 0, EffRange: 0 };
      if (config?.BattleData?.[level]) {
        const bd = config.BattleData[level];
        battleProps = { Attack: bd.Attack || 0, HitPoint: bd.HitPoint || 0, AttackRange: bd.AttackRange || 0, EffRange: bd.EffRange || 0 };
      }
      return {
        DefenceID: d.id, UserName: d.user_name, CityID: d.city_id, Position: d.position,
        State: d.state ?? 1, DefenceLevel: level, StaticIndex: d.static_index, Durability: d.durability ?? 100,
        Type: 3, Name: config?.Name || '', Icon: config?.Icon || '', Image: config?.Image || '',
        Des: config?.Des || '', Attack: battleProps.Attack, HitPoint: battleProps.HitPoint,
        AttackRange: battleProps.AttackRange, EffRange: battleProps.EffRange,
        id: d.id, type: 'defence', level, defence_level: level,
      };
    });

    const totalDefense = defenseList.reduce((sum: number, d: any) => sum + (d.HitPoint || d.defence_level || 0), 0);

    return success(c, {
      wallLevel: 1, trapCount: defenseList.length, defenses: defenseList, totalDefense, cityId,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET /defense/list - 城防列表（别名）
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = c.req.query();

  try {
    let cityId = city_id ? parseInt(city_id) : null;
    if (!cityId) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();
      if (!city) return error(c, 'City not found', 404);
      cityId = city.id;
    }

    const defenses: any = await db.prepare(`
      SELECT * FROM defence_buildings WHERE city_id = ?
    `).bind(cityId).all();

    const defenceConfigs = (buildingConfigs as any).DefenceBuilding || [];

    const defenseList = (defenses.results || []).map((d: any) => {
      const config = defenceConfigs.find((b: any) => b.ID === d.static_index);
      const level = d.defence_level || 1;
      return {
        id: d.id, position: d.position, state: d.state ?? 1,
        defence_level: level, static_index: d.static_index, durability: d.durability ?? 100,
        name: config?.Name || '', icon: config?.Icon || '',
        attack: config?.BattleData?.[level]?.Attack || 0,
        hitpoint: config?.BattleData?.[level]?.HitPoint || 0,
      };
    });

    return success(c, {
      defenses: defenseList,
      total: defenseList.length,
      cityId,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 根路径 - 获取城防信息 (对应 C# FullDefence)
// C#: public static int FullDefence(ref List<BuildingInfo> buildList)
// 返回 XmlData.DefenceBuilding[buildSingle.Index].BattleData[buildSingle.Level] 属性
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city: any = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // 从 defence_buildings 表读取（对应 C# Defence 表）
    const defenses: any = await db.prepare(`
      SELECT * FROM defence_buildings WHERE city_id = ?
    `).bind(city.id).all();

    // 读取游戏配置（XmlData.BattleData）
    const defenceConfigs = (buildingConfigs as any).DefenceBuilding || [];

    // 返回 C# DBDefenceBuilding 格式 + 战斗属性（对应 C# FullDefence）
    const defenseList = (defenses.results || []).map((d: any) => {
      // 查找对应配置的防御建筑
      const config = defenceConfigs.find((b: any) => b.ID === d.static_index);
      const level = d.defence_level || 1;
      
      // 从 BattleData[level] 读取战斗属性（对应 C# FullDefence 逻辑）
      let battleProps = { Attack: 0, HitPoint: 0, AttackRange: 0, EffRange: 0 };
      if (config?.BattleData?.[level]) {
        const bd = config.BattleData[level];
        battleProps = {
          Attack: bd.Attack || 0,
          HitPoint: bd.HitPoint || 0,
          AttackRange: bd.AttackRange || 0,
          EffRange: bd.EffRange || 0,
        };
      }

      return {
        // C# DBDefenceBuilding 字段（驼峰）
        DefenceID: d.id,
        UserName: d.user_name,
        CityID: d.city_id,
        Position: d.position,
        State: d.state ?? 1,
        DefenceLevel: level,
        StaticIndex: d.static_index,
        Durability: d.durability ?? 100,
        // C# FullDefence 补充的战斗属性
        Type: 3, // 固定为城防类型
        Name: config?.Name || '',
        Icon: config?.Icon || '',
        Image: config?.Image || '',
        Des: config?.Des || '',
        Attack: battleProps.Attack,
        HitPoint: battleProps.HitPoint,
        AttackRange: battleProps.AttackRange,
        EffRange: battleProps.EffRange,
        // 兼容字段
        id: d.id,
        type: 'defence',
        level,
        defence_level: level,
      };
    });

    // 计算总防御力（基于建筑等级之和 + 战斗属性加成）
    const totalDefense = defenseList.reduce((sum: number, d: any) => {
      return sum + (d.HitPoint || d.defence_level || 0);
    }, 0);

    return success(c, {
      wallLevel: 1,
      trapCount: defenseList.length,
      defenses: defenseList,
      totalDefense,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 城防地形校验（参考 jx/BLL/DefenceBuilding.cs setHeroDefencePos 逻辑）
// 错误码: 20012=特殊位置, 20013=不在城防范围, 20014=位置不合法, 20015=地形不可建造
async function validateDefenceTerrain(pos: number, landformsData: any[]): Promise<{ valid: boolean; errorCode?: number }> {
  if (pos <= 0) {
    return { valid: false, errorCode: 20014 };
  }

  // 默认城防地图尺寸 (对应 C# DefenceWidth * DefenceLength)
  const DefenceWidth = 10;
  const DefenceLength = 10;
  const maxPos = DefenceWidth * DefenceLength;

  // 校验1: 位置必须在有效范围内
  if (pos > maxPos) {
    return { valid: false, errorCode: 20014 };
  }

  // 校验2: LineTranslatePlanar 坐标转换验证
  const quotient = Math.floor(pos / DefenceLength);
  const residue = pos % DefenceLength;
  let x = residue > 0 ? residue : DefenceLength;
  let y = residue > 0 ? quotient + 1 : quotient;

  // 校验3: y 必须在有效范围内 (4 <= y <= Width - 2，对应 C# 城防地图边界)
  if (y < 4 || y > DefenceWidth - 2) {
    return { valid: false, errorCode: 20013 };
  }

  // 校验4: 特殊位置检查 (对应 C# pos == 825 || pos == 826)
  if (pos === 825 || pos === 826) {
    return { valid: false, errorCode: 20012 };
  }

  // 校验5: 地形类型检查 (从 landforms.json 读取，Type=1 表示不可建造)
  // C#: if (XmlData.BattleLandform[1][pos].Type == 1) return 20015;
  if (landformsData && landformsData.length > 0) {
    const terrain = landformsData.find((t: any) => t.Pos === pos);
    if (terrain && terrain.Type === 1) {
      return { valid: false, errorCode: 20015 };
    }
  }

  return { valid: true };
}

// 建造城防
app.post('/build', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, position } = await c.req.json();
  if (!type) return error(c, 'Missing type');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 加载地形数据 (landforms.json)
    const landformsConfig = await import('../config/landforms.json');
    const landformsData = (landformsConfig.default as any).Unit || [];

    // 地形合法性校验
    const terrainValidation = await validateDefenceTerrain(position || 0, landformsData);
    if (!terrainValidation.valid) {
      const errorMessages: Record<number, string> = {
        20012: '该位置为特殊区域，无法建造',
        20013: '位置不在城防范围内',
        20014: '位置不合法',
        20015: '该地形无法建造建筑',
      };
      return error(c, errorMessages[terrainValidation.errorCode || 20014] || '地形验证失败', 400);
    }

    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    await db.prepare(`
      INSERT INTO defence_buildings (city_id, user_name, static_index, position, defence_level)
      VALUES (?, ?, ?, ?, 1)
    `).bind((city as any).id, walletAddress, type, position || 0).run();

    return success(c, { type, position, message: 'Defense built' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DELETE /defense/:id - 删除城防建筑
// C#: 对应 BuildingExAccess.DeleteDefenceByPos 逻辑
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const defId = parseInt(c.req.param('id'));
  if (isNaN(defId) || defId <= 0) {
    return error(c, 'Invalid defense ID', 400);
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询城防建筑是否存在且属于该用户
    const defence: any = await db.prepare(`
      SELECT * FROM defence_buildings WHERE id = ? AND user_name = ?
    `).bind(defId, walletAddress).first();

    if (!defence) {
      return error(c, 'Defense building not found', 404);
    }

    // 删除城防建筑
    await db.prepare('DELETE FROM defence_buildings WHERE id = ?').bind(defId).run();

    return success(c, {
      id: defId,
      message: 'Defense building deleted',
    });
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
// C#: public LandformInfo[] GetDefenceLandform(int cityID)
// 返回: LandformInfo[] (数组，直接返回，不包装)
app.get('/landform', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家城市
    const city = await db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // C# 城防地图尺寸: DefenceLength * DefenceWidth (默认 10x10 = 100 格)
    const DefenceWidth = 10;
    const DefenceLength = 10;
    const totalCells = DefenceWidth * DefenceLength;

    // 从配置文件读取 BattleLandform 地形数据
    const battleLandforms = (buildingConfigs as any).BattleLandform || [];
    // page 为 1 (默认第一页地形)
    const pageData = battleLandforms[0] || {};

    // 生成 LandformInfo[] (Pos, Type, Index, Image)
    const landformList: any[] = [];
    for (let i = 1; i <= totalCells; i++) {
      const cellData = pageData[i];
      if (cellData) {
        landformList.push({
          Pos: i,
          Type: cellData.Type || 1,
          Index: cellData.Index || i,
          Image: cellData.Image || '',
        });
      }
    }

    // 如果没有地形数据，生成默认地形
    if (landformList.length === 0) {
      for (let i = 1; i <= totalCells; i++) {
        landformList.push({
          Pos: i,
          Type: 1, // 默认平原
          Index: 0,
          Image: '',
        });
      }
    }

    // C# 直接返回 LandformInfo[] (不包装)
    return success(c, landformList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetDefenceNum - GET /defense/count
// C#: public static int GetCurrentDefenceBuildNum(string userName, int cityID)
// 城防数量 = buildings表城防建筑数量 + events表中 ObjType=3 的进行中事件数量
// ActionType=1(建造) 或 ActionType=2(升级)
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 确保 schema 列存在
    await ensureDefenceSchema(db);

    // 如果没有指定 city_id，使用第一个城市
    let cityId = city_id ? parseInt(city_id) : null;
    if (!cityId) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();
      
      if (!city) {
        return success(c, 0);
      }
      cityId = city.id;
    }

    // 1. 城防建筑数量（对应 C# Building.GetAllDefenceMap 计数）
    // 兼容两个表名：defence_buildings 和 defences
    let buildingResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM defence_buildings WHERE city_id = ?
    `).bind(cityId).first().catch(async () => {
      // 如果 defence_buildings 不存在，尝试 defences
      return db.prepare(`
        SELECT COUNT(*) as count FROM defences WHERE city_id = ?
      `).bind(cityId).first();
    });
    
    const buildingCount = buildingResult?.count ?? 0;

    // 2. 进行中的城防事件数量（对应 C# Event.GetValidEvent 过滤 ObjType=3, ActionType=1/2）
    const eventResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM time_events 
      WHERE wallet_address = ? 
        AND object_type = 3 
        AND action_type IN (1, 2) 
        AND end_time > datetime('now')
    `).bind(walletAddress).first().catch(() => ({ count: 0 }));

    const eventCount = eventResult?.count ?? 0;

    // 总数 = 建筑 + 事件
    const totalDefence = buildingCount + eventCount;

    return success(c, totalDefence);
  } catch (err: any) {
    console.error('GetDefenceNum error:', err);
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

// setHeroDefencePos - POST /defense/hero
// C#: public static int setHeroDefencePos(string userName, int cityID, int heroID, int pos)
// pos=-1 表示离防，pos>0 表示布防到指定位置
app.post('/hero', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { hero_id, position, city_id } = await c.req.json();
  if (!hero_id) return error(c, '缺少hero_id参数');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 确保 schema 列存在
    await ensureDefenceSchema(db);

    // 获取城市ID
    let cityId = city_id ? parseInt(city_id) : null;
    if (!cityId) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();
      if (!city) return error(c, '城市不存在', 404);
      cityId = city.id;
    }

    // 查询武将（对应 C# Hero.GetHeroByID）
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return c.json({ success: false, code: 3, error: getErrorMessage(3) }, 400);
    }

    // 校验1: PrenticeNum <= 0 不能驻防（对应 C# 30134）
    const prenticeNum = hero.prentice_num ?? 1;
    if (prenticeNum <= 0) {
      return c.json({ success: false, code: 30134, error: getErrorMessage(30134) }, 400);
    }

    // 校验2: 重伤武将不能驻防 State==2（对应 C# 504）
    if (hero.state === 2) {
      return c.json({ success: false, code: 504, error: getErrorMessage(504) }, 400);
    }

    // 获取城防地形尺寸（对应 C# DefenceWidth * DefenceLength）
    // 默认 10x10 = 100 个位置
    const DefenceWidth = 10;
    const DefenceLength = 10;
    const maxPos = DefenceWidth * DefenceLength;

    // 校验3: 位置合法性（对应 C# 503）
    // pos < -1 或 pos > maxPos 或 pos == 0 不合法
    if (position < -1 || position > maxPos || position === 0) {
      return c.json({ success: false, code: 503, error: getErrorMessage(503) }, 400);
    }

    const pos = position ?? -1;

    // 驻防时(pos > 0)需要校验队列上限
    if (pos > 0) {
      // 校验4: 驻防队列已满（对应 C# HeroAccess.GetHeroCountByListType(userName, cityID, 3) >= 5, 返回 505）
      // ListType=3 表示城防队列
      const currentDefenders: any = await db.prepare(`
        SELECT COUNT(*) as count FROM heroes 
        WHERE wallet_address = ? AND list_type = 3 AND defence_position > 0
      `).bind(walletAddress).first().catch(() => ({ count: 0 }));

      // 如果当前武将不在队列中，则检查是否已满
      const heroCurrentlyDefending = (hero.list_type === 3 && hero.defence_position > 0);
      if (!heroCurrentlyDefending && (currentDefenders?.count ?? 0) >= 5) {
        return c.json({ success: false, code: 505, error: getErrorMessage(505) }, 400);
      }

      // 校验5: 位置重叠检查（对应 C# 506）
      const posConflict: any = await db.prepare(`
        SELECT id FROM heroes 
        WHERE wallet_address = ? AND list_type = 3 AND defence_position = ?
          AND id != ?
        LIMIT 1
      `).bind(walletAddress, pos, hero_id).first().catch(() => null);

      if (posConflict) {
        return c.json({ success: false, code: 506, error: getErrorMessage(506) }, 400);
      }
    }

    // 执行驻防/离防操作（对应 C# setHeroDefencePos 核心逻辑）
    if (pos > 0) {
      // 布防：设置 list_type=3 和 defence_position
      await db.prepare(`
        UPDATE heroes 
        SET list_type = 3, defence_position = ?, state = 2, updated_at = datetime('now')
        WHERE id = ?
      `).bind(pos, hero_id).run();
    } else {
      // 离防：清除 list_type 和 defence_position
      await db.prepare(`
        UPDATE heroes 
        SET list_type = 0, defence_position = -1, state = 0, updated_at = datetime('now')
        WHERE id = ?
      `).bind(hero_id).run();
    }

    return success(c, {
      hero_id,
      position: pos,
      message: pos > 0 ? '驻防成功' : '离防成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetDefenceNpcCorps - GET /defense/npc-corps
// C#: public CorpsInfo GetDefenceNpcCorps(int pos)
// 返回 CorpsInfo，State=-1 表示无驻防 (单对象，不包装)
app.get('/npc-corps', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_pos } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const pos = parseInt(city_pos as string) || 0;

    // 查找 NPC 城市数据
    const npcCity = (worldNpcsData as any[]).find(npc => npc.Pos === pos);

    if (!npcCity) {
      // 该位置不是 NPC 城市，返回 State=-1 (C# 约定)
      return success(c, {
        CorpsID: 0,
        CorpsName: '',
        GarrisonID: 0,
        State: -1,        // -1 表示无驻防
        SchlepMoney: 0,
        SchlepFood: 0,
        SchlepMen: 0,
        CityID: 0,
        UserName: '',
        TargetCity: 0,
        ArriveTime: '',
        CityPos: pos,
        Seconds: 0,
        Insignia: 0,
        IsVIP: 0,
      });
    }

    // NPC 城市，返回 CorpsInfo (C# CorpsInfo 字段)
    const corpsName = `守城卫队`;
    return success(c, {
      CorpsID: npcCity.Pos,
      CorpsName: corpsName,
      GarrisonID: npcCity.Pos,
      State: 1,           // 1=有驻防
      SchlepMoney: npcCity.Level * 1000,
      SchlepFood: npcCity.Level * 500,
      SchlepMen: npcCity.Level * 20,
      CityID: 0,
      UserName: 'NPC',
      TargetCity: 0,
      ArriveTime: '',
      CityPos: npcCity.Pos,
      Seconds: 3600 * npcCity.Level,
      Insignia: npcCity.Level * 10,
      IsVIP: 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
