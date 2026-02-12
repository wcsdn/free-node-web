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


// GetMallInfo - GET /shop/items
app.get('/items', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);



  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetMallInfo 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// BuyItemFromCommodity - POST /shop/buy
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, type, id, index } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 BuyItemFromCommodity 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetVipSevenDays - GET /shop/vip-seven-days
app.get('/vip-seven-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetVipSevenDays 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetVipThirtyDays - GET /shop/vip-thirty-days
app.get('/vip-thirty-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetVipThirtyDays 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPeaceEightHours - GET /shop/peace-eight-hours
app.get('/peace-eight-hours', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetPeaceEightHours 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPeaceTwoDays - GET /shop/peace-two-days
app.get('/peace-two-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetPeaceTwoDays 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetPeaceSevenDays - GET /shop/peace-seven-days
app.get('/peace-seven-days', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetPeaceSevenDays 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ResToGoldRateOfExchange - GET /shop/res-to-gold-rate
app.get('/res-to-gold-rate', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { resource_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 ResToGoldRateOfExchange 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCommoditysByType - GET /shop/items-by-type
app.get('/items-by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, commodity_type } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetCommoditysByType 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// UpdatePersistEffectByType - POST /shop/persist-effect
app.post('/persist-effect', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, main_type, effect_type } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 UpdatePersistEffectByType 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GoldBuyRes - POST /shop/gold-buy-resource
app.post('/gold-buy-resource', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, resource_type, gold_amount } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GoldBuyRes 逻辑
    return success(c, { data: null, message: "Feature in development" });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
