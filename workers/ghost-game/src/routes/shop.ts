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

// ========== 辅助函数 ==========

/**
 * 获取玩家指定城市的最大道具持有数量
 * 对应 C# Item.GetItemMaxCount(userName, cityID)
 * 逻辑：
 *   1. 获取科技13（仓库扩容）效果值
 *   2. 若科技13等级>0：maxItemCount = Technic13效果值
 *   3. 若效果值<=0：maxItemCount = ItemCountOfOneCity (默认50)
 *   4. 聚义厅科技（ID=2）：额外+10
 */
async function getMaxItemCount(db: any, walletAddress: string, cityId: number): Promise<number> {
  // 默认物品数量 (ItemCountOfOneCity)
  const defaultItemCount = 50;

  // 获取玩家该城市的科技13等级
  const tech13: any = await db.prepare(`
    SELECT technic_level FROM technics WHERE wallet_address = ? AND city_id = ? AND static_index = 13
  `).bind(walletAddress, cityId).first();

  const tech13Level = tech13?.technic_level || 0;
  if (tech13Level <= 0) {
    // 科技13未研究，使用默认值
    // 聚义厅科技 (ID=2) 额外+10
    const tech2: any = await db.prepare(`
      SELECT technic_level FROM technics WHERE wallet_address = ? AND city_id = ? AND static_index = 2
    `).bind(walletAddress, cityId).first();
    const tech2Level = tech2?.technic_level || 0;
    return tech2Level > 0 ? defaultItemCount + 10 : defaultItemCount;
  }

  // 获取科技13的效果值（面积上限，EffType=13）
  // 注意：这里直接从 technics.json 读取，不依赖科技路由
  const technicConfigs = (await import('../config/technics.json')).default;
  const tech13Config = (technicConfigs as any[]).find((t: any) => t.ID === 13);
  if (!tech13Config) return defaultItemCount;

  const levelData = tech13Config.InteriorData?.find((d: any) => d.Level === tech13Level);
  let maxItemCount = levelData?.EffValue || 0;

  if (maxItemCount <= 0) maxItemCount = defaultItemCount;

  // 聚义厅科技 (ID=2) 额外+10
  const tech2: any = await db.prepare(`
    SELECT technic_level FROM technics WHERE wallet_address = ? AND city_id = ? AND static_index = 2
  `).bind(walletAddress, cityId).first();
  const tech2Level = tech2?.technic_level || 0;
  if (tech2Level > 0) maxItemCount += 10;

  return maxItemCount;
}

/**
 * 获取玩家当前物品持有数量
 * 对应 C# Item.GetItemCountByCity(userName, cityID)
 */
async function getCurrentItemCount(db: any, walletAddress: string, cityId: number): Promise<number> {
  const result: any = await db.prepare(`
    SELECT SUM(count) as total FROM items WHERE wallet_address = ?
  `).bind(walletAddress).first();
  return result?.total || 0;
}

/**
 * 写入用户日志
 * 对应 C# UserLog.CreateUseGoldLog / UserLog.CreateGetItemLog
 */
