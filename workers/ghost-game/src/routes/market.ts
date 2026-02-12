/**
 * Market Routes - 市场接口
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
  return success(c, { message: 'Market API ready' });
});

app.post('/', async (c) => {
  return success(c, { message: 'Market API ready' });
});

// GetMarketInfo - GET /market/info
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      marketStatus: 'open',
      taxRate: 0.05,
      maxListings: 50,
      currentListings: 23,
      transactionFee: 0.02,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemByType - GET /market/items
app.get('/items', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type, page } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const pageNum = parseInt(page || '1');
    return success(c, {
      items: generateMockMarketItems(item_type, pageNum),
      total: 100,
      page: pageNum,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemNum - GET /market/count
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      totalItems: 223,
      myListings: 3,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// BuyItem - POST /market/buy
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { itemID, price } = await c.req.json();

  if (!itemID || !price) {
    return error(c, 'itemID and price are required');
  }

  try {
    // 简化：扣除金币并添加物品
    await db.prepare(`UPDATE users SET gold = gold - ? WHERE wallet_address = ?`)
      .bind(price, walletAddress).run();

    await db.prepare(`INSERT INTO user_items (wallet_address, item_id, amount) VALUES (?, ?, 1)`)
      .bind(walletAddress, itemID).run();

    return success(c, { success: true, itemId: itemID, spent: price });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemNumByItemName - GET /market/count-by-name
app.get('/count-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_name } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      count: Math.floor(Math.random() * 20) + 1,
      searchTerm: item_name || '',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemByItemName - GET /market/items-by-name
app.get('/items-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_name, page } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    return success(c, {
      items: generateMockMarketItems(item_name, parseInt(page || '1')),
      searchTerm: item_name || '',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

function generateMockMarketItems(itemType: string | undefined, page: number) {
  const items = [];
  const itemTypes = ['武器', '防具', '消耗品', '材料', '技能书'];
  const qualities = ['普通', '优良', '稀有', '史诗', '传说'];

  for (let i = 0; i < 10; i++) {
    items.push({
      id: page * 100 + i,
      name: `${qualities[i % 5]}${itemTypes[i % 5]}`,
      type: i % 5 + 1,
      price: Math.floor(Math.random() * 10000) + 100,
      amount: Math.floor(Math.random() * 10) + 1,
      seller: '玩家' + String.fromCharCode(65 + i),
    });
  }
  return items;
}

export default app;
