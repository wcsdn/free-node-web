/**
 * Shop Routes - 商城接口
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}
function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

app.get('/', async (c) => {
  return success(c, { message: 'Shop API ready' });
});

// Shop list - GET /shop/list (alias for /info)
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    isOpen: true,
    refreshTime: '00:00',
    vipOnSale: true,
    limitedItems: generateLimitedItems(),
  });
});

// GetMallInfo - GET /shop/info
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    isOpen: true,
    refreshTime: '00:00',
    vipOnSale: true,
    limitedItems: generateLimitedItems(),
    categories: [
      { id: 1, name: '资源', items: 12 },
      { id: 2, name: '道具', items: 28 },
      { id: 3, name: 'VIP', items: 4 },
      { id: 4, name: '礼包', items: 8 },
    ],
  });
});

// BuyItemFromCommodity - POST /shop/buy
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 支持 itemID/item_id/config_id 双格式
  const { itemId, itemID, config_id, amount, price, currency } = await c.req.json();
  const finalItemId = itemId || itemID || config_id;
  const finalAmount = amount || 1;

  if (!finalItemId || !price) {
    return error(c, 'itemId and price are required');
  }

  try {
    // 根据货币类型扣除相应资源
    if (currency === 'gold') {
      await db.prepare(`UPDATE characters SET gold = gold - ? WHERE wallet_address = ?`)
        .bind(price * finalAmount, walletAddress).run();
    } else if (currency === 'money') {
      await db.prepare(`UPDATE characters SET money = money - ? WHERE wallet_address = ?`)
        .bind(price * finalAmount, walletAddress).run();
    }

    // 添加物品 (使用 config_id 列)
    await db.prepare(`INSERT INTO items (wallet_address, config_id, count) VALUES (?, ?, ?)`)
      .bind(walletAddress, finalItemId, finalAmount).run();

    return success(c, {
      success: true,
      finalItemId,
      amount: finalAmount,
      spent: price * finalAmount,
      currency,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetVipSevenDays - GET /shop/vip-7
app.get('/vip-7', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    itemId: 1001,
    name: 'VIP周卡',
    description: '7天内每日领取100元宝',
    price: 300,
    benefits: ['每日100元宝', '专属礼包', 'VIP标识'],
    discount: 0.8,
  });
});

// GetVipThirtyDays - GET /shop/vip-30
app.get('/vip-30', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    itemId: 1002,
    name: 'VIP月卡',
    description: '30天内每日领取500元宝',
    price: 1000,
    benefits: ['每日500元宝', '专属礼包', 'VIP标识', '专属副本'],
    discount: 0.75,
  });
});

// GetPeaceEightHours - GET /shop/peace-8h
app.get('/peace-8h', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    itemId: 2001,
    name: '8小时免战牌',
    description: '8小时内不会被攻击',
    price: 200,
    duration: 8 * 60 * 60 * 1000, // 毫秒
  });
});

// GetPeaceTwoDays - GET /shop/peace-2d
app.get('/peace-2d', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    itemId: 2002,
    name: '2天免战牌',
    description: '2天内不会被攻击',
    price: 500,
    duration: 2 * 24 * 60 * 60 * 1000,
  });
});

// GetPeaceSevenDays - GET /shop/peace-7d
app.get('/peace-7d', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    itemId: 2003,
    name: '7天免战牌',
    description: '7天内不会被攻击',
    price: 1500,
    duration: 7 * 24 * 60 * 60 * 1000,
  });
});

// ResToGoldRateOfExchange - GET /shop/exchange-rate
app.get('/exchange-rate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  return success(c, {
    moneyToGold: 100, // 100铜钱 = 1元宝
    foodToGold: 100,   // 100粮食 = 1元宝
    goldToMoney: 1,    // 1元宝 = 100铜钱
    goldToFood: 1,     // 1元宝 = 100粮食
    maxExchange: {
      money: 100000,
      food: 100000,
    },
  });
});

// GetCommoditysByType - GET /shop/items
app.get('/items', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { type, page } = c.req.query();

  return success(c, {
    items: generateShopItems(type),
    total: 50,
    page: parseInt(page || '1'),
  });
});

// UpdatePersistEffectByType - POST /shop/use-effect
app.post('/use-effect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { effectType, duration } = await c.req.json();

  return success(c, {
    success: true,
    effectType,
    duration,
    expiresAt: Date.now() + (duration || 3600000),
  });
});

// GoldBuyRes - POST /shop/exchange
app.post('/exchange', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { fromResource, toResource, amount } = await c.req.json();

  if (!fromResource || !toResource || !amount) {
    return error(c, 'fromResource, toResource, and amount are required');
  }

  try {
    if (fromResource === 'gold' && toResource === 'money') {
      await db.prepare(`UPDATE characters SET gold = gold - ?, money = money + ? WHERE wallet_address = ?`)
        .bind(amount, amount * 100, walletAddress).run();
    } else if (fromResource === 'money' && toResource === 'gold') {
      await db.prepare(`UPDATE characters SET money = money - ?, gold = gold + ? WHERE wallet_address = ?`)
        .bind(amount, Math.floor(amount / 100), walletAddress).run();
    }

    return success(c, {
      success: true,
      fromResource,
      toResource,
      amount,
      exchanged: amount * 100,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

function generateLimitedItems() {
  return [
    { id: 1, name: '稀有武将包', stock: 5, limit: 10, price: 500 },
    { id: 2, name: '传说武器', stock: 2, limit: 5, price: 2000 },
    { id: 3, name: '高级技能书', stock: 8, limit: 20, price: 300 },
  ];
}

function generateShopItems(type: string | undefined) {
  const items = [];
  const categories = ['资源', '道具', 'VIP', '礼包'];

  for (let i = 0; i < 10; i++) {
    items.push({
      id: parseInt(type || '1') * 100 + i,
      name: `${categories[parseInt(type || '1') % 4]}道具${i + 1}`,
      price: Math.floor(Math.random() * 500) + 50,
      currency: i % 3 === 0 ? 'gold' : 'money',
      description: '商城道具描述',
    });
  }
  return items;
}

export default app;
