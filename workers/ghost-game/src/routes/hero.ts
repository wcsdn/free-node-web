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

// 格式化武将信息为 C# HeroInfo 结构
function formatHeroInfo(h: any, walletAddress: string) {
  return {
    ID: h.id,
    Name: h.name,
    Level: h.level,
    Sex: h.sex || 1,
    Junta: h.junta || 1,
    Icon: h.icon || '/hero/1.gif',
    Image: h.image || '/hero/1.png',
    PortraitIndex: h.portrait_index || 1,
    AbilityIndex: h.ability_index || 1,
    CityID: h.city_id,
    UserName: walletAddress,
    Training: h.training || 0,
    DefencePos: h.defence_pos || -1,
    PrenticeNum: h.prentice_num || 0,
    HeroType: h.hero_type || 0,
    Quality: h.quality || 1,
    ExpCount: h.exp || 0,
    NoSkillReason: 0,
    PropertyCounteract: [0,0,0,0,0],
    WuXing: h.wu_xing || 1,
    UpTraining: h.up_training || 10,
    AutoExpGold: 0,
    AutoExpCount: 0,
    AutoExpResFood: 0,
    AutoExpResMoney: 0,
    AutoExpResMen: 0,
    AutoExpNum: 0,
    State: h.state || 0,
    CorpsID: h.corps_id || 0,
    LevelExp: h.exp || 0,
    Attack: h.attack || 10,
    Defence: h.defense || 5,
    CrushBlow: h.crush_blow || 0,
    Dodge: h.dodge || 0,
    MaxPrenticeNum: 5,
    AttackRange: h.attack_range || 1,
    MoveRange: h.move_range || 3,
    ResumeCostTime: 0,
    ResumeCostGold: 0,
    TrainCostMoney: 100,
    TrainCostFood: 100,
    TrainCostMen: 10,
    TrainCostGold: 0,
    TrainCostTime: 3600,
    ConscriptionCostMoney: 200,
    ConscriptionCostFood: 200,
    ConscriptionCostMen: 20,
    ConscriptionCostGold: 0,
    ConscriptionCostTime: 7200,
    FastTrainCostMoney: 50,
    FastTrainCostFood: 50,
    FastTrainCostMen: 5,
    FastTrainCostGold: 10,
    FastTrainCostTime: 0,
    FastConscriptionCostMoney: 100,
    FastConscriptionCostFood: 100,
    FastConscriptionCostMen: 10,
    FastConscriptionCostGold: 20,
    FastConscriptionCostTime: 0,
    SkillList: [],
    ItemList: [],
  };
}

