/**
 * 市场路由 - 完整版
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import commodityConfigs from '../config/commodities.json';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 获取市场配置
app.get('/configs', async (c) => {
  const items = ((commodityConfigs as any).Commodity || []).map((item: any) => ({
    id: item.Id,
    type: item.Type,
    typeName: item.TypeName,
    name: item.TypeName,
    buyPrice: item.Gold || item.BuyPrice,
    sellPrice: item.Gold ? Math.floor(item.Gold * 0.8) : null,
    unit: '个',
    description: item.Tips || '',
    icon: item.Image || item.Icon,
  }));

  return success(c, {
    items,
    total: items.length,
  });
});

// 获取市场物品
app.get('/', async (c) => {
  const items = ((commodityConfigs as any).Commodity || []).map((item: any) => ({
    id: item.Id,
    type: item.Type,
    typeName: item.TypeName,
    name: item.TypeName,
    price: item.Gold || item.BuyPrice,
    sellPrice: item.Gold ? Math.floor(item.Gold * 0.8) : null,
    unit: '个',
    icon: item.Image || item.Icon,
    tips: item.Tips,
  }));

  return success(c, {
    items,
    total: items.length,
  });
});

// 购买
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取商品配置
    const commodity = ((commodityConfigs as any).Commodity || commodityConfigs.Commodity || Object.values(commodityConfigs)).find(
      (item: any) => (item.ID || item.id) === parseInt(item_id) || item.Name === item_id
    );

    if (!commodity) return error(c, 'Item not found in market');

    const buyPrice = (commodity.BuyPrice || commodity.buyPrice || commodity.Price || commodity.price) * count;

    // 获取玩家金钱
    const char: any = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!char || char.gold < buyPrice) {
      return error(c, `Not enough gold. Need ${buyPrice}, have ${char?.gold || 0}`);
    }

    // 扣除金钱并添加物品
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(buyPrice, walletAddress).run();

    await db.prepare(`
      INSERT INTO items (wallet_address, config_id, count, type, source)
      VALUES (?, ?, ?, 'consumable', 'market')
      ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + ?
    `).bind(walletAddress, item_id, count, count).run();

    return success(c, {
      itemId: item_id,
      name: commodity.Name || commodity.name,
      count,
      price: buyPrice,
      message: `购买了 ${count} 个 ${commodity.Name || commodity.name}`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 出售
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_id, count = 1 } = await c.req.json();
  if (!item_id) return error(c, 'Missing item_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取商品配置
    const commodity = ((commodityConfigs as any).Commodity || commodityConfigs.Commodity || Object.values(commodityConfigs)).find(
      (item: any) => (item.ID || item.id) === parseInt(item_id) || item.Name === item_id
    );

    if (!commodity) return error(c, 'Item not found in market');

    const sellPrice = (commodity.SellPrice || commodity.sellPrice || (commodity.BuyPrice || commodity.buyPrice || commodity.Price || commodity.price) * 0.8) * count;

    // 检查物品
    const inv: any = await db.prepare(`
      SELECT * FROM items WHERE wallet_address = ? AND config_id = ?
    `).bind(walletAddress, item_id).first();

    if (!inv || inv.count < count) {
      return error(c, `Not enough items. Have ${inv?.count || 0}, want ${count}`);
    }

    // 扣除物品并增加金钱
    await db.prepare(`
      UPDATE items SET count = count - ? WHERE wallet_address = ? AND config_id = ?
    `).bind(count, walletAddress, item_id).run();

    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(sellPrice, walletAddress).run();

    return success(c, {
      itemId: item_id,
      name: commodity.Name || commodity.name,
      count,
      sellPrice,
      message: `出售了 ${count} 个 ${commodity.Name || commodity.name}，获得 ${sellPrice} 金币`,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取市场价格历史 (模拟)
app.get('/history/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  
  // 模拟价格波动
  const basePrice = 100;
  const history = [];
  for (let i = 0; i < 24; i++) {
    const fluctuation = 0.9 + Math.random() * 0.2;
    history.push({
      time: new Date(Date.now() - i * 3600000).toISOString(),
      price: Math.floor(basePrice * fluctuation),
    });
  }

  return success(c, {
    itemId,
    history: history.reverse(),
  });
});

export default app;
