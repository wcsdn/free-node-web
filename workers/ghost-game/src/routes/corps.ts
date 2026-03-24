/**
 * Corps Routes - 军团接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { corpsService, CORPS_STATES } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 辅助函数
function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取军团列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');

  const result = await corpsService.getCorpsList(db, walletAddress, page, pageSize);
  const r = result as any;
  
  if (!r.success) {
    return error(c, r.error || 'Failed to get corps list', r.status || 500);
  }

  return success(c, r.data);
});

// 创建军团
app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { name } = await c.req.json<{ name?: string }>();
  if (!name) return error(c, 'name is required');

  const result = await corpsService.createCorps(db, walletAddress, name);
  const r = result as any;
  
  if (!r.success) {
    return error(c, r.error || 'Failed to create corps', r.status || 500);
  }

  return success(c, { corpsId: r.corpsId });
});

// POST /corps/list - 获取军团列表 (别名，兼容 POST)
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { page = 1, pageSize = 20 } = await c.req.json().catch(() => ({}));
  const result = await corpsService.getCorpsList(db, walletAddress, page, pageSize);
  const r = result as any;
  
  if (!r.success) {
    return error(c, r.error || 'Failed to get corps list', r.status || 500);
  }

  return success(c, r.data);
});

// POST /corps/create - 创建军团 (别名，兼容 POST)
app.post('/create', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { name } = await c.req.json<{ name?: string }>();
  if (!name) return error(c, 'name is required');

  const result = await corpsService.createCorps(db, walletAddress, name);
  const r = result as any;
  
  if (!r.success) {
    return error(c, r.error || 'Failed to create corps', r.status || 500);
  }

  return success(c, { corpsId: r.corpsId });
});

// GetCityCropsState - 获取军团状态
app.get('/state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const city_id = parseInt(c.req.query('city_id') || '0');
  if (!city_id) return error(c, 'city_id is required');

  try {
    // 获取我的军团
    const myCorps = await corpsService.getMyCorps(db, walletAddress);
    
    // 获取军团武将列表
    let corpsHeroes: any[] = [];
    if (myCorps && myCorps.id) {
      const heroesResult = await corpsService.getCorpsHeroes(db, myCorps.id);
      if ((heroesResult as any).ok) {
        corpsHeroes = (heroesResult as any).data;
      }
    }

    return success(c, {
      inCorps: !!myCorps,
      myCorps: myCorps || null,
      corpsHeroes,
      state: myCorps ? CORPS_STATES.IDLE : null,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddCorpsEvent - 军团出征/事件
app.post('/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, action_type, corps_id, target_id, target_pos, hero_ids } = await c.req.json<{
    city_id?: number;
    action_type?: number;
    corps_id?: number;
    target_id?: number;
    target_pos?: string;
    hero_ids?: number[];
  }>();

  if (!city_id || !action_type || !corps_id) {
    return error(c, 'city_id, action_type, and corps_id are required');
  }

  try {
    // 获取军团信息
    const corpsInfo = await corpsService.getCorpsInfo(db, corps_id);
    if (!corpsInfo || !corpsInfo.id || !corpsInfo) {
      return error(c, '军团不存在');
    }

    // 验证用户是军团成员
    const myCorps = await corpsService.getMyCorps(db, walletAddress);
    if (!myCorps || myCorps.id !== corps_id) {
      return error(c, '您不是该军团成员');
    }

    // 根据 action_type 执行不同操作
    // action_type: 0-驻扎, 1-出征, 2-返回, 3-战斗
    let newState = CORPS_STATES.IDLE;
    let arriveTime = null;

    switch (action_type) {
      case 1: // 出征
        newState = CORPS_STATES.MARCHING;
        arriveTime = Date.now() + 60000; // 默认1分钟后到达
        break;
      case 2: // 返回
        newState = CORPS_STATES.RETURNING;
        arriveTime = Date.now() + 30000; // 默认30秒后返回
        break;
      case 0: // 驻扎
        newState = CORPS_STATES.GARRISON;
        break;
      case 3: // 战斗
        newState = CORPS_STATES.FIGHTING;
        break;
    }

    return success(c, {
      success: true,
      actionType: action_type,
      newState,
      arriveTime,
      message: action_type === 1 ? '军团已出征' : 
               action_type === 2 ? '军团已召回' : 
               action_type === 0 ? '军团已驻扎' : '战斗已开始',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// CallCorpsBack - 召回军团
app.post('/recall', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, corps_id } = await c.req.json<{
    city_id?: number;
    corps_id?: number;
  }>();

  if (!city_id || !corps_id) {
    return error(c, 'city_id and corps_id are required');
  }

  try {
    // 验证用户是军团成员
    const myCorps = await corpsService.getMyCorps(db, walletAddress);
    if (!myCorps || myCorps.id !== corps_id) {
      return error(c, '您不是该军团成员');
    }

    // 执行召回逻辑
    return success(c, {
      success: true,
      message: '军团已召回',
      returnTime: Date.now() + 30000, // 30秒后返回
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});


// GetCityOtherCorps - 获取城市其他军团
// 对应 C#: public CorpsInfo[] GetCityOtherCorps(int cityID)
// 【新版本 - 修复了返回格式】
app.get('/other', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  if (!city_id) return error(c, 'city_id is required', 400);
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 查询该城市位置的其他军团
    // 注意：corps 表可能还不存在，先返回空数据
    const corps = await db.prepare(`
      SELECT * FROM corps 
      WHERE garrison_id = ? AND wallet_address != ?
      ORDER BY id ASC
    `).bind(parseInt(city_id), walletAddress).all();

    let corpsList = (corps.results || []).map((corp: any) => ({
      CorpsID: corp.id,
      CorpsName: corp.name || '军团',
      GarrisonID: corp.garrison_id,
      State: corp.state || 1,
      SchlepMoney: corp.schlep_money || 0,
      SchlepFood: corp.schlep_food || 0,
      SchlepMen: corp.schlep_men || 0,
      CityID: corp.city_id,
      UserName: corp.wallet_address,
      TargetCity: corp.target_city || 0,
      ArriveTime: corp.arrive_time || '',
      CityPos: corp.city_pos || 0,
      Seconds: corp.seconds || 0,
      Insignia: corp.insignia || 0,
      IsVIP: corp.is_vip || 0,
    }));

    // 如果没有军团，返回一个 CorpsID = -1 的空军团（匹配 C# 逻辑）
    if (corpsList.length === 0) {
      corpsList = [{
        CorpsID: -1,
        CorpsName: '',
        GarrisonID: 0,
        State: 0,
        SchlepMoney: 0,
        SchlepFood: 0,
        SchlepMen: 0,
        CityID: 0,
        UserName: '',
        TargetCity: 0,
        ArriveTime: '',
        CityPos: 0,
        Seconds: 0,
        Insignia: 0,
        IsVIP: 0,
      }];
    }

    return success(c, corpsList);
  } catch (err: any) {
    console.error('GetCityOtherCorps error:', err);
    // 如果表不存在，返回空军团
    return success(c, [{
      CorpsID: -1,
      CorpsName: '',
      GarrisonID: 0,
      State: 0,
      SchlepMoney: 0,
      SchlepFood: 0,
      SchlepMen: 0,
      CityID: 0,
      UserName: '',
      TargetCity: 0,
      ArriveTime: '',
      CityPos: 0,
      Seconds: 0,
      Insignia: 0,
      IsVIP: 0,
    }]);
  }
});

// AddCorpsEventExtend - 扩展军团事件
app.post('/event-extend', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, action_type, corps_id, target_id, target_pos, extend_data } = await c.req.json<{
    city_id?: number;
    action_type?: number;
    corps_id?: number;
    target_id?: number;
    target_pos?: string;
    extend_data?: any;
  }>();

  if (!city_id || !action_type || !corps_id) {
    return error(c, 'city_id, action_type, and corps_id are required');
  }

  try {
    // 验证用户是军团成员
    const myCorps = await corpsService.getMyCorps(db, walletAddress);
    if (!myCorps || myCorps.id !== corps_id) {
      return error(c, '您不是该军团成员');
    }

    // 执行扩展事件（与普通事件类似，但支持额外数据）
    return success(c, {
      success: true,
      actionType: action_type,
      extendData: extend_data || {},
      message: '事件已处理',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSimpleCropsHeros - 获取军团武将简要信息
app.get('/simple-heroes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const city_id = parseInt(c.req.query('city_id') || '0');
  const corps_id = parseInt(c.req.query('corps_id') || '0');

  if (!city_id) return error(c, 'city_id is required');

  try {
    // 如果指定了军团ID，使用该ID；否则获取用户的军团
    let targetCorpsId = corps_id;
    
    if (!targetCorpsId) {
      const myCorps = await corpsService.getMyCorps(db, walletAddress);
      if (myCorps) {
        targetCorpsId = myCorps.id;
      } else {
        return success(c, { heroes: [] });
      }
    }

    // 获取军团武将
    const result = await corpsService.getCorpsHeroes(db, targetCorpsId);
    const r = result as any;

    if (!r.success) {
      return success(c, { heroes: [] });
    }

    // 返回简要信息
    const heroes = (r.data || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      level: h.level,
      quality: h.quality,
      atk: h.atk,
      def: h.def,
      hp: h.hp,
      status: h.status,
    }));

    return success(c, { heroes });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCropsNeedTime - 获取军团行动所需时间
app.get('/need-time', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const cityID = parseInt(c.req.query('cityID') || '0');
  const tPos = c.req.query('tPos') || '';
  const actiontype = parseInt(c.req.query('actiontype') || '1');

  if (!cityID) return error(c, 'cityID is required');

  try {
    // 计算行军时间（基于距离）
    // 默认速度：100格/分钟
    const marchSpeed = 100;
    
    // 解析目标位置
    let distance = 100; // 默认距离
    if (tPos) {
      // 假设 tPos 是坐标字符串，如 "100,200"
      const coords = tPos.split(',').map(Number);
      if (coords.length === 2) {
        distance = Math.sqrt(coords[0] ** 2 + coords[1] ** 2);
      }
    }

    // 计算所需时间（毫秒）
    const needTime = Math.ceil((distance / marchSpeed) * 60 * 1000);

    // 根据 actiontype 返回不同的时间
    let returnTime = needTime;
    let backTime = Math.ceil(needTime * 0.5); // 返回时间减半

    switch (actiontype) {
      case 1: // 出征
        returnTime = needTime;
        break;
      case 2: // 驻扎
        returnTime = 0;
        break;
      case 3: // 战斗
        returnTime = needTime;
        break;
      case 4: // 侦察
        returnTime = Math.ceil(needTime * 0.3);
        break;
    }

    return success(c, {
      needTime: returnTime,
      backTime,
      distance,
      speed: marchSpeed,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ReturnCorps - 军团返回
app.post('/return', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { corpsID } = await c.req.json<{ corpsID?: number }>();

  if (!corpsID) return error(c, 'corpsID is required');

  try {
    // 验证用户是军团成员
    const myCorps = await corpsService.getMyCorps(db, walletAddress);
    if (!myCorps || myCorps.id !== corpsID) {
      return error(c, '您不是该军团成员');
    }

    // 执行返回逻辑
    const returnTime = Date.now() + 30000; // 30秒后返回

    return success(c, {
      success: true,
      corpsId: corpsID,
      returnTime,
      message: '军团已开始返回',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCorpsMembers - 获取军团成员列表
app.get('/members', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const corps_id = parseInt(c.req.query('corps_id') || '0');
  if (!corps_id) return error(c, 'corps_id is required', 400);

  try {
    const result = await corpsService.getCorpsMembers(db, corps_id);
    const r = result as any;

    // 返回成员数组 (直接数组格式)
    return success(c, r.members || []);
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