// GetCityHero - POST /hero/list
// C# 签名: public HeroInfo[] GetCityHero(int cityID)
// 返回: HeroInfo[] (数组，不是对象)
app.post('/list', async (c) => {
  try {
    const walletAddress = await verifyWalletAuth(c);
    if (!walletAddress) return error(c, 'Unauthorized', 401);

    const db = c.env.DB;
    if (!db) return error(c, 'Database not configured', 503);

    // 支持 city_id 和 cityId 参数 (与前端一致)
    const body = await c.req.json<{ city_id?: number; cityId?: number }>();
    const city_id = body.city_id ?? body.cityId;

    // C# 逻辑: GetHero(userName, cityID) 排除 state=6 (未雇佣)
    // 支持 city_id 过滤，如果不传则返回所有城市的武将
    let query = 'SELECT * FROM heroes WHERE wallet_address = ? AND state != 6';
    const params: any[] = [walletAddress];
    
    if (city_id !== undefined) {
      query += ' AND city_id = ?';
      params.push(city_id);
    }
    
    query += ' ORDER BY level DESC, quality DESC';
    
    const heroes = await db.prepare(query).bind(...params).all();

    // 如果没有武将，返回包含 ID=-1 的数组 (C# 约定)
    if (!heroes.results || heroes.results.length === 0) {
      console.log('[/hero/list] No heroes found, returning [{ID:-1}]');
      return success(c, [{ ID: -1 }]);
    }

    // 格式化为 C# HeroInfo 结构
    const heroList = (heroes.results || []).map((h: any) => ({
      // 核心字段 (C# 驼峰命名)
      ID: h.id,
      Name: h.name,
      Level: h.level,
      Sex: h.sex || 1,
      Junta: h.junta || 1,
      Icon: h.icon || '/hero/1.gif',
      Image: h.image || '/hero/1.png',
      PortraitIndex: h.portrait_index || 1,
      AbilityIndex: h.ability_index || 1,
      CityID: h.city_id,
      UserName: walletAddress,
      Training: h.training || 0,
      DefencePos: h.defence_pos || -1,
      PrenticeNum: h.prentice_num || 0,
      HeroType: h.hero_type || 0,
      Quality: h.quality || 1,
      ExpCount: h.exp || 0,
      NoSkillReason: 0,
      PropertyCounteract: [0,0,0,0,0],
      WuXing: h.wu_xing || 1,
      UpTraining: h.up_training || 10,
      AutoExpGold: 0,
      AutoExpCount: 0,
      AutoExpResFood: 0,
      AutoExpResMoney: 0,
      AutoExpResMen: 0,
      AutoExpNum: 0,
      State: h.state || 0,
      CorpsID: h.corps_id || 0,
      LevelExp: h.exp || 0,
      Attack: h.attack || 10,
      Defence: h.defense || 5,
      CrushBlow: h.crush_blow || 0,
      Dodge: h.dodge || 0,
      MaxPrenticeNum: 5,
      AttackRange: h.attack_range || 1,
      MoveRange: h.move_range || 3,
      ResumeCostTime: 0,
      ResumeCostGold: 0,
      // 训练/招募成本
      TrainCostMoney: 100,
      TrainCostFood: 100,
      TrainCostMen: 10,
      TrainCostGold: 0,
      TrainCostTime: 3600,
      ConscriptionCostMoney: 200,
      ConscriptionCostFood: 200,
      ConscriptionCostMen: 20,
      ConscriptionCostGold: 0,
      ConscriptionCostTime: 7200,
      FastTrainCostMoney: 50,
      FastTrainCostFood: 50,
      FastTrainCostMen: 5,
      FastTrainCostGold: 10,
      FastTrainCostTime: 0,
      FastConscriptionCostMoney: 100,
      FastConscriptionCostFood: 100,
      FastConscriptionCostMen: 10,
      FastConscriptionCostGold: 20,
      FastConscriptionCostTime: 0,
      // 技能和装备列表
      SkillList: [],
      ItemList: [],
    }));

    return success(c, heroList);
  } catch (err: any) {
    return c.json({ success: false, error: err.message, stack: err.stack, name: err.name });
  }
});

