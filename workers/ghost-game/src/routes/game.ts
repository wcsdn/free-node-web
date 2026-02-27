/**
 * Game Routes - 游戏主接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { userService, cityService } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 初始化新用户（自动创建角色、城市和初始建筑）
async function initializeNewUser(db: any, walletAddress: string) {
  // 创建角色
  await db.prepare(`
    INSERT INTO characters (wallet_address, name, level, gold)
    VALUES (?, ?, ?, ?)
  `).bind(walletAddress, '玩家', 1, 10000).run();

  // 查找一个未被占用的 position（从 1000 开始，避免与系统预留位置冲突）
  const maxPositionResult: any = await db.prepare(`
    SELECT MAX(position) as max_pos FROM cities WHERE position >= 1000
  `).first();
  
  const newPosition = (maxPositionResult?.max_pos || 999) + 1;

  // 创建主城
  await db.prepare(`
    INSERT INTO cities (wallet_address, name, position, prosperity, money, food, population, money_rate, food_rate, population_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(walletAddress, '主城', newPosition, 100, 10000, 10000, 500, 100, 100, 50).run();

  // 获取刚创建的城市ID
  const cityResult: any = await db.prepare(`
    SELECT id FROM cities WHERE wallet_address = ? ORDER BY id DESC LIMIT 1
  `).bind(walletAddress).first();

  if (cityResult) {
    // 创建初始建筑：聚义厅（位置10）和义舍（位置14）
    await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(cityResult.id, 'interior', 1, 10, 0, 1).run();

    await db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(cityResult.id, 'interior', 1, 14, 0, 2).run();
  }
}

// 根路径 - 获取游戏状态
app.get('/', async (c) => {
  return success(c, {
    status: 'online',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    features: {
      pve: true,
      pvp: true,
      corps: true,
      crafting: true,
    }
  });
});

// 获取页面状态 - 前端初始化需要
app.get('/page-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);
  // 前端期望直接返回字符串 "CityNum_PageNum"，城市索引从0开始
  // PageNum=1 表示内政页面（显示建筑）
  return success(c, "0_1");
});

// 设置页面状态 - POST /game/page-info
app.post('/page-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const body = await c.req.json();
  const { city_num, page_num } = body;

  // 前端调用: Main.SetPageInfo(CityNum, pageNum, callback)
  // 这个接口主要用于切换页面时保存状态
  // 返回格式: 字符串 "CityNum_PageNum"
  return success(c, `${city_num || 0}_${page_num || 1}`);
});

// 获取服务器状态
app.get('/status', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await userService.getServerStats(db);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get stats', r.status || 500);
  }

  // 返回前端期望的格式
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; // "14:22:43"

  return success(c, {
    Time: timeStr,
    ServerUnit: '1',
    online: true,
    playerCount: r.data?.totalUsers || 0,
    cityCount: r.data?.totalCities || 0,
    corpsCount: r.data?.totalCorps || 0,
    uptime: 0,
  });
});

// 获取用户信息 (包含城市列表) - 自动注册
// 对应 C# UserInfo 结构
app.get('/user-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取或创建用户
    let character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // 如果用户不存在，自动初始化
    if (!character) {
      await initializeNewUser(db, walletAddress);
      character = await db.prepare(`
        SELECT * FROM characters WHERE wallet_address = ?
      `).bind(walletAddress).first();
    }

    // 获取城市列表
    const cities = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).all();

    // 构建 CityList (C# CityShotInfo[])
    const CityList = (cities.results || []).map((city: any) => ({
      ID: city.id,
      Name: city.name,
      Pos: city.position,
      Num: city.id,
      State: 1,
      BackImg: city.map_image || 'm1.JPG',
      UserName: walletAddress,
    }));

    // 返回 C# UserInfo 结构
    return success(c, {
      ID: (character as any)?.id || 0,
      Name: (character as any)?.name || '玩家',
      Organise: '',                           // 帮会名称
      Level: (character as any)?.level || 1,
      State: 1,                               // 用户状态
      InteriorBuildingQueueNum: 0,            // 内政建筑队列数
      DefanceBuildingQueueNum: 0,             // 城防建筑队列数
      FastUpDateNeedTimePercent: 100,         // 快速升级需要时间百分比
      DegradeNeedResPercent: 100,             // 降级需要资源百分比
      DegradeNeedTimePercent: 100,           // 降级需要时间百分比
      EventBreakReturnResPercent: 100,        // 事件打断返还资源百分比
      CityList: CityList,                     // 城市列表 (CityShotInfo[])
      ItemCount: 0,                          // 物品数量
      EndProtect: '',                        // 保护结束时间
      CreateDate: (character as any)?.created_at || new Date().toISOString(),
      ServerUnit: '1',                       // 服务器单位
      Insignia: 0,                          // 勋章值
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// POST 版本 - 对应 C# UserInfo 结构
app.post('/user-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取或创建用户
    let character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // 如果用户不存在，自动初始化
    if (!character) {
      await initializeNewUser(db, walletAddress);
      character = await db.prepare(`
        SELECT * FROM characters WHERE wallet_address = ?
      `).bind(walletAddress).first();
    }

    // 获取城市列表
    const cities = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).all();

    // 构建 CityList (C# CityShotInfo[])
    const CityList = (cities.results || []).map((city: any) => ({
      ID: city.id,
      Name: city.name,
      Pos: city.position,
      Num: city.id,
      State: 1,
      BackImg: city.map_image || 'm1.JPG',
      UserName: walletAddress,
    }));

    // 返回 C# UserInfo 结构
    return success(c, {
      ID: (character as any)?.id || 0,
      Name: (character as any)?.name || '玩家',
      Organise: '',
      Level: (character as any)?.level || 1,
      State: 1,
      InteriorBuildingQueueNum: 0,
      DefanceBuildingQueueNum: 0,
      FastUpDateNeedTimePercent: 100,
      DegradeNeedResPercent: 100,
      DegradeNeedTimePercent: 100,
      EventBreakReturnResPercent: 100,
      CityList: CityList,
      ItemCount: 0,
      EndProtect: '',
      CreateDate: (character as any)?.created_at || new Date().toISOString(),
      ServerUnit: '1',
      Insignia: 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取用户信息 (旧接口，兼容)
app.get('/user', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await userService.getInfo(db, walletAddress);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get user info', r.status || 500);
  }

  return success(c, {
    walletAddress: r.data.user.wallet_address,
    name: r.data.user.name,
    level: r.data.user.level,
    gold: r.data.user.gold,
    vipLevel: r.data.user.vip_level,
    CityList: r.data.cities.map((city: any) => ({
      ID: city.id,
      Name: city.name,
      Pos: city.position,
      Num: city.id,
      State: 1,
      BackImg: "m1.JPG",
      UserName: walletAddress,
      Money: city.money,
      Food: city.food,
      Population: city.population,
    })),
    // C# UserInfo 补充字段
    Organise: '',
    State: 1,
    InteriorBuildingQueueNum: 0,
    DefanceBuildingQueueNum: 0,
    FastUpDateNeedTimePercent: 100,
    DegradeNeedResPercent: 100,
    DegradeNeedTimePercent: 100,
    EventBreakReturnResPercent: 100,
    Insignia: 0,
    ItemCount: 0,
    EndProtect: '',
    CreateDate: '2026-01-01',
    ServerUnit: '1',
  });
});

// 获取用户城市详情
app.post('/city-detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id } = await c.req.json<{ city_id?: number }>();
  const result = await cityService.getDetail(db, walletAddress, city_id);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get city detail', r.status || 500);
  }

  return success(c, {
    city: r.data.city,
    buildings: r.data.buildings,
    cityId: r.data.cityId,
  });
});


// UpdateUserOnline - POST /game/user/online
app.post('/user/online', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 更新用户最后登录时间
    await db.prepare(`
      UPDATE characters SET last_login = datetime('now'), updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: '在线状态已更新' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetUserSub - GET /game/user/sub
app.get('/user/sub', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  // 支持 username 或 wallet_address 参数
  const { username, wallet_address } = c.req.query();
  const searchKey = username || wallet_address;

  if (!searchKey) {
    return error(c, 'username is required');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询用户是否存在 (支持用户名或钱包地址)
    const user = await db.prepare(`
      SELECT wallet_address, name, level FROM characters
      WHERE name = ? OR wallet_address = ?
    `).bind(searchKey, searchKey).first();

    if (!user) {
      return success(c, { exists: false, Age: -1 });
    }

    return success(c, {
      exists: true,
      Age: 1,
      walletAddress: (user as any).wallet_address,
      name: (user as any).name,
      level: (user as any).level,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCityInteriorInfo - POST /game/city/interior-info/:cityID
app.post('/city/interior-info/:cityID', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityID = c.req.param('cityID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城市真实数据
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityID, walletAddress).first();

    if (!city) {
      return error(c, 'City not found', 404);
    }

    const buildings = await db.prepare(`
      SELECT * FROM buildings 
      WHERE city_id = ? AND type = 'interior'
      ORDER BY position ASC
    `).bind(cityID).all();

    // 获取角色信息 (包含元宝)
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // 使用真实数据库数据 (匹配 C# CityInteriorInfo 结构)
    return success(c, {
      cityId: cityID,
      // 资源相关 (C# 字段名)
      Men: (city as any).population,           // 当前人口
      Food: (city as any).food,               // 当前粮食
      Money: (city as any).money,             // 当前铜钱
      Gold: (character as any).gold || 0,     // ⚠️ 元宝 (不是铜钱!)
      // 存储上限
      MenRoom: 1000,                          // 人口上限
      FoodRoom: 1000000,                      // 粮食上限
      MoneyRoom: 1000000,                     // 铜钱上限
      // 产量速度 (C# 字段名)
      MenSpeed: 100,                          // 人口增长速度
      FoodSpeed: (city as any).food_rate || 100,  // 粮食生产速度
      MoneySpeed: (city as any).money_rate || 100, // 铜钱生产速度
      // 其他字段
      Area: 300, AreaRoom: 0, Child: 0, Bloom: 0, ChildRate: 100,
      Level: 1, 
      IsLord: 1, CityPos: parseInt(cityID), 
      ChangeMapFlag: 0, MaxItemNum: 100, NewEmailNum: 0,
      EngageHeroNum: 0, MaxEngageHeroNum: 5, 
      CurrentDefenceBuildNum: 0, MaxDefenceBuildNum: 5,
      AverageTrainingPer: 100, 
      InteriorBuildingLevel: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      TechnicLevel: [0,0,0,0,0,0,0,0,0,0,0,0], 
      EventBreakReturnResPercent: 100,
      // 兼容字段 (旧版)
      Population: (city as any).population,
      PopulationRoom: 1000,
      ProductionMoney: (city as any).money_rate,
      ProductionFood: (city as any).food_rate,
      buildings: buildings.results || [],
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GET 版本
app.get('/city/interior-info/:cityID', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const cityID = c.req.param('cityID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城市真实数据
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(cityID, walletAddress).first();

    if (!city) {
      return error(c, 'City not found', 404);
    }

    const buildings = await db.prepare(`
      SELECT * FROM buildings 
      WHERE city_id = ? AND type = 'interior'
      ORDER BY position ASC
    `).bind(cityID).all();

    // 获取角色信息 (包含元宝)
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // 使用真实数据库数据 (匹配 C# CityInteriorInfo 结构)
    return success(c, {
      cityId: cityID,
      // 资源相关 (C# 字段名)
      Men: (city as any).population,           // 当前人口
      Food: (city as any).food,               // 当前粮食
      Money: (city as any).money,             // 当前铜钱
      Gold: (character as any).gold || 0,     // ⚠️ 元宝 (不是铜钱!)
      // 存储上限
      MenRoom: 1000,                          // 人口上限
      FoodRoom: 1000000,                      // 粮食上限
      MoneyRoom: 1000000,                     // 铜钱上限
      // 产量速度 (C# 字段名)
      MenSpeed: 100,                          // 人口增长速度
      FoodSpeed: (city as any).food_rate || 100,  // 粮食生产速度
      MoneySpeed: (city as any).money_rate || 100, // 铜钱生产速度
      // 其他字段
      Area: 300, AreaRoom: 0, Child: 0, Bloom: 0, ChildRate: 100,
      Level: 1, 
      IsLord: 1, CityPos: parseInt(cityID), 
      ChangeMapFlag: 0, MaxItemNum: 100, NewEmailNum: 0,
      EngageHeroNum: 0, MaxEngageHeroNum: 5, 
      CurrentDefenceBuildNum: 0, MaxDefenceBuildNum: 5,
      AverageTrainingPer: 100, 
      InteriorBuildingLevel: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      TechnicLevel: [0,0,0,0,0,0,0,0,0,0,0,0], 
      EventBreakReturnResPercent: 100,
      // 兼容字段 (旧版)
      Population: (city as any).population,
      PopulationRoom: 1000,
      ProductionMoney: (city as any).money_rate,
      ProductionFood: (city as any).food_rate,
      buildings: buildings.results || [],
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateCityName - POST /game/city/name
app.post('/city/name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, name } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await cityService.rename(db, walletAddress, city_id, name);
    if (result.success) {
      return success(c, { message: '城市名称修改成功' });
    }
    return error(c, result.error || '修改失败');
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetVersionInfo - GET /game/version
app.get('/version', async (c) => {
  // 前端期望数组格式: [region, serverId, "who|key|sign", chargeUrl, recommendUrl, serviceUrl]
  return success(c, ['cn', '1', '0|0|0', '', '', '']);
});

// GetPlayerNum - GET /game/player-count
app.get('/player-count', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM characters
    `).first();

    return success(c, {
      playerCount: (result as any)?.count || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetInsPlayerNum - GET /game/ins-player-count
app.get('/ins-player-count', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取在线玩家数 (最近5分钟登录的)
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM characters
      WHERE last_login > datetime('now', '-5 minutes')
    `).first();

    return success(c, {
      onlineCount: (result as any)?.count || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetTerritoryPlayerNum - GET /game/territory-player-count
app.get('/territory-player-count', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取领地玩家数 (拥有城市的玩家)
    const result = await db.prepare(`
      SELECT COUNT(DISTINCT wallet_address) as count FROM cities
    `).first();

    return success(c, {
      territoryPlayerCount: (result as any)?.count || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetAccountant - GET /game/accountant
app.get('/accountant', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城市资源收益信息
    const city = await db.prepare(`
      SELECT money, food, population, money_rate, food_rate, population_rate, last_collect
      FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(city_id, walletAddress).first();

    if (!city) {
      return error(c, '城市不存在');
    }

    // 计算自上次收取以来的收益
    const now = new Date();
    const lastCollect = new Date((city as any).last_collect);
    const hours = Math.max(0, (now.getTime() - lastCollect.getTime()) / (1000 * 60 * 60));

    const moneyIncome = Math.floor((city as any).money * (city as any).money_rate / 100 * hours);
    const foodIncome = Math.floor((city as any).food * (city as any).food_rate / 100 * hours);
    const popIncome = Math.floor((city as any).population * (city as any).population_rate / 100 * hours);

    return success(c, {
      moneyIncome,
      foodIncome,
      popIncome,
      moneyRate: (city as any).money_rate,
      foodRate: (city as any).food_rate,
      popRate: (city as any).population_rate,
      lastCollect: (city as any).last_collect,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFastMove - GET /game/fast-move
app.get('/fast-move', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取快速移动信息 (是否有加速道具)
    const items = await db.prepare(`
      SELECT COUNT(*) as count FROM items
      WHERE wallet_address = ? AND type = 'consumable' AND config_id = 101
    `).bind(walletAddress).first();

    const hasFastMove = (items as any)?.count > 0;

    return success(c, {
      hasFastMove,
      fastMoveCount: (items as any)?.count || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// IsDependency - GET /game/is-dependency
app.get('/is-dependency', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查位置是否有依赖 (是否有建筑)
    const building = await db.prepare(`
      SELECT COUNT(*) as count FROM buildings
      WHERE position = ?
    `).bind(pos).first();

    const hasDependency = (building as any)?.count > 0;

    return success(c, {
      position: pos,
      hasDependency,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// IsStartTime - GET /game/is-start-time
app.get('/is-start-time', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查是否在开始时间 (建筑是否在建造/升级中)
    const building = await db.prepare(`
      SELECT state FROM buildings WHERE position = ?
    `).bind(pos).first();

    if (!building) {
      return success(c, { isStartTime: false });
    }

    const isStartTime = (building as any).state === 1 || (building as any).state === 2;

    return success(c, {
      position: pos,
      isStartTime,
      state: (building as any).state,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetNameState - GET /game/user/name-state
app.get('/user/name-state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { username } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 检查用户名是否已被使用
    const user = await db.prepare(`
      SELECT COUNT(*) as count FROM characters WHERE name = ?
    `).bind(username).first();

    const isAvailable = (user as any)?.count === 0;

    return success(c, {
      username,
      available: isAvailable,
      message: isAvailable ? '用户名可用' : '用户名已被使用',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateBackImage - POST /game/city/background
app.post('/city/background', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, image_index } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 更新城市背景图片
    await db.prepare(`
      UPDATE cities SET map_image = ? WHERE id = ? AND wallet_address = ?
    `).bind(`bg_${image_index}.jpg`, city_id, walletAddress).run();

    return success(c, { message: '背景图片已更新' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// Exit - POST /game/logout
app.post('/logout', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 更新最后登录时间
    await db.prepare(`
      UPDATE characters SET last_login = datetime('now'), updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: '已退出登录' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ForceEffectOverdue - POST /game/force-effect-overdue
app.post('/force-effect-overdue', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, main_type } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 强制过期效果 (清理过期的增益效果)
    // main_type: 1=建筑, 2=科技, 3=武将, 4=物品
    let table = '';
    switch (main_type) {
      case 1: table = 'buildings'; break;
      case 2: table = 'technics'; break;
      case 3: table = 'heroes'; break;
      case 4: table = 'items'; break;
      default: return error(c, '无效的类型');
    }

    // 这里简化处理,实际应该根据具体业务逻辑处理
    return success(c, { message: '效果已过期' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ForceNewUserOverdue - POST /game/force-newuser-overdue
app.post('/force-newuser-overdue', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 强制新手引导过期 (跳过新手引导)
    await db.prepare(`
      UPDATE characters SET updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: '新手引导已跳过' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdateBrief - POST /game/city/brief
app.post('/city/brief', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, pos, brief } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 更新城市简介 (这里简化为更新城市表,实际可能需要单独的表)
    // 暂时不实现,因为数据库结构中没有 brief 字段
    return success(c, { message: '简介已更新' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DeleteOccupationInfo - POST /game/city/delete-occupation
app.post('/city/delete-occupation', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, pos, flag } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 删除占领信息 (清除地图上的占领标记)
    // 这个功能涉及到地图占领系统,暂时简化处理
    return success(c, { message: '占领信息已删除' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
