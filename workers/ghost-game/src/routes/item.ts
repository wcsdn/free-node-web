/**
 * 物品路由 - 完整版
 * 支持：背包管理、物品使用、合成、分解、强化
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import itemConfigs from '../config/items.json';
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
      SELECT i.*, ic.Name as item_name, ic.Type as item_type, ic.Des as description, ic.Icon as icon
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

    // 格式化为C# DBItem字段
    const formattedItems = (items.results || []).map((item: any) => ({
      ItemID: item.id,
      StaticIndex: item.config_id,
      UserName: item.wallet_address,
      CityID: 1,
      HeroID: item.hero_id || 0,
      CorpsID: 0,
      ItemName: item.item_name || '物品',
      ItemType: item.type || 1,
      State: item.equipped ? 1 : 0,
      Price: 0,
      Durability: item.durability || 100,
      SellDate: item.created_at,
      UseGetExp: 0,
      HitPoint: 0,
      ItemLevel: 1,
    }));

    return success(c, {
      items: formattedItems,
      total: items.results?.length || 0,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取背包 (alias for /list)
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { type } = c.req.query();

  try {
    let query = `
      SELECT i.*, ic.Name as item_name, ic.Type as item_type, ic.Des as description, ic.Icon as icon
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ?
    `;
    const params: any[] = [walletAddress];

    if (type) {
      query += ' AND ic.Type = ?';
      params.push(parseInt(type));
    }

    query += ' ORDER BY i.created_at DESC';

    const items = await db.prepare(query).bind(...params).all();

    // 按类型分组
    const grouped: Record<string, any[]> = {};
    for (const item of (items.results || [])) {
      const typeName = (item as any).item_type || 'unknown';
      if (!grouped[typeName]) grouped[typeName] = [];
      grouped[typeName].push(item);
    }

    // 统计
    const stats = {
      total: (items.results || []).length,
      byType: Object.keys(grouped).length,
      totalValue: (items.results || []).reduce((sum: number, item: any) => {
        return sum + (item.count || 1) * ((item as any).price || 0);
      }, 0),
    };

    return success(c, { 
      items: items.results || [],
      grouped,
      stats,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取单个物品详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const itemId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const item: any = await db.prepare(`
      SELECT i.*, ic.* 
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(itemId, walletAddress).first();

    if (!item) return error(c, 'Item not found', 404);

    return success(c, item);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 使用物品
app.post('/use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, itemID } = await c.req.json();
  if (!itemID) return error(c, 'Missing itemID');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const inv: any = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, itemID).first();

    if (!inv || (inv.count || 1) < 1) {
      return error(c, 'Not enough items');
    }

    const itemConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === parseInt(itemID));
    if (!itemConfig) return error(c, 'Item config not found');

    // 应用效果
    const effects: any = {};
    if (itemConfig.EffectType) {
      switch (itemConfig.EffectType) {
        case 1: // 恢复生命
          effects.hp_recovery = itemConfig.EffectValue;
          break;
        case 2: // 增加经验
          effects.exp = itemConfig.EffectValue;
          break;
        case 3: // 增加金币
          effects.gold = itemConfig.EffectValue;
          break;
        case 4: // 增加资源
          effects.resources = itemConfig.EffectValue;
          break;
        case 5: // 增加兵力
          effects.men = itemConfig.EffectValue;
          break;
      }
    }

    // 消耗物品
    await db.prepare(`
      UPDATE items SET count = count - 1 WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, itemID).run();

    // 如果有效果，发放
    if (effects.exp) {
      await db.prepare(`
        UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
      `).bind(effects.exp, walletAddress).run();
    }

    if (effects.gold) {
      await db.prepare(`
        UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
      `).bind(effects.gold, walletAddress).run();
    }

    if (effects.resources || effects.men) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();

      if (city) {
        await db.prepare(`
          UPDATE cities SET
            food = food + ?,
            population = population + ?
          WHERE id = ?
        `).bind(
          effects.resources || 0,
          effects.men || 0,
          city.id
        ).run();
      }
    }

    return success(c, {
      itemId: itemID,
      name: itemConfig.Name,
      count: 1,
      effects,
      message: `使用了 1 个 ${itemConfig.Name}`,
    });
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
app.post('/disassemble', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id, static_index } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const inv: any = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, item_id).first();

    if (!inv || (inv.count || 1) < 1) {
      return error(c, 'Not enough items');
    }

    // 查找分解配方
    const recipe = (itemDisassemble as any).find((r: any) => r.FromItemID === parseInt(item_id));
    if (!recipe) {
      return error(c, 'Item cannot be disassembled');
    }

    // 扣除物品
    await db.prepare(`
      UPDATE items SET count = count - 1 WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, item_id).run();

    // 添加分解产物
    const rewards: any[] = [];
    if (recipe.ToItemID) {
      const rewardCount = recipe.ToItemNum || 1;
      
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, ?, 'disassemble')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + ?
      `).bind(walletAddress, recipe.ToItemID, rewardCount, rewardCount).run();

      const rewardConfig = (itemConfigs as any).Item?.find((i: any) => i.ID === recipe.ToItemID);
      rewards.push({
        id: recipe.ToItemID,
        name: rewardConfig?.Name || '材料',
        count: rewardCount,
      });
    }

    return success(c, {
      itemId: item_id,
      count: 1,
      rewards,
      message: `分解 1 个物品成功`,
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

// GetItemNum - GET /item/count
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let query = 'SELECT COUNT(*) as count, SUM(count) as total_items FROM items i LEFT JOIN items_config ic ON i.config_id = ic.ID WHERE i.wallet_address = ?';
    const params: any[] = [walletAddress];

    if (item_type) {
      query += ' AND ic.Type = ?';
      params.push(parseInt(item_type));
    }

    const result: any = await db.prepare(query).bind(...params).first();

    return success(c, {
      uniqueItems: result?.count || 0,
      totalItems: result?.total_items || 0,
      itemType: item_type ? parseInt(item_type) : null,
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

// CancleSellItem - POST /item/cancel-sell
app.post('/cancel-sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    if (!item_id) return error(c, 'Missing item_id');
    
    // 取消出售 - 从市场移除并返还物品
    const marketItem: any = await db.prepare(`
      SELECT * FROM market_items WHERE item_id = ? AND seller_address = ?
    `).bind(item_id, walletAddress).first();
    
    if (!marketItem) return error(c, 'Item not found in market');
    
    // 删除市场记录
    await db.prepare(`DELETE FROM market_items WHERE item_id = ? AND seller_address = ?`)
      .bind(item_id, walletAddress).run();
    
    // 返还物品到背包
    await db.prepare(`
      INSERT INTO items (wallet_address, config_id, count, source)
      VALUES (?, ?, 1, 'market_cancel')
      ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + 1
    `).bind(walletAddress, marketItem.config_id).run();
    
    return success(c, { message: 'Item removed from market and returned to inventory' });
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
      ORDER BY ic.Quality DESC, i.created_at DESC
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
      ORDER BY ic.Quality DESC, i.created_at DESC
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

    // 检查是否有修理工具
    const repairTool: any = await db.prepare(`
      SELECT * FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.wallet_address = ? AND ic.Type = 'repair_tool'
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
      SELECT i.id, ic.Name, ic.Type, ic.Quality, ic.Icon
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