// GetHeroByID - POST /hero/detail
// C# 签名: public HeroInfo GetHeroByID(int cityID, int heroID)
// 返回: HeroInfo (单个对象，不是数组)
app.post('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 支持 city_id, hero_id (与前端一致)
  const { city_id, hero_id } = await c.req.json<{ city_id?: number; hero_id?: number }>();
  if (!hero_id) return error(c, 'hero_id is required');

  try {
    // C# 逻辑: GetHeroByID(userName, cityID, heroID)
    const hero = await db.prepare(`
      SELECT * FROM heroes 
      WHERE id = ? AND wallet_address = ? AND city_id = ?
    `).bind(hero_id, walletAddress, city_id).first();

    if (!hero) {
      return error(c, 'Hero not found', 404);
    }

    // 格式化为 C# HeroInfo 结构
    const h = hero as any;
    const heroInfo = {
      ID: h.id,
      Name: h.name,
      Level: h.level,
      Sex: h.sex || 1,
      Junta: h.junta || 1,
      Icon: h.icon || '/hero/1.gif',
      Image: h.image || '/hero/1.png',
      PortraitIndex: h.portrait_index || 1,
      AbilityIndex: h.ability_index || 1,
      CityID: h.city_id,
      UserName: walletAddress,
      Training: h.training || 0,
      DefencePos: h.defence_pos || -1,
      PrenticeNum: h.prentice_num || 0,
      HeroType: h.hero_type || 0,
      Quality: h.quality || 1,
      ExpCount: h.exp || 0,
      NoSkillReason: 0,
      PropertyCounteract: [0,0,0,0,0],
      WuXing: h.wu_xing || 1,
      UpTraining: h.up_training || 10,
      AutoExpGold: 0,
      AutoExpCount: 0,
      AutoExpResFood: 0,
      AutoExpResMoney: 0,
      AutoExpResMen: 0,
      AutoExpNum: 0,
      State: h.state || 0,
      CorpsID: h.corps_id || 0,
      LevelExp: h.exp || 0,
      Attack: h.attack || 10,
      Defence: h.defense || 5,
      CrushBlow: h.crush_blow || 0,
      Dodge: h.dodge || 0,
      MaxPrenticeNum: 5,
      AttackRange: h.attack_range || 1,
      MoveRange: h.move_range || 3,
      ResumeCostTime: 0,
      ResumeCostGold: 0,
      TrainCostMoney: 100,
      TrainCostFood: 100,
      TrainCostMen: 10,
      TrainCostGold: 0,
      TrainCostTime: 3600,
      ConscriptionCostMoney: 200,
      ConscriptionCostFood: 200,
      ConscriptionCostMen: 20,
      ConscriptionCostGold: 0,
      ConscriptionCostTime: 7200,
      FastTrainCostMoney: 50,
      FastTrainCostFood: 50,
      FastTrainCostMen: 5,
      FastTrainCostGold: 10,
      FastTrainCostTime: 0,
      FastConscriptionCostMoney: 100,
      FastConscriptionCostFood: 100,
      FastConscriptionCostMen: 10,
      FastConscriptionCostGold: 20,
      FastConscriptionCostTime: 0,
      SkillList: [],
      ItemList: [],
    };

    return success(c, heroInfo);
  } catch (err: any) {
    return error(c, err.message || 'Failed to get hero');
  }
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
  if (!r.success) {
    return error(c, r.error || 'Failed to recruit hero', 500);
  }

  // 获取新创建的武将信息并返回
  const hero = await db.prepare(`
    SELECT * FROM heroes WHERE id = ?
  `).bind(r.heroId).first();

  if (!hero) {
    return error(c, 'Failed to get created hero', 500);
  }

  const h = hero as any;
  return success(c, {
    ID: h.id,
    Name: h.name,
    Level: h.level,
    Sex: h.sex || 1,
    Junta: h.junta || 1,
    Icon: h.icon || '/hero/1.gif',
    Image: h.image || '/hero/1.png',
    PortraitIndex: h.portrait_index || 1,
    AbilityIndex: h.ability_index || 1,
    CityID: h.city_id,
    UserName: walletAddress,
    Training: h.training || 0,
    DefencePos: h.defence_pos || -1,
    PrenticeNum: h.prentice_num || 0,
    HeroType: h.hero_type || 0,
    Quality: h.quality || 1,
    ExpCount: h.exp || 0,
    NoSkillReason: 0,
    PropertyCounteract: [0,0,0,0,0],
    WuXing: h.wu_xing || 1,
    UpTraining: h.up_training || 10,
    AutoExpGold: 0,
    AutoExpCount: 0,
    AutoExpResFood: 0,
    AutoExpResMoney: 0,
    AutoExpResMen: 0,
    AutoExpNum: 0,
    State: h.state || 0,
    CorpsID: h.corps_id || 0,
    LevelExp: h.exp || 0,
    Attack: h.attack || 10,
    Defence: h.defense || 5,
    CrushBlow: h.crush_blow || 0,
    Dodge: h.dodge || 0,
    MaxPrenticeNum: 5,
    AttackRange: h.attack_range || 1,
    MoveRange: h.move_range || 3,
    ResumeCostTime: 0,
    ResumeCostGold: 0,
    TrainCostMoney: 100,
    TrainCostFood: 100,
    TrainCostMen: 10,
    TrainCostGold: 0,
    TrainCostTime: 3600,
    ConscriptionCostMoney: 200,
    ConscriptionCostFood: 200,
    ConscriptionCostMen: 20,
    ConscriptionCostGold: 0,
    ConscriptionCostTime: 7200,
    FastTrainCostMoney: 50,
    FastTrainCostFood: 50,
    FastTrainCostMen: 5,
    FastTrainCostGold: 10,
    FastTrainCostTime: 0,
    FastConscriptionCostMoney: 100,
    FastConscriptionCostFood: 100,
    FastConscriptionCostMen: 10,
    FastConscriptionCostGold: 20,
    FastConscriptionCostTime: 0,
    SkillList: [],
    ItemList: [],
  });
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
  if (!r.success) {
    return error(c, r.error || 'Failed to level up hero', 500);
  }

  return success(c, { newLevel: r.newLevel });
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
  if (!r.success) {
    return error(c, r.error || 'Failed to train hero', 500);
  }

  return success(c, { trainingGain: r.trainingGain });
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
  if (!r.success) {
    return error(c, r.error || 'Failed to upgrade hero', 500);
  }

  return success(c, { newLevel: r.newLevel });
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
    // getList returns { heroes: [], total: 0, page, pageSize }
    return success(c, result.heroes);
  } catch (err: any) {
    return error(c, err.message || 'Failed to get heroes');
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
    
    const hero = await heroService.getDetail(db, parseInt(hero_id));
    if (!hero) {
      return error(c, 'Hero not found', 404);
    }

    return success(c, hero);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCanEenageHero - POST /hero/can-engage
// C# 签名: public HeroInfo[] GetCanEenageHero(int cityID, int union)
// 前端发送: city_id, building_type (building_type 对应 junta/union)
app.post('/can-engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, building_type, cityID } = await c.req.json();
  const cityId = city_id || cityID;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // C# 逻辑: GetHeroByUnionBuilding - 获取待雇佣武将 (state=6, 按junta过滤)
    // building_type (junta) > 0 才过滤，否则返回所有待雇佣武将
    let query = `SELECT * FROM heroes WHERE wallet_address = ? AND city_id = ? AND state = 6`;
    const params: any[] = [walletAddress, cityId];

    if (building_type && building_type > 0) {
      query += ` AND junta = ?`;
      params.push(building_type);
    }

    query += ` ORDER BY quality DESC, level DESC`;

    const heroes = await db.prepare(query).bind(...params).all();

    // C# 约定: 没有可用武将时返回 [{ ID: -1 }]
    if (!heroes.results || heroes.results.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    // 格式化为 HeroInfo 数组
    const heroList = (heroes.results || []).map((h: any) => formatHeroInfo(h, walletAddress));
    return success(c, heroList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCanUseHero - POST /hero/can-use
// C# 签名: public HeroInfo[] GetCanUseHero(int cityID, int level, int sex, int junta)
// 前端发送: city_id, level, sex, union (union 对应 junta)
app.post('/can-use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, level, sex, union, cityID } = await c.req.json();
  const cityId = city_id || cityID;
  const filterLevel = parseInt(level) || 0;
  const filterSex = parseInt(sex) || 0;  // 0 = 不过滤
  const filterJunta = parseInt(union) || 0;  // 0 = 不过滤

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // C# 逻辑: GetItemHero - 获取可用武将 (state != 6, level >= level, sex过滤, junta过滤, CorpsID == 0)
    let query = `SELECT * FROM heroes WHERE wallet_address = ? AND city_id = ? AND state != 6`;
    const params: any[] = [walletAddress, cityId];

    if (filterLevel > 0) {
      query += ` AND level >= ?`;
      params.push(filterLevel);
    }

    if (filterSex > 0) {
      query += ` AND sex = ?`;
      params.push(filterSex);
    }

    if (filterJunta > 0) {
      query += ` AND junta = ?`;
      params.push(filterJunta);
    }

    // 必须不在帮派 (CorpsID == 0)
    query += ` AND (corps_id = 0 OR corps_id IS NULL)`;

    query += ` ORDER BY quality DESC, level DESC`;

    const heroes = await db.prepare(query).bind(...params).all();

    // C# 约定: 没有可用武将时返回 [{ ID: -1 }]
    if (!heroes.results || heroes.results.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    // 格式化为 HeroInfo 数组
    const heroList = (heroes.results || []).map((h: any) => formatHeroInfo(h, walletAddress));
    return success(c, heroList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// EngageHero - POST /hero/engage
// C#: public int EngageHero(int cityID, int heroID) 返回 0=成功
app.post('/engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, heroID, city_id, hero_id } = await c.req.json();
  const heroId = heroID || hero_id;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 雇佣武将 (将武将分配到建筑)
    await db.prepare(`
      UPDATE heroes SET state = 1, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// FireTheHero - POST /hero/fire
// C#: public int FireTheHero(int cityID, int heroID) 返回 0=成功
app.post('/fire', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 解雇武将 (删除武将)
    await db.prepare(`
      DELETE FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// UpdateHeroName - POST /hero/name
// C#: public int UpdateHeroName(int cityID, int heroID, string name) 返回 0=成功
app.post('/name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, name } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    if (!name || name.length < 2 || name.length > 10) {
      return c.json({ success: false, code: 1, message: '武将名称必须为2-10个字符' });
    }

    await db.prepare(`
      UPDATE heroes SET name = ?, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(name, hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// AddHeroEvent - POST /hero/event
// C#: public int AddHeroEvent(int cityID, int actionType, int objType, int objID, int subjoin) 返回 0=成功
app.post('/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, actionType, objType, objID, subjoin, city_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

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

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// AddHeroEventEx - POST /hero/event-ex
// C#: public int AddHeroEventEx(int cityID, int actionType, int objType, int objID, int subjoin, bool flag) 返回 0=成功
app.post('/event-ex', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, actionType, objType, objID, subjoin, flag, city_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

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

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// FireCanEenageHero - POST /hero/fire-can-engage
// C#: public int FireCanEenageHero(int cityID, int heroID) 返回 0=成功
app.post('/fire-can-engage', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 解雇可雇佣的武将 (将武将状态改为空闲)
    await db.prepare(`
      UPDATE heroes SET state = 0, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// GetUserHeros - GET /hero/user-heroes
// C# 签名: public ArenaWinnerInfo[] GetUserHeros(int npcPos)
// 前端发送: pos (npc位置)
// 注意: C# 返回 ArenaWinnerInfo[] (竞技场排行榜数据), 不是武将列表
// 目前简化处理: 返回武将列表数组 (格式化为 HeroInfo[])
app.get('/user-heroes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos, username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 前端实际发送的是 pos (npcPos), 不是 username
    // 如果有 username 用 username 查，否则用 pos 查
    let walletAddr = walletAddress;
    
    if (username) {
      const user = await db.prepare(`
        SELECT wallet_address FROM characters WHERE name = ?
      `).bind(username).first();
      if (user) {
        walletAddr = (user as any).wallet_address;
      }
    }

    const heroes = await db.prepare(`
      SELECT * FROM heroes WHERE wallet_address = ?
      ORDER BY quality DESC, level DESC
    `).bind(walletAddr).all();

    // C# 约定: 没有数据时返回空数组
    if (!heroes.results || heroes.results.length === 0) {
      return success(c, []);
    }

    // 返回数组 (不是 { heroes: [], count: N })
    const heroList = (heroes.results || []).map((h: any) => formatHeroInfo(h, walletAddr));
    return success(c, heroList);
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

    // C# 语义: GetHeroCount() 返回页数 = (武将总数/20) + 1 (最大250页)
    // 前端 Taxis.js 用 result.value 作为 MaxPlayerPage
    const totalHeroes = (result as any)?.count || 0;
    const pageCount = Math.min(Math.ceil(totalHeroes / 20) + 1, 250);
    return c.json({ success: true, value: pageCount });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetHeroAutoExpBreak - GET /hero/auto-exp-break
app.get('/auto-exp-break', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, heroID, city_id, hero_id } = c.req.query();
  const cityId = cityID || city_id;
  const heroId = heroID || hero_id;

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取武将自动升级突破信息
    const hero = await db.prepare(`
      SELECT level, exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

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
// C#: public int HeroFastHealth(int cityID, int heroID) 返回 0=成功
app.post('/fast-health', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 快速恢复武将生命值
    await db.prepare(`
      UPDATE heroes SET hp = max_hp, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// SetHeroDefence - POST /hero/set-defence
// C#: public int SetHeroDefence(int cityID, int heroID, int defencePos) 返回 0=成功
app.post('/set-defence', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, defence_pos } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 设置武将到城防位置
    // 这里简化处理,实际应该更新 defence 表
    await db.prepare(`
      UPDATE heroes SET state = 2, updated_at = datetime('now')
      WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// DebusHeroEquip - POST /hero/unequip
// C#: public int DebusHeroEquip(int cityID, int heroID) 返回 0=成功
app.post('/unequip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { cityID, heroID, city_id, hero_id } = await c.req.json();
  const heroId = heroID || hero_id;

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 卸载武将装备 (将装备的 hero_id 设为 null)
    await db.prepare(`
      UPDATE items SET hero_id = NULL, equipped = 0, updated_at = datetime('now')
      WHERE hero_id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// HeroExpToItem - POST /hero/exp-to-item
// C#: public int HeroExpToItem(int cityID, int heroID, int itemID) 返回 0=成功
app.post('/exp-to-item', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const { city_id, hero_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  try {
    // 将武将经验转换为物品
    const hero = await db.prepare(`
      SELECT exp FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return c.json({ success: false, code: 1, message: '武将不存在' });
    }

    const exp = (hero as any).exp;
    if (exp < 100) {
      return c.json({ success: false, code: 2, message: '经验不足' });
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

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    return c.json({ success: false, code: -1, message: err.message });
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

    return success(c, heroes.results || []);
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
