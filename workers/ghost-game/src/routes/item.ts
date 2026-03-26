/**
 * 物品路由 - 完整版
 * 支持：背包管理、物品使用、合成、分解、强化
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import itemConfigs from '../config/items.json';
import skillsConfig from '../config/skills.json';
import itemDisassemble from '../config/item_disassemble.json';
import itemExchange from '../config/item_exchange.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 物品类型
const ITEM_TYPES = {
  CONSUMABLE: 1,   // 消耗品
  MATERIAL: 2,     // 材料
  EQUIPMENT: 3,    // 装备
  SPECIAL: 4,      // 特殊
  RESOURCE: 5,     // 资源
};

// 获取物品配置
app.get('/configs', async (c) => {
  const items = ((itemConfigs as any).Item || []).map((item: any) => ({
    id: item.ID || item.Index,
    index: item.Index,
    name: item.Name,
    type: item.Type,
    typeName: Object.entries(ITEM_TYPES).find(([_, v]) => v === item.Type)?.[0],
    description: item.Des || '',
    icon: item.Icon || item.Image,
    price: item.SellMoney || item.Price,
    effectType: item.EffectType,
    effectValue: item.EffectValue,
    level: item.Level,
    quality: item.Quality,
    stackable: true,
  }));

  return success(c, { items, total: items.length });
});

// 获取背包 /item/list (alias for /)
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { type } = c.req.query();

  try {
    let query = `
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type, ic.Des as description, 
             ic.Icon as icon, ic.Price as SellMoney, ic.EffectType, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ?
    `;
    const params: any[] = [walletAddress];

    if (type) {
      query += ' AND ic.Type = ?';
      params.push(parseInt(type));
    }

    query += ' ORDER BY i.id DESC';

    const items = await db.prepare(query).bind(...params).all();

    // 格式化为C# DBItem字段 + 前端装备属性
    const formattedItems = (items.results || []).map((item: any) => ({
      ItemID: item.id,
      ID: item.id,
      StaticIndex: item.config_id,
      UserName: item.wallet_address,
      CityID: 1,
      HeroID: item.hero_id || 0,
      CorpsID: 0,
      ItemName: item.item_name || '物品',
      ItemType: (item.item_type ?? item.type) || 1,
      State: item.equipped ? 1 : 0,
      Price: item.SellMoney || 0,
      Durability: item.durability || 100,
      SellDate: item.created_at,
      UseGetExp: 0,
      HitPoint: 0,
      ItemLevel: 1,
      // 前端 Item.js 装备属性
      Attack: 0,
      CR: 0,
      DR: 0,
      Defence: 0,
      FR: 0,
      LR: 0,
      // 前端 Item.js 物品字段
      Name: item.item_name || '物品',
      Image: item.icon || '/items/default.gif',
      Level: 1,
      UseLevel: 1,
      UseSex: 0,
      UseUnion: 0,
      UseType: item.EffectType || 1,
      UseGold: 0,
      SellFlag: item.equipped ? 1 : 0,
      // C# ItemInfo 资源获取字段 (前端 Item.js 使用)
      GetMen: item.GetMen || 0,
      // C# ItemInfo.UserSkillType (映射自 config.SkillType)
    }));

    return success(c, formattedItems);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取背包 (alias for /list)
// GetItemByType - 获取指定城市指定类型指定页数的道具列表
// C#: public ItemInfo[] GetItemByType(int cityID, int type, int page, int orderBy, int orderType)
// 返回: ItemInfo[] 数组，没有物品时返回 [{ID: -1}]
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { city_id, item_type, page = '1', order_by = '0', order_type = '0' } = c.req.query();

  try {
    const pageNum = parseInt(page);
    const pageSize = 10;  // C# 固定每页 10 个
    const offset = (pageNum - 1) * pageSize;

    let query = `
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type, ic.Des as description, 
             ic.Icon as icon, ic.Price as SellMoney, ic.EffectType, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ?
    `;
    const params: any[] = [walletAddress];

    if (item_type) {
      query += ' AND ic.Type = ?';
      params.push(parseInt(item_type));
    }

    // 排序
    const orderByField = order_by === '1' ? 'i.created_at' : 'i.id';
    const orderDirection = order_type === '1' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${orderByField} ${orderDirection} LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const items = await db.prepare(query).bind(...params).all();

    // 如果没有物品，返回 [{ID: -1}]（匹配 C# 行为）
    if (!items.results || items.results.length === 0) {
      return success(c, [{ ID: -1 }]);
    }

    // 格式化为 ItemInfo 数组（匹配 C# DBItem 字段 + 前端需要的字段）
    const itemInfoList = (items.results || []).map((item: any) => ({
      // C# DBItem 字段
      ID: item.id,
      StaticIndex: item.config_id,
      UserName: walletAddress,
      CityID: parseInt(city_id || '0'),
      HeroID: item.hero_id || 0,
      CorpsID: 0,
      ItemName: item.item_name || '物品',
      ItemType: item.item_type ?? 1,
      State: item.equipped ? 1 : 0,
      Price: item.SellMoney || 0,
      Durability: item.durability || 100,
      SellDate: item.created_at,
      UseGetExp: 0,
      HitPoint: 0,
      ItemLevel: 1,
      // 前端 Item.js 使用的装备属性字段
      Attack: 0,
      CR: 0,
      DR: 0,
      Defence: 0,
      FR: 0,
      LR: 0,
      // 前端 Item.js 使用的物品字段
      Name: item.item_name || '物品',
      Image: item.icon || '/items/default.gif',
      Level: 1,
      UseLevel: 1,
      UseSex: 0,
      UseUnion: 0,
      UseType: item.EffectType || 1,
      UseGold: 0,
      SellFlag: item.equipped ? 1 : 0,
      m_heroID: item.hero_id || 0,
      // C# ItemInfo 资源获取字段 (前端 Item.js 使用)
      GetMen: item.GetMen || 0,
      // C# ItemInfo.UserSkillType (映射自 config.SkillType)
    }));

    return success(c, itemInfoList);
  } catch (err: any) {
    console.error('GetItemByType error:', err);
    // 如果表不存在或查询失败，返回 [{ID: -1}]
    return success(c, [{ ID: -1 }]);
  }
});

// GetItemNum - 获取指定城市道具总个数以及各种类型道具个数
// 对应 C#: public int[] GetItemNum(int cityID, int type)
// 返回: int[2] - [0]=总数, [1]=指定类型的页数
// 【新版本 - 修复了返回格式，返回数组而不是对象】
// 【重要】必须放在 /:id 之前，否则会被 /:id 路由匹配
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取该用户的物品总数（不限制城市，因为 items 表可能没有 city_id 字段）
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as count FROM items
      WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const totalCount = (totalResult as any)?.count || 0;

    // 获取指定类型的物品数量
    let typeCount = 0;
    if (item_type) {
      const typeResult = await db.prepare(`
        SELECT COUNT(*) as count FROM items i
        LEFT JOIN items_config ic ON i.config_id = ic.ID
        WHERE i.wallet_address = ? AND ic.Type = ?
      `).bind(walletAddress, parseInt(item_type)).first();
      
      typeCount = (typeResult as any)?.count || 0;
    }

    // 计算页数（每页 10 个）
    let pageCount = 0;
    if (typeCount > 0) {
      if (typeCount % 10 === 0) {
        pageCount = typeCount / 10;
      } else {
        pageCount = Math.floor(typeCount / 10) + 1;
      }
    }

    // 返回数组 [总数, 页数]
    return success(c, [totalCount, pageCount]);
  } catch (err: any) {
    console.error('GetItemNum error:', err);
    // 如果表不存在或查询失败，返回 [0, 0]
    return success(c, [0, 0]);
  }
});

// 获取单个物品详情
// GetItemByID - GET /item/:id - 获取物品详情
// C#: public ItemInfo GetItemByID(int id)
// 返回: ItemInfo (单个对象，不是数组)
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const itemId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item: any = await db.prepare(`
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type, ic.Des as description, 
             ic.Icon as icon, ic.Price as SellMoney, ic.EffectType, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) return error(c, 'Item not found', 404);

    // 获取装备的技能列表 (基于 SkillType 映射)
    const itemConfig = (itemConfigs as any).Item?.find((i: any) => i.Index === item.config_id || i.ID === item.config_id);
    const skillType = itemConfig?.SkillType;
    const skillsData = (skillsConfig as Record<string, any>);
    const skillTypeToSkillIds: Record<number, number[]> = {
      1: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], // 暗器
      2: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // 飞刀
      3: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], // 弓箭
      4: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], // 匕首
      5: [1, 2, 3, 4],  // 单刀
      6: [5, 6],        // 锤
      7: [7, 8],        // 枪
      8: [9, 10],       // 剑
      9: [65, 66],      // 扇
      10: [11, 12],     // 特殊
    };
    const skillIds = (skillType && skillType !== 0) ? (skillTypeToSkillIds[skillType] || []) : [];
    const SkillList = skillIds.slice(0, 1).map((sid: number) => {
      const s = skillsData[String(sid)];
      return {
        ID: sid,
        HeroID: 0,
        SkillLevel: 1,
        EXP: 0,
        StaticIndex: sid,
        Name: s?.name || `技能${sid}`,
        Type: s?.type || 1,
        Des: s?.description || '',
        Probability: s?.probability || 100,
        EffID: s?.effID || 1,
        EffValue: s?.effectValue || 0,
        EffRange: s?.effectRange || 1,
        NeedItemType: s?.needItemType || 0,
      };
    });

    // 获取镶嵌在该装备上的宝石
    let ItemList: any[] = [];
    try {
      const gems = await db.prepare(`
        SELECT ug.*, gc.name, gc.type as gem_type, gc.atk, gc.def, gc.hp, gc.critical, gc.price
        FROM user_gems ug
        LEFT JOIN gems_config gc ON ug.gem_id = gc.id
        WHERE ug.item_id = ?
        ORDER BY ug.slot
      `).bind(itemId).all() as any;
      
      ItemList = (gems.results || []).map((gem: any) => ({
        ID: gem.id,
        Name: gem.name || `宝石${gem.gem_id}`,
        ItemType: 100, // 宝石类型
        Des: `${gem.gem_type || 'atk'}宝石，镶嵌于装备`,
        Level: gem.level || 1,
        Quality: Math.floor((gem.gem_id - 1) / 4) + 1 || 1,
        Price: gem.price || 0,
        UseLevel: 0,
        UseSex: 0,
        UseUnion: 0,
        HitPoint: gem.hp || 0,
        Durability: 0,
        Attack: gem.atk || 0,
        Defence: gem.def || 0,
        FR: 0, LR: 0, CR: Math.round((gem.critical || 0) * 100), DR: 0,
        SellMoney: Math.floor((gem.price || 0) * 0.5),
        SellFood: 0,
        Image: gem.icon || '/items/gem.gif',
        Icon: gem.icon || '/items/gem.gif',
        StaticIndex: gem.gem_id || 0,
        State: 0,
        UserName: walletAddress,
        CityID: 1,
        // 宝石特有属性
        GemType: gem.gem_type || 'atk',
        GemLevel: gem.level || 1,
      }));
    } catch {
      ItemList = [];
    }

    // 格式化为 C# ItemInfo 结构
    const itemInfo = {
      // C# DBItem 字段
      ID: item.id,
      StaticIndex: item.config_id,
      UserName: item.wallet_address,
      CityID: 1,
      HeroID: item.hero_id || 0,
      CorpsID: 0,
      ItemName: item.item_name || '物品',
      ItemType: item.item_type ?? 1,
      State: item.equipped ? 1 : 0,
      Price: item.SellMoney || 0,
      Durability: item.durability || 100,
      SellDate: item.created_at,
      UseGetExp: 0,
      HitPoint: item.HitPoint || 0,
      ItemLevel: item.item_level || 1,
      // 装备属性
      Attack: item.cfg_attack || 0,
      CR: item.CR || 0,
      DR: item.DR || 0,
      Defence: 0,
      FR: 0,
      LR: 0,
      // 前端 Item.js 使用的字段
      Name: item.item_name || '物品',
      Image: item.icon || '/items/default.gif',
      Level: 1,
      UseLevel: 1,
      UseSex: 0,
      UseUnion: 0,
      UseType: item.EffectType || 1,
      UseGold: 0,
      SellFlag: item.equipped ? 1 : 0,
      m_heroID: item.hero_id || 0,
      // 描述
      Des: item.description || '',
      Icon: item.icon || item.image || '/items/default.gif',
      // C# ItemInfo 资源获取字段 (前端 Item.js 使用)
      GetMen: item.GetMen || 0,
      // 技能列表 (该装备提供的技能)
      SkillList,
      // 宝石/附魔列表 (该装备镶嵌的宝石)
      ItemList,
    };

    return success(c, itemInfo);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 使用物品
// C#: UseItem(string userName, int cityID, int itemID) returns string[]
// 返回: string[] - 获得的物品名称列表
app.post('/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, itemID } = await c.req.json();
  if (!itemID) return error(c, 'Missing itemID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取物品（按 itemID 精确匹配）
    const inv: any = await db.prepare(`
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type,
             ic.EffectType, ic.EffectValue, ic.ItemType
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(itemID, walletAddress).first();

    if (!inv) return error(c, '物品不存在', 404);

    // 检查物品类型必须是消耗品(1)
    const itemType = inv.item_type ?? inv.ItemType ?? 1;
    if (itemType !== 1) {
      return error(c, '该物品不是消耗品类型');
    }

    // 检查数量
    if ((inv.count || 1) < 1) {
      return error(c, '物品数量不足');
    }

    const itemConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === parseInt(inv.config_id));
    if (!itemConfig) return error(c, 'Item config not found');

    // 返回获得的物品名称列表（C# 返回 string[]）
    const resultNames: string[] = [];

    // 消耗物品
    if ((inv.count || 1) > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(itemID).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(itemID).run();
    }

    // 添加新获得的物品
    const newItemLevel = itemConfig.Level || 1;
    const newItemQuality = itemConfig.Quality || 1;
    // 模拟 C# CreateItem 生成新物品

    // 根据 EffectType 处理资源获取
    if (itemConfig.EffectType === 3) { // 获得资源
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();

      if (city) {
        await db.prepare(`
          UPDATE cities SET
            food = food + ?,
            money = money + ?
          WHERE id = ?
        `).bind(
          itemConfig.GetFood || 0,
          itemConfig.GetMoney || 0,
          city.id
        ).run();
      }
    }

    if (itemConfig.EffectType === 4 && cityID) { // 增加金币
      await db.prepare(`
        UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
      `).bind(itemConfig.GetGold || 0, walletAddress).run();
    }

    if (itemConfig.EffectType === 5) { // 增加兵力
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();

      if (city) {
        await db.prepare(`
          UPDATE cities SET population = population + ? WHERE id = ?
        `).bind(itemConfig.GetMen || 0, city.id).run();
      }
    }

    // 返回获得的物品名称（C# UseItem 返回 string[]）
    resultNames.push(itemConfig.Name);

    return success(c, resultNames);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获得物品
app.post('/add', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { config_id, count = 1, source = 'system' } = await c.req.json();
  if (!config_id) return error(c, 'Missing config_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const itemConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === parseInt(config_id));

    // 检查是否已拥有
    const existing: any = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, config_id).first();

    if (existing) {
      await db.prepare(`
        UPDATE items SET count = count + ? WHERE wallet_address = ? AND config_id = ?
      `).bind(count, walletAddress, config_id).run();
    } else {
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, ?, ?)
      `).bind(walletAddress, config_id, count, source).run();
    }

    return success(c, {
      configId: config_id,
      name: itemConfig?.Name || '物品',
      count,
      message: `获得了 ${count} 个 ${itemConfig?.Name || '物品'}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 物品分解
// C#: DisassembleItem(string userName, int cityID, int itemID, int index)
// 分解装备类物品，返还材料。index = StaticIndex
app.post('/disassemble', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, StaticIndex } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');
  if (!StaticIndex) return error(c, 'Missing StaticIndex');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取物品（必须是静态索引的物品，检查是否装备或运输中）
    const inv: any = await db.prepare(`
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type,
             ic.EffectType, ic.EffectValue, ic.SellFood, ic.SellMoney,
             ic.Attack, ic.CR, ic.DR, ic.Defence, ic.FR, ic.LR, ic.HitPoint,
             ic.Icon, ic.Des, ic.Price, ic.Level, ic.Quality, ic.GetFood,
             ic.GetMen, ic.GetMoney, ic.GetGold, ic.UseGold, ic.UseLevel,
             ic.UseSex, ic.UseType, ic.UseUnion, ic.SkillType, ic.NeedUserLevel,
             ic.GetValue, ic.LostRate, ic.GetItemStatic, ic.SellFlag
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!inv) return error(c, '物品不存在', 404);

    // 检查物品是否装备在英雄身上或运输中
    if ((inv as any).hero_id && (inv as any).hero_id > 0) {
      return error(c, '物品已装备在英雄身上，不能分解', 400);
    }
    if ((inv as any).corps_id && (inv as any).corps_id > 0) {
      return error(c, '物品运输中，不能分解', 400);
    }

    const staticIndex = StaticIndex;

    // 从 C# XmlData.ItemDisassemble 中查找分解配方
    // 格式: { [fromIndex]: { ToItemID, ToItemNum } }
    const disassembleRecipes = (itemDisassemble as any).items || [];
    const recipe = disassembleRecipes.find((r: any) => r.itemId === staticIndex);

    if (!recipe) {
      return error(c, '该物品不能分解');
    }

    // 消耗物品（减少1个）
    if ((inv as any).count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    // 添加分解产物（材料）
    const rewards: any[] = [];
    const rewardCount = recipe.disassemblyNum || 1;
    const rewardConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === recipe.disassemblyId);

    if (recipe.disassemblyId) {
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, ?, 'disassemble')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + ?
      `).bind(walletAddress, recipe.disassemblyId, rewardCount, rewardCount).run();

      rewards.push({
        id: recipe.disassemblyId,
        name: rewardConfig?.Name || '材料',
        count: rewardCount,
      });
    }

    return success(c, {
      itemId: item_id,
      itemName: inv.item_name,
      disassembledName: rewardConfig?.Name || '材料',
      disassembledNum: rewardCount,
      rewards,
      message: `分解 1 个 ${inv.item_name} 成功，获得 ${rewardCount} 个 ${rewardConfig?.Name || '材料'}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 物品兑换
app.post('/exchange', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { exchange_id } = await c.req.json();
  if (!exchange_id) return error(c, 'Missing exchange_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const recipe = (itemExchange as any)[exchange_id];
    if (!recipe) return error(c, 'Invalid exchange recipe');

    // 验证并扣除材料
    const materialIds = [];
    for (let i = 1; i <= 10; i++) {
      const key = `ItemIndex${i}`;
      if (recipe[key]) materialIds.push(recipe[key]);
    }

    for (const materialId of materialIds) {
      const inv: any = await db.prepare(`
        SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
      `).bind(walletAddress, materialId).first();

      if (!inv || inv.count < 1) {
        const itemConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === materialId);
        return error(c, `材料不足: ${itemConfig?.Name || materialId}`);
      }
    }

    // 扣除材料
    for (const materialId of materialIds) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE wallet_address = ? AND config_id = ?
      `).bind(walletAddress, materialId).run();
    }

    // 添加产物
    const rewards: any[] = [];
    if (recipe.GetItemIndex) {
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, 1, 'exchange')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + 1
      `).bind(walletAddress, recipe.GetItemIndex).run();

      const rewardConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === recipe.GetItemIndex);
      rewards.push({
        id: recipe.GetItemIndex,
        name: rewardConfig?.Name || '物品',
        count: 1,
      });
    }

    return success(c, {
      exchangeId: exchange_id,
      rewards,
      message: '兑换成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 出售物品
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, price } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const inv: any = await db.prepare(`
      SELECT i.*, ic.SellMoney 
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND i.config_id = ?
    `).bind(walletAddress, item_id).first();

    if (!inv || (inv.count || 1) < 1) {
      return error(c, 'Not enough items');
    }

    const sellPrice = price || (inv as any).SellMoney || 10;
    const totalPrice = sellPrice;

    // 扣除物品
    await db.prepare(`
      UPDATE items SET count = count - 1 WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, item_id).run();

    // 增加金币
    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(totalPrice, walletAddress).run();

    const itemConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === parseInt(item_id));

    return success(c, {
      itemId: item_id,
      name: itemConfig?.Name || '物品',
      count: 1,
      pricePerItem: sellPrice,
      totalPrice,
      message: `出售成功，获得 ${totalPrice} 金条`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 删除物品
app.delete('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (count) {
      await db.prepare(`
        UPDATE items SET count = count - ? WHERE wallet_address = ? AND config_id = ? AND count >= ?
      `).bind(count, walletAddress, item_id, count).run();
    } else {
      await db.prepare(`
        DELETE FROM items WHERE wallet_address = ? AND config_id = ?
      `).bind(walletAddress, item_id).run();
    }

    return success(c, { message: 'Item(s) removed' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 整理背包
app.post('/organize', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取所有物品
    const items = await db.prepare(`
      SELECT id, config_id, count FROM items WHERE wallet_address = ?
    `).bind(walletAddress).all();

    // 合并相同物品
    const merged: Record<number, number> = {};
    for (const item of (items.results || [])) {
      const configId = (item as any).config_id;
      const count = (item as any).count;
      if (merged[configId]) {
        merged[configId] += count;
        // 删除旧记录
        await db.prepare(`DELETE FROM items WHERE id = ?`).bind((item as any).id).run();
      } else {
        merged[configId] = count;
      }
    }

    // 更新或保留物品
    for (const [configId, count] of Object.entries(merged)) {
      const existing: any = await db.prepare(`
        SELECT id FROM items WHERE wallet_address = ? AND config_id = ?
      `).bind(walletAddress, configId).first();

      if (existing) {
        await db.prepare(`
          UPDATE items SET count = ? WHERE id = ?
        `).bind(count, existing.id).run();
      }
    }

    // 重新获取整理后的背包
    const organizedItems = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();

    return success(c, {
      message: '背包整理完成',
      items: organizedItems.results || [],
      totalSlots: 100,  // 假设最大容量
      usedSlots: (organizedItems.results || []).length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});


// GetItemByType - GET /item/by-type
app.get('/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_type, page = '1', order_by = 'created_at', order_type = 'DESC' } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const pageNum = parseInt(page);
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    let query = `
      SELECT i.*, ic.Name as item_name, ic.Type as item_type, ic.Des as description, ic.Icon as icon
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ?
    `;
    const params: any[] = [walletAddress];

    if (item_type) {
      query += ' AND ic.Type = ?';
      params.push(parseInt(item_type));
    }

    query += ` ORDER BY ${order_by} ${order_type} LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const items = await db.prepare(query).bind(...params).all();

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM items i LEFT JOIN items_config ic ON i.config_id = ic.ID WHERE i.wallet_address = ?';
    const countParams: any[] = [walletAddress];
    if (item_type) {
      countQuery += ' AND ic.Type = ?';
      countParams.push(parseInt(item_type));
    }
    const countResult: any = await db.prepare(countQuery).bind(...countParams).first();

    return success(c, {
      items: items.results || [],
      page: pageNum,
      pageSize,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / pageSize),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetItemCanUse - GET /item/can-use
app.get('/can-use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_type, level, sex, union, page = '1' } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const pageNum = parseInt(page);
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    let query = `
      SELECT i.*, ic.*
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND i.count > 0
    `;
    const params: any[] = [walletAddress];

    if (item_type) {
      query += ' AND ic.Type = ?';
      params.push(parseInt(item_type));
    }

    if (level) {
      query += ' AND (ic.Level IS NULL OR ic.Level <= ?)';
      params.push(parseInt(level));
    }

    if (sex) {
      query += ' AND (ic.Sex IS NULL OR ic.Sex = ? OR ic.Sex = 0)';
      params.push(parseInt(sex));
    }

    if (union) {
      query += ' AND (ic.Union IS NULL OR ic.Union = ? OR ic.Union = 0)';
      params.push(parseInt(union));
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const items = await db.prepare(query).bind(...params).all();

    return success(c, {
      items: items.results || [],
      page: pageNum,
      pageSize,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UseItemRes - POST /item/use-resource
app.post('/use-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!city_id || !item_id) return error(c, 'Missing parameters');
    
    // 使用资源类物品
    const item: any = await db.prepare(`
      SELECT i.*, ic.* FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND i.config_id = ?
    `).bind(walletAddress, item_id).first();
    
    if (!item || item.count < 1) return error(c, 'Item not found or insufficient');
    
    // 扣除物品
    await db.prepare(`UPDATE items SET count = count - 1 WHERE wallet_address = ? AND config_id = ?`)
      .bind(walletAddress, item_id).run();
    
    // 增加资源 (根据物品效果类型)
    const effectValue = item.EffectValue || 100;
    if (item.EffectType === 4) { // 资源类
      await db.prepare(`UPDATE cities SET food = food + ? WHERE id = ?`)
        .bind(effectValue, city_id).run();
    }
    
    return success(c, { message: 'Resource item used', value: effectValue });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ========== POST /item/market/sell - 道具上架（对应 C# SellItem）============
app.post('/market/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, price } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!item_id) return error(c, 'Missing item_id');

    // ========== 价格校验 ==========
    // 对应 C#: if (price <= 0 || price > 999999999) return 101;
    if (!price || price <= 0 || price > 999999999) {
      return c.json(101); // 价格无效
    }

    // ========== 获取道具信息（需包含完整字段用于校验）============
    const item: any = await db.prepare(`
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type,
             ic.SellFlag, ic.Attack, ic.CR, ic.DR, ic.Defence, ic.FR, ic.LR,
             ic.HitPoint, ic.Level, ic.Quality, ic.GetFood, ic.GetMen, ic.GetMoney,
             ic.GetGold, ic.UseGold, ic.UseLevel, ic.UseSex, ic.UseType, ic.UseUnion,
             ic.SkillType, ic.NeedUserLevel, ic.GetValue, ic.LostRate, ic.GetItemStatic,
             ic.EquipSlot
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return c.json(102); // 指定道具不存在
    }

    // ========== HeroID 校验 - 装备在英雄身上的道具不能上架 ==========
    // 对应 C#: if (itemSingle.HeroID != 0) return 103;
    if (item.hero_id && item.hero_id !== 0) {
      return c.json(103); // 指定道具有英雄所属
    }

    // ========== CorpsID 校验 - 运输中的道具不能上架 ==========
    // 对应 C#: if (itemSingle.CorpsID != 0) return 104;
    if (item.corps_id && item.corps_id !== 0) {
      return c.json(104); // 指定道具在运输途中
    }

    // ========== SellFlag 校验 - 不可出售的道具不能上架 ==========
    // 对应 C#: if (XmlData.Item[itemSingle.StaticIndex].SellFlag == 1) return 30117;
    if (item.SellFlag === 1) {
      return c.json(30117); // 道具为不可出售状态
    }

    // ========== State 校验 - 装备在外英雄身上的道具不能上架 ==========
    // 对应 C#: FullItemState → if (heroSingle.CorpsID != 0) itemSingle.State = 5;
    //         if (itemSingle.State == 5) return 30048;
    if (item.state === 5) {
      return c.json(30048); // 道具在在外英雄身上，不能上架
    }

    // ========== 检查是否已在市场上架 ==========
    const existingListing: any = await db.prepare(`
      SELECT * FROM market_listings WHERE item_id = ? AND state = 4
    `).bind(item_id).first();
    if (existingListing) {
      return c.json(101); // 道具已在市场上架
    }

    // ========== 上架道具到市场 ==========
    const sellTime = new Date().toISOString();
    await db.prepare(`
      INSERT INTO market_listings (item_id, seller_address, price, state, created_at)
      VALUES (?, ?, ?, 4, ?)
    `).bind(item_id, walletAddress, price, sellTime).run();

    return c.json(0); // 成功
  } catch (err: any) {
    console.error('[market/sell]', err);
    return error(c, err.message);
  }
});

// ========== POST /item/market/buy - 从市场购买道具（对应 C# BuyItem）============
app.post('/market/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, price } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!item_id) return error(c, 'Missing item_id');

    // ========== 价格校验 ==========
    // 对应 C#: if (price <= 0) return 30156;
    if (!price || price <= 0) {
      return c.json(30156); // 无效价格
    }

    // ========== 获取市场挂单信息（State=4 表示上架中）============
    const listing: any = await db.prepare(`
      SELECT ml.*, ic.Name as item_name, ic.Type as item_type,
             ic.SellFlag, i.HeroID as item_hero_id, i.State as item_state
      FROM market_listings ml
      LEFT JOIN items i ON i.id = ml.item_id
      LEFT JOIN items_config ic ON ml.config_id = ic.ID
      WHERE ml.item_id = ? AND ml.state = 4
    `).bind(item_id).first();

    if (!listing) {
      return c.json(102); // 指定道具不存在
    }

    const sellerAddress = listing.seller_address;

    // ========== 自己买自己校验 ==========
    // 对应 C#: if (itemSingle.UserName == userName) return 30169;
    if (sellerAddress === walletAddress) {
      return c.json(30169); // 不能自己和自己交易道具
    }

    // ========== price 校验 ==========
    // 对应 C#: if (price != itemSingle.Price) return 30157;
    if (price !== listing.price) {
      return c.json(30157); // 道具价格与显示价格不符，不能交易
    }

    // ========== SellFlag 校验 ==========
    // 对应 C#: if (itemSingle.SellFlag == 1) return 30117;
    if (listing.SellFlag === 1) {
      return c.json(30117); // 道具为不可出售状态
    }

    // ========== 状态校验 ==========
    // 对应 C#: if (itemSingle.State != 4) ...
    if (listing.item_state !== 4) {
      return c.json(30117); // 道具状态异常，不能交易
    }

    // ========== 装备状态校验 ==========
    if (listing.item_hero_id && listing.item_hero_id !== 0) {
      return c.json(30117); // 道具已装备，不能交易
    }

    // ========== 获取买卖双方元宝 ==========
    const [buyer, seller] = await Promise.all([
      db.prepare(`SELECT gold FROM characters WHERE wallet_address = ?`).bind(walletAddress).first(),
      db.prepare(`SELECT gold FROM characters WHERE wallet_address = ?`).bind(sellerAddress).first(),
    ]);

    // ========== 买方元宝校验 ==========
    if (!buyer || buyer.gold < price) {
      return c.json(30055); // 元宝不足
    }

    // ========== 检查买方物品数量是否已达上限 ==========
    // 复用 shop.ts 的 getMaxItemCount 和 getCurrentItemCount
    // 注意：动态 import 可能导致问题，这里直接内联简单实现
    const maxCountResult: any = await db.prepare(`
      SELECT technic_level FROM technics WHERE wallet_address = ? AND city_id = ? AND static_index = 13
    `).bind(walletAddress, city_id).first();
    const tech13Level = maxCountResult?.technic_level || 0;
    let maxCount = tech13Level > 0 ? 100 : 50; // 简化：科技13>0则上限100，否则50
    const currentCountResult: any = await db.prepare(`
      SELECT SUM(count) as total FROM items WHERE wallet_address = ?
    `).bind(walletAddress).first();
    const currentCount = currentCountResult?.total || 0;
    if (currentCount >= maxCount) {
      return c.json(30055); // 物品数量已达上限
    }

    // ========== 执行交易 ==========
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

    return c.json(0); // 成功
  } catch (err: any) {
    console.error('[market/buy]', err);
    return error(c, err.message);
  }
});

// ========== POST /item/market/cancel-sell - 道具下架（对应 C# CancelSellItem）============
app.post('/market/cancel-sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!item_id) return error(c, 'Missing item_id');

    // ========== 获取道具信息 ==========
    // 对应 C#: ItemInfo itemSingle = GetItemByID(itemID);
    const item: any = await db.prepare(`
      SELECT i.*, ic.ID as ic_id
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ?
    `).bind(item_id).first();

    if (!item) {
      return c.json(-1); // 道具不存在
    }

    // ========== 所有权校验 ==========
    // 对应 C#: if (itemSingle.UserName != userName || itemSingle.CityID != cityID) return -1;
    if (item.wallet_address !== walletAddress) {
      return c.json(-1); // 无权操作此道具
    }

    // ========== 检查市场挂单是否存在 ==========
    const listing: any = await db.prepare(`
      SELECT * FROM market_listings WHERE item_id = ? AND state = 4
    `).bind(item_id).first();

    if (!listing) {
      return c.json(-1); // 未找到上架记录
    }

    // ========== 下架道具（state=1 正常状态）============
    // 对应 C#: ItemAccess.UpdateItemState(userName, cityID, itemID, 0, 1, time)
    await db.prepare(`
      UPDATE market_listings SET state = 1 WHERE item_id = ? AND state = 4
    `).bind(item_id).run();

    // 道具状态恢复为正常 (State=1)，无需修改 items 表（所有权未变）
    return c.json(0); // 成功
  } catch (err: any) {
    console.error('[market/cancel-sell]', err);
    return error(c, err.message);
  }
});

// CancleSellItem - POST /item/cancel-sell (兼容旧端点)
app.post('/cancel-sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!item_id) return error(c, 'Missing item_id');

    // ========== 获取道具信息 ==========
    const item: any = await db.prepare(`
      SELECT i.*, ic.ID as ic_id
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ?
    `).bind(item_id).first();

    if (!item) {
      return c.json(-1);
    }

    // ========== 所有权校验 ==========
    if (item.wallet_address !== walletAddress) {
      return c.json(-1);
    }

    // ========== 检查市场挂单是否存在 ==========
    const listing: any = await db.prepare(`
      SELECT * FROM market_listings WHERE item_id = ? AND state = 4
    `).bind(item_id).first();

    if (!listing) {
      return c.json(-1);
    }

    // ========== 下架道具 ==========
    await db.prepare(`
      UPDATE market_listings SET state = 1 WHERE item_id = ? AND state = 4
    `).bind(item_id).run();

    return c.json(0);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UserBattleItem - POST /item/battle-use
app.post('/battle-use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { pos, cityID, player, objID, targetID, itemBattleID, targetX, targetY } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 在战斗中使用物品
    const item: any = await db.prepare(`
      SELECT i.*, ic.Type, ic.Effect, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(itemBattleID, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在');
    }

    if (item.Type !== 'battle') {
      return error(c, '该物品不能在战斗中使用');
    }

    // 减少物品数量
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(itemBattleID).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(itemBattleID).run();
    }

    return success(c, {
      effect: item.Effect,
      value: item.EffectValue,
      target: { x: targetX, y: targetY },
      message: '使用成功'
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// equipItemForAttackList - POST /item/equip-attack-list
app.post('/equip-attack-list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_list } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 为攻击队伍装备物品列表
    // item_list 格式: [{hero_id, item_id}, ...]
    const results = [];
    
    for (const { hero_id, item_id } of item_list) {
      // 检查物品是否存在且未装备
      const item: any = await db.prepare(`
        SELECT * FROM items WHERE id = ? AND wallet_address = ? AND equipped = 0
      `).bind(item_id, walletAddress).first();

      if (!item) continue;

      // 装备物品
      await db.prepare(`
        UPDATE items SET equipped = 1, hero_id = ? WHERE id = ?
      `).bind(hero_id, item_id).run();

      results.push({ hero_id, item_id, success: true });
    }

    return success(c, { equipped: results });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// equipItemForDefListT - POST /item/equip-def-list
app.post('/equip-def-list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_list } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 为防守队伍装备物品列表
    const results = [];
    
    for (const { hero_id, item_id } of item_list) {
      const item: any = await db.prepare(`
        SELECT * FROM items WHERE id = ? AND wallet_address = ? AND equipped = 0
      `).bind(item_id, walletAddress).first();

      if (!item) continue;

      await db.prepare(`
        UPDATE items SET equipped = 1, hero_id = ?, battle_type = 'defense' WHERE id = ?
      `).bind(hero_id, item_id).run();

      results.push({ hero_id, item_id, success: true });
    }

    return success(c, { equipped: results });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// takeOffBattleItem - POST /item/takeoff-battle
app.post('/takeoff-battle', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 卸下战斗物品
    const item: any = await db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ? AND equipped = 1
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或未装备');
    }

    await db.prepare(`
      UPDATE items SET equipped = 0, hero_id = NULL, battle_type = NULL WHERE id = ?
    `).bind(item_id).run();

    return success(c, { message: '卸下成功' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetItemByHero - GET /item/hero/:heroId
// C#: GetItemByHero(int heroID) - 获得指定侠客装备的道具
app.get('/hero/:heroId', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const heroId = parseInt(c.req.param('heroId'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const items = await db.prepare(`
      SELECT i.*, ic.ID as ic_id, ic.Name as item_name, ic.Type as item_type, ic.Des as description,
             ic.Icon as icon, ic.Price as SellMoney, ic.EffectType, ic.EffectValue,
             ic.Attack, ic.CR, ic.DR, ic.Defence, ic.FR, ic.LR, ic.HitPoint,
             ic.Level, ic.Quality, ic.GetFood, ic.GetMen, ic.GetMoney, ic.GetGold,
             ic.UseGold, ic.UseLevel, ic.UseSex, ic.UseType, ic.UseUnion,
             ic.SkillType, ic.NeedUserLevel, ic.GetValue, ic.SellFlag,
             ic.EquipSlot
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND i.hero_id = ?
      ORDER BY i.id DESC
    `).bind(walletAddress, heroId).all();

    const itemList = (items.results || []).map((item: any) => ({
      ID: item.id,
      StaticIndex: item.config_id,
      UserName: walletAddress,
      CityID: 1,
      HeroID: item.hero_id || 0,
      CorpsID: item.corps_id || 0,
      ItemName: item.item_name || '物品',
      ItemType: item.item_type || 1,
      State: item.equipped ? 3 : 1,  // 3=装备属性
      Price: item.SellMoney || 0,
      Durability: item.durability || 100,
      SellDate: item.created_at,
      UseGetExp: 0,
      HitPoint: item.HitPoint || 0,
      ItemLevel: 1,
      Attack: item.Attack || 0,
      CR: item.CR || 0,
      DR: item.DR || 0,
      Defence: item.Defence || 0,
      FR: item.FR || 0,
      LR: item.LR || 0,
      Name: item.item_name || '物品',
      Image: item.icon || '/items/default.gif',
      Level: item.Level || 1,
      UseLevel: item.UseLevel || 1,
      UseSex: item.UseSex || 0,
      UseUnion: item.UseUnion || 0,
      UseType: item.UseType || 1,
      UseGold: item.UseGold || 0,
      SellFlag: item.SellFlag || 0,
      GetMen: item.GetMen || 0,
      Quality: item.Quality || 1,
      Des: item.description || '',
      Icon: item.icon || item.image || '/items/default.gif',
    }));

    return success(c, itemList);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetConvokeItem - GET /item/convoke
app.get('/convoke', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取召唤类物品 (如武将召唤卷轴)
    const items = await db.prepare(`
      SELECT i.*, ic.Name, ic.Icon, ic.Des
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND ic.Type = 'convoke'
      ORDER BY i.created_at DESC
    `).bind(walletAddress).all();

    return success(c, { items: items.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetGrangerItem - GET /item/granger
app.get('/granger', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取粮仓类物品 (资源类物品)
    const items = await db.prepare(`
      SELECT i.*, ic.Name, ic.Icon, ic.Des, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND ic.Type IN ('resource', 'food')
      ORDER BY i.created_at DESC
    `).bind(walletAddress).all();

    return success(c, { items: items.results || [] });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// TakeItem - POST /item/equip
app.post('/equip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 装备物品到武将
    const item: any = await db.prepare(`
      SELECT i.*, ic.Type, ic.EquipSlot
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND i.equipped = 0
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或已装备');
    }

    // 检查武将是否存在
    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    // 如果该装备槽已有装备,先卸下
    if (item.EquipSlot) {
      await db.prepare(`
        UPDATE items SET equipped = 0, hero_id = NULL 
        WHERE hero_id = ? AND equipped = 1 
        AND config_id IN (SELECT ID FROM items_config WHERE EquipSlot = ?)
      `).bind(hero_id, item.EquipSlot).run();
    }

    // 装备新物品
    await db.prepare(`
      UPDATE items SET equipped = 1, hero_id = ? WHERE id = ?
    `).bind(hero_id, item_id).run();

    return success(c, { message: '装备成功' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DebusItem - POST /item/unequip
app.post('/unequip', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 卸下装备
    const item: any = await db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ? AND equipped = 1
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或未装备');
    }

    await db.prepare(`
      UPDATE items SET equipped = 0, hero_id = NULL WHERE id = ?
    `).bind(item_id).run();

    return success(c, { message: '卸下成功' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// RepairItem - POST /item/repair
app.post('/repair', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 修理装备 (恢复耐久度)
    const item: any = await db.prepare(`
      SELECT i.*, ic.RepairCost
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在');
    }

    const repairCost = item.RepairCost || 100;

    // 检查金币是否足够
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (city.gold < repairCost) {
      return error(c, '金币不足');
    }

    // 扣除金币,恢复耐久
    await db.prepare(`
      UPDATE cities SET gold = gold - ? WHERE wallet_address = ?
    `).bind(repairCost, walletAddress).run();

    await db.prepare(`
      UPDATE items SET durability = 100 WHERE id = ?
    `).bind(item_id).run();

    return success(c, { 
      cost: repairCost,
      message: '修理成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// RepairItemGeneral - POST /item/repair-general
app.post('/repair-general', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 通用修理 (使用修理工具修理)
    const item: any = await db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在');
    }

    // 检查是否有修理工具 (Type = 5 对应 RESOURCE)
    const repairTool: any = await db.prepare(`
      SELECT * FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND ic.Type = 5
      LIMIT 1
    `).bind(walletAddress).first();

    if (!repairTool) {
      return error(c, '没有修理工具');
    }

    // 消耗修理工具
    if (repairTool.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(repairTool.id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(repairTool.id).run();
    }

    // 恢复耐久
    await db.prepare(`
      UPDATE items SET durability = 100 WHERE id = ?
    `).bind(item_id).run();

    return success(c, { message: '修理成功' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DonateItem - POST /item/donate
app.post('/donate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, guild_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 捐献物品给帮会
    const item: any = await db.prepare(`
      SELECT i.*, ic.Value
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在');
    }

    // 检查是否加入帮会
    const member: any = await db.prepare(`
      SELECT * FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return error(c, '未加入帮会');
    }

    // 删除物品
    await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();

    // 增加帮会贡献度
    const contribution = Math.floor((item.Value || 100) * 0.5);
    await db.prepare(`
      UPDATE guild_members 
      SET contribution = contribution + ? 
      WHERE wallet_address = ?
    `).bind(contribution, walletAddress).run();

    return success(c, { 
      contribution,
      message: '捐献成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UseItemHeroExp - POST /item/use-hero-exp
app.post('/use-hero-exp', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, hero_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 使用经验道具给武将增加经验
    const item: any = await db.prepare(`
      SELECT i.*, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND ic.Type = 'hero_exp'
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或类型错误');
    }

    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    const expGain = item.EffectValue || 1000;

    // 增加武将经验
    await db.prepare(`
      UPDATE heroes SET exp = exp + ? WHERE id = ?
    `).bind(expGain, hero_id).run();

    // 消耗物品
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    return success(c, { 
      exp_gain: expGain,
      message: '使用成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UseItemInsignia - POST /item/use-insignia
app.post('/use-insignia', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 使用战勋道具 (增加战勋值)
    const item: any = await db.prepare(`
      SELECT i.*, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND ic.Type = 'insignia'
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或类型错误');
    }

    const insigniaGain = item.EffectValue || 100;

    // 增加用户战勋
    await db.prepare(`
      UPDATE users SET insignia = insignia + ? WHERE wallet_address = ?
    `).bind(insigniaGain, walletAddress).run();

    // 消耗物品
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    return success(c, { 
      insignia_gain: insigniaGain,
      message: '使用成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UserItemChangeSkill - POST /item/change-skill
app.post('/change-skill', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, item_id, new_skill_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 使用技能变更道具改变武将技能
    const item: any = await db.prepare(`
      SELECT i.*, ic.Type
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND ic.Type = 'skill_change'
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或类型错误');
    }

    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    // 更新武将技能
    await db.prepare(`
      UPDATE heroes SET skill_id = ? WHERE id = ?
    `).bind(new_skill_id || 1, hero_id).run();

    // 消耗物品
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    return success(c, { message: '技能变更成功' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UserItemUpSkill - POST /item/upgrade-skill
app.post('/upgrade-skill', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 使用技能升级道具提升武将技能等级
    const item: any = await db.prepare(`
      SELECT i.*, ic.Type
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND ic.Type = 'skill_upgrade'
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或类型错误');
    }

    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    const currentSkillLevel = hero.skill_level || 1;
    if (currentSkillLevel >= 10) {
      return error(c, '技能已达最高等级');
    }

    // 提升技能等级
    await db.prepare(`
      UPDATE heroes SET skill_level = skill_level + 1 WHERE id = ?
    `).bind(hero_id).run();

    // 消耗物品
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    return success(c, { 
      new_level: currentSkillLevel + 1,
      message: '技能升级成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UserItemSkillEXP - POST /item/skill-exp
app.post('/skill-exp', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 使用技能经验道具增加武将技能经验
    const item: any = await db.prepare(`
      SELECT i.*, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND ic.Type = 'skill_exp'
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或类型错误');
    }

    const hero: any = await db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(hero_id, walletAddress).first();

    if (!hero) {
      return error(c, '武将不存在');
    }

    const skillExpGain = item.EffectValue || 500;

    // 增加技能经验
    await db.prepare(`
      UPDATE heroes SET skill_exp = skill_exp + ? WHERE id = ?
    `).bind(skillExpGain, hero_id).run();

    // 消耗物品
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    return success(c, { 
      skill_exp_gain: skillExpGain,
      message: '使用成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UseFeastItem - POST /item/use-feast
app.post('/use-feast', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 使用节日礼包 (随机奖励)
    const item: any = await db.prepare(`
      SELECT i.*, ic.Type, ic.EffectValue
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ? AND ic.Type = 'feast'
    `).bind(item_id, walletAddress).first();

    if (!item) {
      return error(c, '物品不存在或类型错误');
    }

    // 随机奖励 (简化版)
    const rewards = [];
    const goldReward = Math.floor(Math.random() * 1000) + 500;
    const expReward = Math.floor(Math.random() * 500) + 200;

    // 增加金币和经验
    await db.prepare(`
      UPDATE cities SET gold = gold + ? WHERE wallet_address = ?
    `).bind(goldReward, walletAddress).run();

    rewards.push({ type: 'gold', amount: goldReward });
    rewards.push({ type: 'exp', amount: expReward });

    // 消耗物品
    if (item.count > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ?
      `).bind(item_id).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    return success(c, { 
      rewards,
      message: '使用成功' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetItemName - GET /item/name
app.get('/name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取物品名称
    const item: any = await db.prepare(`
      SELECT i.id, ic.Name, ic.Type, ic.Icon
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ?
    `).bind(item_id).first();

    if (!item) {
      return error(c, '物品不存在');
    }

    return success(c, { 
      id: item.id,
      name: item.Name,
      type: item.Type,
      quality: item.Quality,
      icon: item.Icon
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
