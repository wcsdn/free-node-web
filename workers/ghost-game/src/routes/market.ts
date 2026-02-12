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
  return success(c, { message: 'OK' });
});

app.post('/', async (c) => {
  return success(c, { message: 'OK' });
});


// GetMarketInfo - GET /market/info
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetMarketInfo 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemByType - GET /market/items
app.get('/items', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type, page, order_by, order_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetSellItemByType 逻辑
    return success(c, { data: null, message: "Feature in development" });
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
    // TODO: 实现 GetSellItemNum 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// BuyItem - POST /market/buy
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, itemID, price } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 BuyItem 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemNumByItemName - GET /market/count-by-name
app.get('/count-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type, item_name } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetSellItemNumByItemName 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSellItemByItemName - GET /market/items-by-name
app.get('/items-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type, page, item_name, order_by, order_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetSellItemByItemName 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