async function writeUserLog(
  db: any,
  walletAddress: string,
  logType: number,
  description: string,
  amount?: number,
  relatedAddress?: string,
  itemName?: string,
  itemType?: number
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO user_logs (wallet_address, log_type, description, amount, related_address, item_name, item_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      logType,
      description,
      amount ?? 0,
      relatedAddress ?? null,
      itemName ?? null,
      itemType ?? null
    ).run();
  } catch {
    // 若 user_logs 表不存在，静默忽略（避免影响主流程）
  }
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
    // 获取玩家的持续效果 (使用 wallet_address 列名)
    const effects = await db.prepare(`
      SELECT main_effect_type, effect_type FROM persist_effects
      WHERE wallet_address = ? AND end_time > datetime('now')
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
// C#: Item.BuyItemFromCommodity(userName, cityID, type, id, index)
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

  // ========== 商品类型校验 ==========
  // commodities.json 中 Type 1=热销 2=建筑类 3=科技类 4=侠客类 5=军事类 6=道具类 7=资源类 8=其它类
  const validTypes = [1, 2, 3, 4, 5, 6, 7, 8];
  if (!validTypes.includes(type)) {
    return c.json(30182); // 商品不存在（非法类型）
  }

  try {
    // ========== 获取商品配置 ==========
    const commodity = getCommodityById(id, type);
    if (!commodity) {
      return c.json(30182); // 商品不存在
    }

    // ========== Index 校验严格化 - 不匹配应拒绝 ==========
    if (index !== undefined && commodity.Index !== undefined && commodity.Index !== 0 && index !== commodity.Index) {
      return c.json(30182); // index 不匹配，拒绝购买
    }

    // 获取玩家信息
    const character: any = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!character) {
      return c.json(30101); // 用户不存在
    }

    const gold = character.gold || 0;
    const price = commodity.Gold || 0;

    // 检查元宝是否足够
    if (gold < price) {
      return c.json(30055); // 元宝不足
    }

    // ========== BuyType=1: 道具购买 - 先检查后插入 ==========
    if (commodity.BuyType === 1) {
      // 检查物品数量是否已达上限
      const maxCount = await getMaxItemCount(db, walletAddress, cityID);
      const currentCount = await getCurrentItemCount(db, walletAddress, cityID);
      if (currentCount >= maxCount) {
        return c.json(30055); // 物品数量已达上限
      }
      // 扣除元宝
      await db.prepare(`
        UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
      `).bind(price, walletAddress).run();
      // 添加道具
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source) VALUES (?, ?, 1, 'shop_buy')
      `).bind(walletAddress, id, 1).run();

    } else if (commodity.BuyType === 2) {
      // ========== BuyType=2: 持续效果购买 ==========
      const existingEffect = await db.prepare(`
        SELECT * FROM persist_effects
        WHERE wallet_address = ? AND main_effect_type = ? AND end_time > datetime('now')
      `).bind(walletAddress, commodity.MainEffectType).first();

      if (existingEffect) {
        return c.json(30150); // 已有此效果
      }
      // 扣除元宝
      await db.prepare(`
        UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
      `).bind(price, walletAddress).run();
      const durationDays = commodity.EffectType || 7;
      await db.prepare(`
        INSERT INTO persist_effects (wallet_address, main_effect_type, effect_type, start_time, end_time)
        VALUES (?, ?, ?, datetime('now'), datetime('now', '+' || ? || ' days'))
      `).bind(walletAddress, commodity.MainEffectType, commodity.EffectType, durationDays).run();

    } else if (commodity.BuyType === 3 || commodity.BuyType === 4 || commodity.BuyType === 5) {
      // 资源购买
      return error(c, '请使用 /shop/gold-buy-resource 接口购买资源');
    }

    // ========== 写入 UserLog ==========
    // LogType: 6=商城购买元宝消费, 7=商城购买获得道具
    if (price > 0) {
      await writeUserLog(db, walletAddress, 6,
        `商城购买: ${commodity.TypeName || '商品'} #${id}`,
        price, null, commodity.TypeName || '', type);
    }
    if (commodity.BuyType === 1) {
      await writeUserLog(db, walletAddress, 7,
        `获得道具: ${commodity.TypeName || '商品'} #${id}`,
        0, null, commodity.TypeName || '', type);
    }

    return c.json(0); // 成功
  } catch (err: any) {
    console.error('[BuyItemFromCommodity]', err);
    return c.json(30180); // 购买失败
  }
});

