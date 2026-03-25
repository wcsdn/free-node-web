/**
 * Market Routes - 市场接口完整版
 * 支持：市场信息、挂单列表、挂牌、购买、取消挂单
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// ============ 辅助函数 ============

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 市场状态枚举
const MARKET_STATE = {
  ACTIVE: 1,    // 挂单中
  SOLD: 2,       // 已售出
  CANCELLED: 3,  // 已取消
};

// 市场配置
const MARKET_CONFIG = {
  TAX_RATE: 0.05,             // 5% 交易税率
  MAX_LISTINGS_PER_USER: 20,  // 每用户最大挂单数
  MAX_TOTAL_LISTINGS: 5000,   // 市场最大挂单数
  MIN_PRICE: 1,               // 最低挂牌价
  MAX_PRICE: 999999999,       // 最高挂牌价
};

// ============ 确保表存在 ============
async function ensureMarketTable(db: D1Database): Promise<void> {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS market_listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_address TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        config_id INTEGER NOT NULL,
        item_type INTEGER NOT NULL,
        price INTEGER NOT NULL,
        state INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch (e) {
    // 表可能已存在，忽略
  }

  // 索引
  try {
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_market_state ON market_listings(state)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_market_seller ON market_listings(seller_address)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_market_type ON market_listings(item_type)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_market_config ON market_listings(config_id)`).run();
  } catch (e) {
    // 索引可能已存在，忽略
  }
}

// ============ GET /market ============
app.get('/', async (c) => {
  return success(c, { message: 'Market API ready', version: '2.0' });
});

// ============ GET /market/info - 市场信息 ============
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    const activeResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings WHERE state = ?
    `).bind(MARKET_STATE.ACTIVE).first();

    const myListingsResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings
      WHERE seller_address = ? AND state = ?
    `).bind(walletAddress, MARKET_STATE.ACTIVE).first();

    const todayResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings
      WHERE state = ? AND date(created_at) = date('now')
    `).bind(MARKET_STATE.SOLD).first();

    return success(c, {
      marketStatus: 'open',
      taxRate: MARKET_CONFIG.TAX_RATE,
      maxListings: MARKET_CONFIG.MAX_LISTINGS_PER_USER,
      currentListings: activeResult?.count || 0,
      myListings: myListingsResult?.count || 0,
      todaySold: todayResult?.count || 0,
      transactionFee: MARKET_CONFIG.TAX_RATE,
    });
  } catch (err: any) {
    console.error('[MarketInfo]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/list - 市场列表 (前端期望的路由名) ============
// C# 对应: Main.GetSellItemByType → ItemInfo[]
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type, page = '1' } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    let query = `
      SELECT ml.*, c.wallet_address as seller_username, c.id as seller_city_id
      FROM market_listings ml
      LEFT JOIN cities c ON c.wallet_address = ml.seller_address
      WHERE ml.state = ?
    `;
    let countQuery = `SELECT COUNT(*) as total FROM market_listings ml WHERE ml.state = ?`;
    const params: any[] = [MARKET_STATE.ACTIVE];
    const countParams: any[] = [MARKET_STATE.ACTIVE];

    if (item_type) {
      query += ' AND ml.item_type = ?';
      countQuery += ' AND ml.item_type = ?';
      params.push(parseInt(item_type));
      countParams.push(parseInt(item_type));
    }

    query += ' ORDER BY ml.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(query).bind(...params).all(),
      db.prepare(countQuery).bind(...countParams).first(),
    ]);

    const total = (countResult as any)?.total || 0;

    // 按 C# ItemInfo 字段名返回 (大写驼峰)
    const items = (itemsResult.results || []).map((item: any) => ({
      ID: item.item_id,
      Name: item.item_name || '物品',
      Price: item.price,
      Image: '',
      Icon: '',
      Des: item.item_des || '',
      Quality: item.item_quality || 1,
      ItemType: item.item_type || 1,
      StaticIndex: item.config_id || 0,
      UserName: item.seller_username || '',
      CityID: item.seller_city_id || 0,
      ListingID: item.id,
      SellerAddr: item.seller_address,
      State: item.state,
      CreatedAt: item.created_at,
      IsMine: (item.seller_address || '').toLowerCase() === walletAddress.toLowerCase(),
    }));

    return success(c, items);
  } catch (err: any) {
    console.error('[MarketList]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/history - 市场历史 ============
app.get('/history', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { wallet_address } = c.req.query();
  const targetAddress = wallet_address || walletAddress;

  try {
    await ensureMarketTable(db);

    // 获取该用户作为卖家的历史
    const sellResult: any = await db.prepare(`
      SELECT ml.*
      FROM market_listings ml
      WHERE ml.seller_address = ?
      ORDER BY ml.created_at DESC
      LIMIT 100
    `).bind(targetAddress).all();

    const history = (sellResult.results || []).map((r: any) => ({
      ListingID: r.id,
      ItemID: r.item_id,
      ItemName: r.item_name || '物品',
      ItemIcon: '',
      Price: r.price,
      State: r.state,       // 1=挂单中, 2=已售出, 3=已取消
      SellerAddr: r.seller_address,
      CreatedAt: r.created_at,
      Action: r.state === MARKET_STATE.SOLD ? 'sold' : r.state === MARKET_STATE.CANCELLED ? 'cancelled' : 'listing',
    }));

    return success(c, history);
  } catch (err: any) {
    console.error('[MarketHistory]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/items - 市场挂单列表 ============
app.get('/items', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type, page = '1' } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    let query = `
      SELECT ml.*, ic.Name as item_name, ic.Icon as item_icon, ic.Des as item_des, ic.Quality as item_quality
      FROM market_listings ml
      LEFT JOIN items_config ic ON ml.config_id = ic.ID
      WHERE ml.state = ?
    `;
    let countQuery = `SELECT COUNT(*) as total FROM market_listings ml WHERE ml.state = ?`;
    const params: any[] = [MARKET_STATE.ACTIVE];
    const countParams: any[] = [MARKET_STATE.ACTIVE];

    if (item_type) {
      query += ' AND ml.item_type = ?';
      countQuery += ' AND ml.item_type = ?';
      params.push(parseInt(item_type));
      countParams.push(parseInt(item_type));
    }

    query += ' ORDER BY ml.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(query).bind(...params).all(),
      db.prepare(countQuery).bind(...countParams).first(),
    ]);

    const total = (countResult as any)?.total || 0;

    const items = (itemsResult.results || []).map((item: any) => ({
      ListingID: item.id,
      SellerAddr: item.seller_address,
      ItemID: item.item_id,
      ConfigID: item.config_id,
      ItemType: item.item_type,
      ItemName: item.item_name || '物品',
      ItemIcon: item.item_icon || '',
      ItemDes: item.item_des || '',
      ItemQuality: item.item_quality || 1,
      Price: item.price,
      State: item.state,
      CreatedAt: item.created_at,
      IsMine: item.seller_address.toLowerCase() === walletAddress.toLowerCase(),
    }));

    return success(c, items);
  } catch (err: any) {
    console.error('[MarketItems]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/my - 我的挂单列表 ============
app.get('/my', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { page = '1' } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(`
        SELECT ml.*, ic.Name as item_name, ic.Icon as item_icon, ic.Des as item_des
        FROM market_listings ml
        LEFT JOIN items_config ic ON ml.config_id = ic.ID
        WHERE ml.seller_address = ?
        ORDER BY ml.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(walletAddress, pageSize, offset).all(),
      db.prepare(`
        SELECT COUNT(*) as total FROM market_listings WHERE seller_address = ?
      `).bind(walletAddress).first(),
    ]);

    const total = (countResult as any)?.total || 0;

    const items = (itemsResult.results || []).map((item: any) => ({
      ListingID: item.id,
      ItemID: item.item_id,
      ConfigID: item.config_id,
      ItemType: item.item_type,
      ItemName: item.item_name || '物品',
      ItemIcon: item.item_icon || '',
      ItemDes: item.item_des || '',
      Price: item.price,
      State: item.state,
      StateName: item.state === 1 ? '挂单中' : item.state === 2 ? '已售出' : '已取消',
      CreatedAt: item.created_at,
    }));

    return success(c, items);
  } catch (err: any) {
    console.error('[MarketMy]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/count - 挂单数量 ============
// C#: public int[] GetSellItemNum(int type)
// 返回 int[]: [itemCount, pageCount] (数组，不包装)
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_type } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    let query = `SELECT COUNT(*) as count FROM market_listings WHERE state = ?`;
    const params: any[] = [MARKET_STATE.ACTIVE];

    if (item_type) {
      query += ' AND item_type = ?';
      params.push(parseInt(item_type));
    }

    const result: any = await db.prepare(query).bind(...params).first();
    const totalCount = result?.count || 0;
    // C# 逻辑: pageCount = totalCount % 10 == 0 ? totalCount / 10 : totalCount / 10 + 1
    const pageCount = totalCount % 10 === 0 ? Math.floor(totalCount / 10) : Math.floor(totalCount / 10) + 1;

    // C# 返回 int[]: [itemCount, pageCount]
    return success(c, [totalCount, pageCount]);
  } catch (err: any) {
    console.error('[MarketCount]', err);
    return error(c, err.message);
  }
});

// ============ POST /market/list - 挂牌 ============
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { item_id, price } = await c.req.json();

  if (!item_id) return error(c, '缺少物品ID (item_id)');
  if (!price || price < MARKET_CONFIG.MIN_PRICE) return error(c, `价格不能低于 ${MARKET_CONFIG.MIN_PRICE}`);
  if (price > MARKET_CONFIG.MAX_PRICE) return error(c, `价格不能超过 ${MARKET_CONFIG.MAX_PRICE}`);

  try {
    await ensureMarketTable(db);

    // 1. 验证物品所有权
    const item: any = await db.prepare(`
      SELECT i.*, ic.Name as item_name, ic.Type as item_type, ic.Icon as item_icon
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!item) return error(c, '物品不存在或不属于你');
    if ((item.count || 1) < 1) return error(c, '物品数量不足');
    if (item.equipped) return error(c, '已装备的物品不能出售');

    // 2. 检查用户挂单数限制
    const myListingsResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings WHERE seller_address = ? AND state = ?
    `).bind(walletAddress, MARKET_STATE.ACTIVE).first();

    if ((myListingsResult?.count || 0) >= MARKET_CONFIG.MAX_LISTINGS_PER_USER) {
      return error(c, `已达最大挂单数 ${MARKET_CONFIG.MAX_LISTINGS_PER_USER}`);
    }

    // 3. 检查全局挂单数限制
    const totalListings: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings WHERE state = ?
    `).bind(MARKET_STATE.ACTIVE).first();

    if ((totalListings?.count || 0) >= MARKET_CONFIG.MAX_TOTAL_LISTINGS) {
      return error(c, '市场挂单已满，请稍后再试');
    }

    // 4. 检查该物品是否已经在市场上架
    const existingListing: any = await db.prepare(`
      SELECT id FROM market_listings WHERE item_id = ? AND state = ?
    `).bind(item_id, MARKET_STATE.ACTIVE).first();

    if (existingListing) return error(c, '该物品已在市场上架');

    // 5. 扣除物品
    if ((item.count || 1) > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ? AND wallet_address = ?
      `).bind(item_id, walletAddress).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    // 6. 创建挂单记录
    const insertResult = await db.prepare(`
      INSERT INTO market_listings (seller_address, item_id, config_id, item_type, price, state)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      item_id,
      item.config_id,
      item.item_type || 1,
      price,
      MARKET_STATE.ACTIVE
    ).run();

    const listingId = insertResult.meta?.last_row_id;
    const tax = Math.floor(price * MARKET_CONFIG.TAX_RATE);
    const sellerReceives = price - tax;

    return success(c, {
      listingId,
      itemId: item_id,
      itemName: item.item_name || '物品',
      price,
      tax,
      sellerReceives,
      message: `成功上架「${item.item_name || '物品'}」，定价 ${price} 金条`,
    });
  } catch (err: any) {
    console.error('[MarketList]', err);
    return error(c, err.message);
  }
});

// POST /market/sell - 挂牌/出售
// C#: public int SellItem(int cityID, int itemID, int price)
// 返回 int: 0=成功，其他=错误码 (不包装，直接返回整数)
app.post('/sell', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json(-100);  // -100 = session timeout / unauthorized

  const db = c.env.DB;
  if (!db) return c.json(-1);

  const { item_id, price } = await c.req.json();

  if (!item_id) return c.json(1);  // 缺少物品ID
  if (!price || price < MARKET_CONFIG.MIN_PRICE) return c.json(2);  // 价格过低
  if (price > MARKET_CONFIG.MAX_PRICE) return c.json(3);  // 价格过高

  try {
    await ensureMarketTable(db);

    const item: any = await db.prepare(`
      SELECT i.*, ic.Name as item_name, ic.Type as item_type, ic.Icon as item_icon
      FROM items i
      LEFT JOIN items_config ic ON i.config_id = ic.ID
      WHERE i.id = ? AND i.wallet_address = ?
    `).bind(item_id, walletAddress).first();

    if (!item) return c.json(4);  // 物品不存在或不属于你
    if ((item.count || 1) < 1) return c.json(5);  // 物品数量不足
    if (item.equipped) return c.json(6);  // 已装备的物品不能出售

    const myListingsResult: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings WHERE seller_address = ? AND state = ?
    `).bind(walletAddress, MARKET_STATE.ACTIVE).first();

    if ((myListingsResult?.count || 0) >= MARKET_CONFIG.MAX_LISTINGS_PER_USER) {
      return c.json(7);  // 已达最大挂单数
    }

    const totalListings: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings WHERE state = ?
    `).bind(MARKET_STATE.ACTIVE).first();

    if ((totalListings?.count || 0) >= MARKET_CONFIG.MAX_TOTAL_LISTINGS) {
      return c.json(8);  // 市场挂单已满
    }

    const existingListing: any = await db.prepare(`
      SELECT id FROM market_listings WHERE item_id = ? AND state = ?
    `).bind(item_id, MARKET_STATE.ACTIVE).first();

    if (existingListing) return c.json(9);  // 该物品已在市场上架

    if ((item.count || 1) > 1) {
      await db.prepare(`
        UPDATE items SET count = count - 1 WHERE id = ? AND wallet_address = ?
      `).bind(item_id, walletAddress).run();
    } else {
      await db.prepare(`DELETE FROM items WHERE id = ?`).bind(item_id).run();
    }

    await db.prepare(`
      INSERT INTO market_listings (seller_address, item_id, config_id, item_type, price, state)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      item_id,
      item.config_id,
      item.item_type || 1,
      price,
      MARKET_STATE.ACTIVE
    ).run();

    // C# SellItem 返回 0 表示成功 (直接返回整数，不包装)
    return c.json(0);
  } catch (err: any) {
    console.error('[MarketSell]', err);
    return c.json(-1);  // 其他错误
  }
});

// ============ POST /market/buy - 购买 ============
app.post('/buy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // 支持 listing_id 或兼容旧版 itemID
  const { listing_id, itemID, city_id } = await c.req.json();
  const targetId = listing_id || itemID;

  if (!targetId) return error(c, '缺少挂单ID (listing_id)');

  try {
    await ensureMarketTable(db);

    // 1. 查询挂单信息
    const listing: any = await db.prepare(`
      SELECT ml.*, ic.Name as item_name, ic.Type as item_type, ic.Icon as item_icon,
             ic.Des as item_des, ic.Quality as item_quality
      FROM market_listings ml
      LEFT JOIN items_config ic ON ml.config_id = ic.ID
      WHERE ml.id = ?
    `).bind(targetId).first();

    if (!listing) return error(c, '挂单不存在', 404);
    if (listing.state !== MARKET_STATE.ACTIVE) return error(c, '该物品已下架或已售出');

    // 2. 不能购买自己的物品
    if (listing.seller_address.toLowerCase() === walletAddress.toLowerCase()) {
      return error(c, '不能购买自己上架的物品');
    }

    // 3. 验证买家金币
    const buyer: any = await db.prepare(`
      SELECT gold FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!buyer) return error(c, '买家角色不存在', 404);

    const buyerGold = buyer.gold || 0;
    const price = listing.price;

    if (buyerGold < price) {
      return error(c, `金币不足，需要 ${price} 金条，你只有 ${buyerGold} 金条`);
    }

    // 4. 执行交易
    const tax = Math.floor(price * MARKET_CONFIG.TAX_RATE);
    const sellerReceives = price - tax;

    // 扣除买家金币
    await db.prepare(`
      UPDATE characters SET gold = gold - ? WHERE wallet_address = ?
    `).bind(price, walletAddress).run();

    // 给卖家加金币
    await db.prepare(`
      UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
    `).bind(sellerReceives, listing.seller_address).run();

    // 更新挂单状态为已售出
    await db.prepare(`
      UPDATE market_listings SET state = ? WHERE id = ?
    `).bind(MARKET_STATE.SOLD, targetId).run();

    // 添加物品给买家
    const originalItem: any = await db.prepare(`
      SELECT * FROM items WHERE id = ? AND wallet_address = ?
    `).bind(listing.item_id, listing.seller_address).first();

    if (originalItem) {
      await db.prepare(`
        UPDATE items SET wallet_address = ? WHERE id = ?
      `).bind(walletAddress, listing.item_id).run();
    } else {
      await db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, 1, 'market_buy')
      `).bind(walletAddress, listing.config_id).run();
    }

    // 邮件通知卖家
    await db.prepare(`
      INSERT INTO mails (receiver_address, sender_address, title, content, type)
      VALUES (?, ?, ?, ?, 'system')
    `).bind(
      listing.seller_address,
      walletAddress,
      '物品已售出',
      `您的「${listing.item_name || '物品'}」已成功售出，获得 ${sellerReceives} 金条（扣除 ${tax} 金条税费）`,
    ).run();

    // 邮件通知买家
    await db.prepare(`
      INSERT INTO mails (receiver_address, sender_address, title, content, type)
      VALUES (?, ?, ?, ?, 'system')
    `).bind(
      walletAddress,
      listing.seller_address,
      '购买成功',
      `您成功购买了「${listing.item_name || '物品'}」，花费 ${price} 金条`,
    ).run();

    return success(c, {
      listingId: targetId,
      itemId: listing.item_id,
      itemName: listing.item_name || '物品',
      itemIcon: listing.item_icon || '',
      itemQuality: listing.item_quality || 1,
      price,
      tax,
      sellerReceived: sellerReceives,
      buyerGoldRemaining: buyerGold - price,
      message: `成功购买「${listing.item_name || '物品'}」，花费 ${price} 金条`,
    });
  } catch (err: any) {
    console.error('[MarketBuy]', err);
    return error(c, err.message);
  }
});

// ============ POST /market/cancel - 取消挂单 ============
// C#: public int CancleSellItem(int cityID, int listingID) 返回 0=成功
app.post('/cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return c.json({ success: false, code: -100, message: 'Unauthorized' });

  const db = c.env.DB;
  if (!db) return c.json({ success: false, code: -1, message: 'Database not configured' });

  const { listing_id } = await c.req.json();
  if (!listing_id) return c.json({ success: false, code: 1, message: '缺少挂单ID (listing_id)' });

  try {
    await ensureMarketTable(db);

    const listing: any = await db.prepare(`
      SELECT ml.*, ic.Name as item_name, ic.Icon as item_icon
      FROM market_listings ml
      LEFT JOIN items_config ic ON ml.config_id = ic.ID
      WHERE ml.id = ?
    `).bind(listing_id).first();

    if (!listing) return c.json({ success: false, code: 2, message: '挂单不存在' });
    if (listing.state !== MARKET_STATE.ACTIVE) return c.json({ success: false, code: 3, message: '该挂单已结束，无法取消' });
    if (listing.seller_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return c.json({ success: false, code: 4, message: '只能取消自己的挂单' });
    }

    // 更新状态为已取消
    await db.prepare(`
      UPDATE market_listings SET state = ? WHERE id = ?
    `).bind(MARKET_STATE.CANCELLED, listing_id).run();

    // 返还物品
    await db.prepare(`
      INSERT INTO items (wallet_address, config_id, count, source)
      VALUES (?, ?, 1, 'market_cancel')
    `).bind(walletAddress, listing.config_id).run();

    // C# 返回 0 表示成功
    return c.json({ success: true, code: 0 });
  } catch (err: any) {
    console.error('[MarketCancel]', err);
    return c.json({ success: false, code: -1, message: err.message });
  }
});

// ============ POST /market/batch-cancel - 批量取消挂单 ============
app.post('/batch-cancel', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { listing_ids } = await c.req.json();
  if (!listing_ids || !Array.isArray(listing_ids) || listing_ids.length === 0) {
    return error(c, '缺少挂单ID列表 (listing_ids)');
  }

  try {
    await ensureMarketTable(db);

    const results: any[] = [];
    const errors: any[] = [];

    for (const lid of listing_ids) {
      try {
        const listing: any = await db.prepare(`
          SELECT ml.*, ic.Name as item_name
          FROM market_listings ml
          LEFT JOIN items_config ic ON ml.config_id = ic.ID
          WHERE ml.id = ? AND ml.seller_address = ? AND ml.state = ?
        `).bind(lid, walletAddress, MARKET_STATE.ACTIVE).first();

        if (!listing) {
          errors.push({ listingId: lid, error: '挂单不存在或不属于你' });
          continue;
        }

        await db.prepare(`UPDATE market_listings SET state = ? WHERE id = ?`)
          .bind(MARKET_STATE.CANCELLED, lid).run();

        await db.prepare(`
          INSERT INTO items (wallet_address, config_id, count, source)
          VALUES (?, ?, 1, 'market_cancel')
        `).bind(walletAddress, listing.config_id).run();

        results.push({ listingId: lid, itemName: listing.item_name || '物品', success: true });
      } catch (e: any) {
        errors.push({ listingId: lid, error: e.message });
      }
    }

    return success(c, {
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      message: `批量取消完成：成功 ${results.length}，失败 ${errors.length}`,
    });
  } catch (err: any) {
    console.error('[MarketBatchCancel]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/search - 按名称搜索 ============
app.get('/search', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_name, page = '1' } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  if (!item_name) return error(c, '缺少搜索关键词 (item_name)');

  try {
    await ensureMarketTable(db);

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;
    const searchPattern = `%${item_name}%`;

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(`
        SELECT ml.*, ic.Name as item_name, ic.Icon as item_icon, ic.Des as item_des, ic.Quality as item_quality
        FROM market_listings ml
        LEFT JOIN items_config ic ON ml.config_id = ic.ID
        WHERE ml.state = ? AND ic.Name LIKE ?
        ORDER BY ml.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(MARKET_STATE.ACTIVE, searchPattern, pageSize, offset).all(),
      db.prepare(`
        SELECT COUNT(*) as total FROM market_listings ml
        LEFT JOIN items_config ic ON ml.config_id = ic.ID
        WHERE ml.state = ? AND ic.Name LIKE ?
      `).bind(MARKET_STATE.ACTIVE, searchPattern).first(),
    ]);

    const total = (countResult as any)?.total || 0;

    const items = (itemsResult.results || []).map((item: any) => ({
      ListingID: item.id,
      SellerAddr: item.seller_address,
      ItemID: item.item_id,
      ConfigID: item.config_id,
      ItemType: item.item_type,
      ItemName: item.item_name || '物品',
      ItemIcon: item.item_icon || '',
      ItemDes: item.item_des || '',
      ItemQuality: item.item_quality || 1,
      Price: item.price,
      State: item.state,
      IsMine: item.seller_address.toLowerCase() === walletAddress.toLowerCase(),
    }));

    return success(c, items);
  } catch (err: any) {
    console.error('[MarketSearch]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/price-history - 价格走势 ============
app.get('/price-history', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { config_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  if (!config_id) return error(c, '缺少物品配置ID (config_id)');

  try {
    await ensureMarketTable(db);

    const result = await db.prepare(`
      SELECT price, created_at as sold_at
      FROM market_listings
      WHERE config_id = ? AND state = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(parseInt(config_id), MARKET_STATE.SOLD).all();

    const history = (result.results || []).map((r: any) => ({
      price: r.price,
      soldAt: r.sold_at,
    }));

    let avgPrice = 0, minPrice = 0, maxPrice = 0;
    if (history.length > 0) {
      const prices = history.map((h: any) => h.price);
      avgPrice = Math.floor(prices.reduce((a: number, b: number) => a + b, 0) / history.length);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }

    return success(c, {
      configId: parseInt(config_id),
      history,
      avgPrice,
      minPrice,
      maxPrice,
      totalSold: history.length,
    });
  } catch (err: any) {
    console.error('[MarketPriceHistory]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/stats - 市场统计 ============
app.get('/stats', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    const [todaySold, yesterdaySold, totalSold, activeListings, hotItems] = await Promise.all([
      db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as volume
        FROM market_listings WHERE state = ? AND date(created_at) = date('now')
      `).bind(MARKET_STATE.SOLD).first(),
      db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as volume
        FROM market_listings WHERE state = ? AND date(created_at) = date('now', '-1 day')
      `).bind(MARKET_STATE.SOLD).first(),
      db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as volume
        FROM market_listings WHERE state = ?
      `).bind(MARKET_STATE.SOLD).first(),
      db.prepare(`
        SELECT COUNT(*) as count FROM market_listings WHERE state = ?
      `).bind(MARKET_STATE.ACTIVE).first(),
      db.prepare(`
        SELECT ml.config_id, ic.Name as item_name, COUNT(*) as sell_count, AVG(ml.price) as avg_price
        FROM market_listings ml
        LEFT JOIN items_config ic ON ml.config_id = ic.ID
        WHERE ml.state = ?
        GROUP BY ml.config_id
        ORDER BY sell_count DESC
        LIMIT 5
      `).bind(MARKET_STATE.SOLD).all(),
    ]);

    return success(c, {
      today: { soldCount: todaySold?.count || 0, volume: todaySold?.volume || 0 },
      yesterday: { soldCount: yesterdaySold?.count || 0, volume: yesterdaySold?.volume || 0 },
      total: { soldCount: totalSold?.count || 0, volume: totalSold?.volume || 0 },
      activeListings: activeListings?.count || 0,
      hotItems: (hotItems.results || []).map((h: any) => ({
        configId: h.config_id,
        itemName: h.item_name || '物品',
        sellCount: h.sell_count,
        avgPrice: Math.floor(h.avg_price || 0),
      })),
    });
  } catch (err: any) {
    console.error('[MarketStats]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/count-by-name - 按名称统计 ============
app.get('/count-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_name } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await ensureMarketTable(db);

    const result: any = await db.prepare(`
      SELECT COUNT(*) as count FROM market_listings ml
      LEFT JOIN items_config ic ON ml.config_id = ic.ID
      WHERE ml.state = ? AND ic.Name LIKE ?
    `).bind(MARKET_STATE.ACTIVE, `%${item_name || ''}%`).first();

    return success(c, {
      count: result?.count || 0,
      searchTerm: item_name || '',
    });
  } catch (err: any) {
    console.error('[MarketCountByName]', err);
    return error(c, err.message);
  }
});

// ============ GET /market/items-by-name - 按名称搜索 (旧接口兼容) ============
app.get('/items-by-name', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { item_name, page } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  if (!item_name) return error(c, '缺少 item_name 参数');

  try {
    await ensureMarketTable(db);

    const pageNum = Math.max(1, parseInt(page || '1'));
    const pageSize = 20;
    const offset = (pageNum - 1) * pageSize;
    const searchPattern = `%${item_name}%`;

    const [itemsResult, countResult] = await Promise.all([
      db.prepare(`
        SELECT ml.*, ic.Name as item_name, ic.Icon as item_icon, ic.Des as item_des, ic.Quality as item_quality
        FROM market_listings ml
        LEFT JOIN items_config ic ON ml.config_id = ic.ID
        WHERE ml.state = ? AND ic.Name LIKE ?
        ORDER BY ml.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(MARKET_STATE.ACTIVE, searchPattern, pageSize, offset).all(),
      db.prepare(`
        SELECT COUNT(*) as total FROM market_listings ml
        LEFT JOIN items_config ic ON ml.config_id = ic.ID
        WHERE ml.state = ? AND ic.Name LIKE ?
      `).bind(MARKET_STATE.ACTIVE, searchPattern).first(),
    ]);

    const total = (countResult as any)?.total || 0;

    const items = (itemsResult.results || []).map((item: any) => ({
      id: item.id,
      name: item.item_name || '物品',
      type: item.item_type,
      price: item.price,
      amount: 1,
      seller: item.seller_address.substring(0, 6) + '...' + item.seller_address.substring(38),
      quality: item.item_quality || 1,
    }));

    return success(c, {
      items,
      searchTerm: item_name,
      total,
      page: pageNum,
      pageSize,
    });
  } catch (err: any) {
    console.error('[MarketItemsByName]', err);
    return error(c, err.message);
  }
});

export default app;
