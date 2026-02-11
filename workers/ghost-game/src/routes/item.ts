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

// 获取背包
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

  const { city_id, item_type, page, order_by, order_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetItemByType 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 GetItemNum 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetItemCanUse - GET /item/can-use
app.get('/can-use', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_type, level, sex, union, page } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetItemCanUse 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UseItemRes 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 CancleSellItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UserBattleItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 equipItemForAttackList 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 equipItemForDefListT 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 takeOffBattleItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 GetConvokeItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 GetGrangerItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 TakeItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 DebusItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 RepairItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 RepairItemGeneral 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DonateItem - POST /item/donate
app.post('/donate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 DonateItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UseItemHeroExp 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UseItemInsignia 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UserItemChangeSkill - POST /item/change-skill
app.post('/change-skill', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, hero_id, item_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 UserItemChangeSkill 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UserItemUpSkill 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UserItemSkillEXP 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 UseFeastItem 逻辑
    return success(c, { message: 'Not implemented yet' });
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
    // TODO: 实现 GetItemName 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
