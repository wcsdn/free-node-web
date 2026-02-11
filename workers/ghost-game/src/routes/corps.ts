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

// 根路由
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);
  return success(c, { 
    inCorps: false, 
    myCorps: null,
    corpsList: [] 
  });
});

app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);
  return success(c, { 
    inCorps: false, 
    myCorps: null,
    corpsList: [] 
  });
});


// GetCityCropsState - GET /corps/state
app.get('/state', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetCityCropsState 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddCorpsEvent - POST /corps/event
app.post('/event', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, action_type, corps_id, target_id, target_pos } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 AddCorpsEvent 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// CallCorpsBack - POST /corps/recall
app.post('/recall', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 CallCorpsBack 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCityOtherCorps - GET /corps/other
app.get('/other', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetCityOtherCorps 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddCorpsEventExtend - POST /corps/event-extend
app.post('/event-extend', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, action_type, corps_id, target_id, target_pos, extend_data } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 AddCorpsEventExtend 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetSimpleCropsHeros - GET /corps/simple-heroes
app.get('/simple-heroes', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetSimpleCropsHeros 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetCropsNeedTime - GET /corps/need-time
app.get('/need-time', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { cityID, tPos, actiontype } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetCropsNeedTime 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ReturnCorps - POST /corps/return
app.post('/return', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { corpsID } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 ReturnCorps 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
