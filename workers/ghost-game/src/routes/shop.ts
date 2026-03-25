/**
 * Shop Routes - 商城接口
 * 重写以匹配 C# CommodityInfo 结构
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import commoditiesConfig from '../config/commodities.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 加载商城配置
function getCommoditiesByType(type: number) {
  const commodities = (commoditiesConfig as any).Commodity || [];
  return commodities.filter((c: any) => c.Type === type);
}

// 加载单个商品配置
function getCommodityById(id: number, type: number) {
  const commodities = (commoditiesConfig as any).Commodity || [];
  return commodities.find((c: any) => c.Id === id && c.Type === type);
}

app.get('/', async (c) => {
  return success(c, { message: 'Shop API ready' });
});

// ========== GetMallInfo - GET /shop/info ==========
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    isOpen: true,
    refreshTime: '00:00',
    vipOnSale: true,
    limitedItems: [],
    categories: [
      { id: 1, name: '热销', items: 12 },
      { id: 2, name: '建筑类', items: 28 },
      { id: 3, name: '科技类', items: 4 },
      { id: 4, name: '侠客类', items: 8 },
      { id: 5, name: '军事类', items: 8 },
      { id: 6, name: '道具类', items: 8 },
      { id: 7, name: '资源类', items: 8 },
      { id: 8, name: '其它类', items: 8 },
    ],
  });
});

// ========== GetCommoditysByType - GET /shop/items-by-type ==========
// 对应前端: Main.GetCommoditysByType(cityID, MallItemType)
// ⚠️ 必须放在 /items 之前，因为 Hono 按顺序匹配
app.get('/items-by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const city_id = c.req.query('city_id');
  const commodity_type = parseInt(c.req.query('commodity_type') || '1');

  if (!city_id) {
    return error(c, '缺少参数: city_id');
  }

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取玩家的持续效果 (使用 user_name 列名)
    const effects = await db.prepare(`
      SELECT main_effect_type, effect_type FROM persist_effects
      WHERE user_name = ? AND end_time > datetime('now')
    `).bind(walletAddress).all();

    const effectSet = new Set((effects.results || []).map((e: any) => `${e.main_effect_type}_${e.effect_type}`));

    // 获取玩家的资源兑换信息 (BuyResInfo) - 从 characters 表获取
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    // 获取元宝数量 (默认 0)
    const goldAmount = Number((character as any)?.gold || 0);

    // 构建 BuyResInfo
    const buyResInfo = {
      LevelMoney: goldAmount * 100,              // 可用元宝兑换的铜钱上限
      MoneyPer: 100,                             // 每元宝兑换100铜钱
      LevelFood: goldAmount * 100,               // 可用元宝兑换的粮食上限
      FoodPer: 100,                              // 每元宝兑换100粮食
      LevelMen: goldAmount * 100,                // 可用元宝兑换的人口上限
      MenPer: 100,                               // 每元宝兑换100人口
      UsedMoney: 0,
      UsedFood: 0,
      UsedMen: 0,
    };

    // 获取商城道具
    const commodities = getCommoditiesByType(commodity_type);

    // 构建 CommodityInfo 数组 (匹配 C# 结构)
    const commodityList = commodities.map((item: any) => {
      const isUsed = effectSet.has(`${item.MainEffectType}_${item.EffectType}`) ? 1 : 0;

      return {
        Id: item.Id,
        Type: item.Type,
        TypeName: item.TypeName,
        Tips: item.Tips || '',
        Image: item.Image || '',
        Usetype: item.Usetype || 0,
        Gold: item.Gold || 0,
        BuyDes: item.BuyDes || '',
        MainEffectType: item.MainEffectType || 0,
        EffectType: item.EffectType || 0,
        Index: item.Index || 0,
        IsUsed: isUsed,
        BuyType: item.BuyType || 1,
        TradeRes: buyResInfo,  // ⚠️ 嵌套对象
        UserName: '',
        CityID: parseInt(city_id),
      };
    });

    return success(c, commodityList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ========== BuyItemFromCommodity - POST /shop/buy ==========
// 对应前端: Main.BuyItemFromCommodity(cityID, type, id, index)
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 接收前端参数: { cityID, type, id, index }
  const { cityID, type, id, index } = await c.req.json();

  if (!cityID || !type || !id) {
    return error(c, '缺少必要参数: cityID, type, id');
  }

  try {
    // 获取商品配置
    const commodity = getCommodityById(id, type);
    if (!commodity) {
      return c.json(30182); // 商品不存在
    }

    // 获取玩家信息
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character) {
      return c.json(30101); // 用户不存在
    }

    const gold = (character as any).gold || 0;
    const price = commodity.Gold || 0;

    // 检查元宝是否足够
    if (gold < price) {
      return c.json(30055); // 元宝不足
    }

    // 根据 BuyType 处理不同购买逻辑
    if (commodity.BuyType === 1) {
      // 购买道具 - 添加到物品栏
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count) VALUES (?, ?, ?)
      `).bind(walletAddress, id, 1).run();

    } else if (commodity.BuyType === 2) {
      // 购买持续效果 - 检查是否已有此效果
      const existingEffect = await db.prepare(`
        SELECT * FROM persist_effects
        WHERE user_name = ? AND main_effect_type = ? AND end_time > datetime('now')
      `).bind(walletAddress, commodity.MainEffectType).first();

      if (existingEffect) {
        return c.json(30150); // 已有此效果
      }

      // 添加持续效果
      const durationDays = commodity.EffectType || 7; // 默认7天
      await db.prepare(`
        INSERT INTO persist_effects (user_name, main_effect_type, effect_type, start_time, end_time)
        VALUES (?, ?, ?, datetime('now'), datetime('now', '+' || ? || ' days'))
      `).bind(walletAddress, commodity.MainEffectType, commodity.EffectType, durationDays).run();

    } else if (commodity.BuyType === 3 || commodity.BuyType === 4 || commodity.BuyType === 5) {
      // 资源购买 - 需要额外的 gold_amount 参数
      return error(c, '请使用 /shop/gold-buy-resource 接口购买资源');
    }

    // 扣除元宝
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    // 返回 0 表示成功
    return c.json(0);
  } catch (err: any) {
    console.error('[BuyItemFromCommodity]', err);
    return c.json(30180); // 购买失败
  }
});

// ========== UpdatePersistEffectByType - POST /shop/persist-effect ==========
// 对应前端: Main.UpdatePersistEffectByType(cityID, MainEffectType, EffectType)
app.post('/persist-effect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, main_type, effect_type } = await c.req.json();

  if (!main_type || !effect_type) {
    return error(c, '缺少参数: main_type, effect_type');
  }

  try {
    // 检查是否已有此效果
    const existingEffect = await db.prepare(`
      SELECT * FROM persist_effects
      WHERE user_name = ? AND main_effect_type = ? AND end_time > datetime('now')
    `).bind(walletAddress, main_type).first();

    if (existingEffect) {
      return c.json(30150); // 已有此效果
    }

    // 获取持续效果配置
    const effectGroups = await import('../config/persist_effect_groups.json');
    const group = (effectGroups.default as any).PersistEffectGroup?.find(
      (g: any) => g.MainEffectType === main_type && g.EffectType === effect_type
    );

    const durationDays = group?.Days || 7;

    // 添加持续效果
    await db.prepare(`
      INSERT INTO persist_effects (user_name, main_effect_type, effect_type, start_time, end_time)
      VALUES (?, ?, ?, datetime('now'), datetime('now', '+' || ? || ' days'))
    `).bind(walletAddress, main_type, effect_type, durationDays).run();

    return c.json(0); // 成功
  } catch (err: any) {
    return c.json(30180);
  }
});

// ========== GoldBuyRes - POST /shop/gold-buy-resource ==========
// 对应前端: Main.GoldBuyRes(cityID, type, goldAmount)
// type: 42=铜钱, 43=粮食, 44=人口
app.post('/gold-buy-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, resource_type, gold_amount } = await c.req.json();

  if (!city_id || !resource_type || !gold_amount) {
    return error(c, '缺少参数: city_id, resource_type, gold_amount');
  }

  try {
    // 获取玩家信息
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character) {
      return c.json(30101);
    }

    const gold = (character as any).gold || 0;

    // 检查元宝是否足够
    if (gold < gold_amount) {
      return c.json(30055); // 元宝不足
    }

    // 兑换比率: 1元宝 = 100资源
    const exchangeRate = 100;
    const resourceAmount = gold_amount * exchangeRate;

    // 根据 resource_type 添加资源
    if (resource_type === 42) {
      // 铜钱
      await db.prepare(`
        UPDATE characters SET gold = gold - ?, money = money + ? WHERE wallet_address = ?
      `).bind(gold_amount, resourceAmount, walletAddress).run();
    } else if (resource_type === 43) {
      // 粮食
      await db.prepare(`
        UPDATE characters SET gold = gold - ?, food = food + ? WHERE wallet_address = ?
      `).bind(gold_amount, resourceAmount, walletAddress).run();
    } else if (resource_type === 44) {
      // 人口
      await db.prepare(`
        UPDATE characters SET gold = gold - ?, population = population + ? WHERE wallet_address = ?
      `).bind(gold_amount, resourceAmount, walletAddress).run();
    } else {
      return error(c, '无效的资源类型');
    }

    return c.json(0); // 成功
  } catch (err: any) {
    console.error('[GoldBuyRes]', err);
    return c.json(30180);
  }
});

// ========== VIP 周卡 - GET /shop/vip-seven-days ==========
app.get('/vip-seven-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  // 返回 CommodityInfo 格式
  return success(c, {
    Id: 1,
    Type: 8,
    TypeName: 'VIP周卡',
    Tips: '7天内每日领取100元宝',
    Image: '/o/sc031.GIF',
    Usetype: 1,
    Gold: 300,
    BuyType: 2,
    MainEffectType: 1,
    EffectType: 1,
  });
});

// ========== VIP 月卡 - GET /shop/vip-thirty-days ==========
app.get('/vip-thirty-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    Id: 2,
    Type: 8,
    TypeName: 'VIP月卡',
    Tips: '30天内每日领取500元宝',
    Image: '/o/sc032.GIF',
    Usetype: 1,
    Gold: 1000,
    BuyType: 2,
    MainEffectType: 1,
    EffectType: 2,
  });
});

// ========== 免战牌 8 小时 - GET /shop/peace-eight-hours ==========
app.get('/peace-eight-hours', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    Id: 2001,
    Type: 8,
    TypeName: '8小时免战牌',
    Tips: '8小时内不会被攻击',
    Image: '/o/sc010.GIF',
    Usetype: 1,
    Gold: 200,
    BuyType: 2,
    MainEffectType: 2,
    EffectType: 1,
  });
});

// ========== 免战牌 2 天 - GET /shop/peace-two-days ==========
app.get('/peace-two-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    Id: 2002,
    Type: 8,
    TypeName: '2天免战牌',
    Tips: '2天内不会被攻击',
    Image: '/o/sc011.GIF',
    Usetype: 1,
    Gold: 500,
    BuyType: 2,
    MainEffectType: 2,
    EffectType: 2,
  });
});

// ========== 免战牌 7 天 - GET /shop/peace-seven-days ==========
app.get('/peace-seven-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    Id: 2003,
    Type: 8,
    TypeName: '7天免战牌',
    Tips: '7天内不会被攻击',
    Image: '/o/sc012.GIF',
    Usetype: 1,
    Gold: 1500,
    BuyType: 2,
    MainEffectType: 2,
    EffectType: 7,
  });
});

// ========== ResToGoldRateOfExchange - GET /shop/res-to-gold-rate ==========
app.get('/res-to-gold-rate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    moneyToGold: 100,    // 100铜钱 = 1元宝
    foodToGold: 100,     // 100粮食 = 1元宝
    menToGold: 100,      // 100人口 = 1元宝
    goldToMoney: 1,      // 1元宝 = 100铜钱
    goldToFood: 1,       // 1元宝 = 100粮食
    goldToMen: 1,        // 1元宝 = 100人口
    maxExchange: {
      money: 100000,
      food: 100000,
      men: 10000,
    },
  });
});

// ========== 兼容旧端点 (保留以防万一) ==========
app.get('/list', async (c) => {
  return c.redirect('/api/shop/info');
});

// POST /shop/list - 商城列表
// 对应前端: Main.GetCommoditysByType(cityID, type)
// C#: public CommodityInfo[] GetCommoditysByType(int cityID, int type)
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, type = 1 } = await c.req.json();
  
  if (!city_id) {
    return error(c, '缺少参数: city_id');
  }

  try {
    // 获取玩家的持续效果
    const effects = await db.prepare(`
      SELECT main_effect_type, effect_type FROM persist_effects
      WHERE user_name = ? AND end_time > datetime('now')
    `).bind(walletAddress).all();

    const effectSet = new Set((effects.results || []).map((e: any) => `${e.main_effect_type}_${e.effect_type}`));

    // 获取玩家的资源兑换信息 (BuyResInfo)
    const character = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const goldAmount = Number((character as any)?.gold || 0);

    const buyResInfo = {
      LevelMoney: goldAmount * 100,
      MoneyPer: 100,
      LevelFood: goldAmount * 100,
      FoodPer: 100,
      LevelMen: goldAmount * 100,
      MenPer: 100,
      UsedMoney: 0,
      UsedFood: 0,
      UsedMen: 0,
    };

    // 获取商城道具
    const commodities = getCommoditiesByType(parseInt(type));

    // 构建 CommodityInfo 数组 (匹配 C# CommodityInfo 结构)
    const commodityList = commodities.map((item: any) => {
      const isUsed = effectSet.has(`${item.MainEffectType}_${item.EffectType}`) ? 1 : 0;

      return {
        Id: item.Id,
        Type: item.Type,
        TypeName: item.TypeName,
        Tips: item.Tips || '',
        Image: item.Image || '',
        Usetype: item.Usetype || 0,
        Gold: item.Gold || 0,
        BuyDes: item.BuyDes || '',
        MainEffectType: item.MainEffectType || 0,
        EffectType: item.EffectType || 0,
        Index: item.Index || 0,
        IsUsed: isUsed,
        BuyType: item.BuyType || 1,
        TradeRes: buyResInfo,
        UserName: walletAddress,
        CityID: parseInt(city_id),
      };
    });

    return success(c, commodityList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

app.get('/items', async (c) => {
  // 兼容旧端点，重定向到新端点
  const query = c.req.query();
  const url = new URLSearchParams(query).toString();
  return c.redirect(`/api/shop/items-by-type${url ? '?' + url : ''}`);
});

app.post('/use-effect', async (c) => {
  // 兼容旧端点，重定向到 /persist-effect
  return c.json({ message: '请使用 /api/shop/persist-effect 接口' });
});

app.post('/exchange', async (c) => {
  // 兼容旧端点，重定向到 /gold-buy-resource
  return c.json({ message: '请使用 /api/shop/gold-buy-resource 接口' });
});

export default app;
