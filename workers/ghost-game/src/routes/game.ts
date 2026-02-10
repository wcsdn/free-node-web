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

// 获取服务器状态
app.get('/status', async (c) => {
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const result = await userService.getServerStats(db);
  const r = result as any;
  if (!r.ok) {
    return error(c, r.error || 'Failed to get stats', r.status || 500);
  }

  return success(c, {
    online: true,
    playerCount: r.data?.totalUsers || 0,
    cityCount: r.data?.totalCities || 0,
    corpsCount: r.data?.totalCorps || 0,
    uptime: 0,
  });
});

// 获取用户信息 (包含城市列表) - 自动注册
app.get('/user-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取或创建用户和城市
    const result = await cityService.getOrCreate(db, walletAddress);
    const r = result as any;
    
    if (!r.ok) {
      return error(c, r.error || 'Failed', r.status || 500);
    }

    return success(c, {
      walletAddress: r.data.city.wallet_address,
      character: {
        name: '玩家',
        level: 1,
        gold: 1000,
      },
      city: r.data.city,
      buildings: r.data.buildings,
      heroes: [],
      isNew: r.data.isNew,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// POST 版本也支持 (兼容某些客户端)
app.post('/user-info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await cityService.getOrCreate(db, walletAddress);
    const r = result as any;
    
    if (!r.ok) {
      return error(c, r.error || 'Failed', r.status || 500);
    }

    return success(c, {
      walletAddress: r.data.city.wallet_address,
      character: {
        name: '玩家',
        level: 1,
        gold: 1000,
      },
      city: r.data.city,
      buildings: r.data.buildings,
      heroes: [],
      isNew: r.data.isNew,
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
      Position: city.position,
      Money: city.money,
      Food: city.food,
      Population: city.population,
    })),
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

export default app;