// ========== BuyItem - POST /shop/buy-item ==========
// 对应 C# Item.BuyItem(userName, cityID, itemID, price)
// 玩家间道具交易 - 从市场购买其他玩家的道具
app.post('/buy-item', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, item_id, price } = await c.req.json();

  // 价格校验
  if (!price || price <= 0) {
    return c.json(30156); // 无效价格
  }

  try {
    // ========== 获取市场挂单信息（State=4 表示上架中）============
    const listing: any = await db.prepare(`
      SELECT ml.*, ic.Name as item_name, ic.Icon as item_icon, ic.Quality as item_quality,
             i.State as item_state, i.HeroID as item_hero_id, i.SellFlag as item_sell_flag
      FROM market_listings ml
      LEFT JOIN items_config ic ON ml.config_id = ic.ID
      LEFT JOIN items i ON i.id = ml.item_id
      WHERE ml.item_id = ? AND ml.state = 4
    `).bind(item_id).first();

    if (!listing) {
      return c.json(30117); // 道具不存在或已下架
    }

    // ========== 补充完整状态机检查 ==========
    // 道具状态必须为上架中 (State=4)
    if (listing.item_state !== 4) {
      return c.json(30117); // 道具状态异常，不能交易
    }

    // 道具不能装备在英雄身上
    if (listing.item_hero_id && listing.item_hero_id !== 0) {
      return c.json(30117); // 道具已装备，不能交易
    }

    // 道具 SellFlag=1 不可出售
    if (listing.item_sell_flag === 1) {
      return c.json(30117); // 道具不可出售
    }

    const sellerAddress = listing.seller_address;

    // 不能购买自己的道具
    if (sellerAddress === walletAddress) {
      return c.json(30169); // 不能和自己交易
    }

    // 价格校验
    if (price <= 0) {
      return c.json(30156); // 无效价格
    }

    // 价格必须与上架价格一致
    if (price !== listing.price) {
      return c.json(30157); // 价格不符
    }

    // 获取买方元宝
    const buyer: any = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!buyer || buyer.gold < price) {
      return c.json(30055); // 元宝不足
    }

    // 检查买方物品数量是否已达上限
    const maxCount = await getMaxItemCount(db, walletAddress, city_id);
    const currentCount = await getCurrentItemCount(db, walletAddress, city_id);
    if (currentCount >= maxCount) {
      return c.json(30055); // 物品数量已达上限
    }

    // 获取卖方元宝（确保卖家存在）
    const seller: any = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(sellerAddress).first();

    // 扣除买方元宝
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    // 增加卖方元宝
    if (seller) {
      await db.prepare(`
        UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
      `).bind(price, sellerAddress).run();
    }

    // 转移道具所有权
    await db.prepare(`
      UPDATE items SET wallet_address = ?, source = 'market_buy' WHERE id = ?
    `).bind(walletAddress, item_id).run();

    // 将市场挂单标记为已售出 (state=2)
    await db.prepare(`
      UPDATE market_listings SET state = 2 WHERE item_id = ? AND seller_address = ?
    `).bind(item_id, sellerAddress).run();

    // ========== 写入 UserLog ==========
    // 买方元宝消费日志 (logType=6)
    await writeUserLog(db, walletAddress, 6,
      `从玩家 ${sellerAddress} 处购买道具: ${listing.item_name || '道具'} #${item_id}`,
      price, sellerAddress, listing.item_name || '', listing.item_type);

    // 卖方元宝入账日志 (logType=6, amount为正数表示收入)
    if (seller) {
      await writeUserLog(db, sellerAddress, 6,
        `出售道具给玩家 ${walletAddress}: ${listing.item_name || '道具'} #${item_id}`,
        price, walletAddress, listing.item_name || '', listing.item_type);
    }

    // 买方获得道具日志 (logType=7, getType=3 从玩家处购得)
    await writeUserLog(db, walletAddress, 7,
      `从玩家 ${sellerAddress} 处购得道具: ${listing.item_name || '道具'} #${item_id}`,
      0, sellerAddress, listing.item_name || '', 3);

    // ========== 创建交易邮件（卖方通知）============
    // mailType=4 表示交易邮件
    await db.prepare(`
      INSERT INTO mails (receiver_address, sender_address, mail_type, subject, content, is_read, created_at)
      VALUES (?, ?, 4, '道具已售出', ?, 0, datetime('now'))
    `).bind(sellerAddress, walletAddress,
      `您上架的道具「${listing.item_name || '道具'}」已被玩家 ${walletAddress} 购买，获得 ${price} 元宝。`).run();

    return c.json(0); // 成功
  } catch (err: any) {
    console.error('[BuyItem]', err);
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
      WHERE wallet_address = ? AND main_effect_type = ? AND end_time > datetime('now')
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
      INSERT INTO persist_effects (wallet_address, main_effect_type, effect_type, start_time, end_time)
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
      WHERE wallet_address = ? AND end_time > datetime('now')
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
