/**
 * Appendant NPC Routes - 附属 NPC 占领系统
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { AppendantNPCService } from '../services/appendant-npc.svc';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// 辅助函数：获取消耗
async function getUserResources(c: any, walletAddress: string) {
  const db = c.env.DB;
  const userRepo = c.env.USER_REPO || {};
  
  // 从数据库获取用户战勋
  try {
    const result = await db.prepare(`
      SELECT insignia FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    
    return {
      insignia: result?.insignia || 0,
    };
  } catch {
    return { insignia: 0 };
  }
}

/**
 * 获取 NPC 列表
 */
app.get('/npc-list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  const service = new AppendantNPCService(db);

  const result = await service.getNPCList(walletAddress);
  return success(c, result);
});

/**
 * 获取我的 NPC 占领信息
 */
app.get('/my-npc', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  const service = new AppendantNPCService(db);

  const result = await service.getMyNPC(walletAddress);
  return success(c, result);
});

/**
 * 占领 NPC
 */
app.post('/occupy', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { npc_pos, use_gold, use_insignia } = await c.req.json<{
    npc_pos?: number;
    use_gold?: boolean;
    use_insignia?: boolean;
  }>();

  if (!npc_pos || npc_pos < 1 || npc_pos > 8) {
    return error(c, '无效的NPC位置，请选择 1-8 号据点');
  }

  const db = c.env.DB;
  const service = new AppendantNPCService(db);

  const config = service['repo']?.['getNPCConfig'](npc_pos);
  if (!config) {
    return error(c, 'NPC配置不存在');
  }

  const result = await service.occupy(walletAddress, npc_pos, {
    gold: use_gold ? config.gold : 0,
    insignia: use_insignia ? config.insignia : 0,
  });

  if (!result.success) {
    return error(c, result.error || '占领失败');
  }

  return success(c, {
    npc: result.npc,
    cost: result.cost,
    message: `成功占领 ${result.npc?.npcName}，占领时间 24 小时`,
  });
});

/**
 * 放弃占领
 */
app.post('/abandon', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  const service = new AppendantNPCService(db);

  const result = await service.abandon(walletAddress);

  if (!result.success) {
    return error(c, result.error || '放弃失败');
  }

  return success(c, {
    message: '已放弃占领',
  });
});

/**
 * 获取占领收益信息
 */
app.get('/benefits/:pos', async (c) => {
  const pos = parseInt(c.req.param('pos'));
  const db = c.env.DB;
  const service = new AppendantNPCService(db);

  const benefits = service.getOccupationBenefits(pos);

  if (!benefits) {
    return error(c, 'NPC位置不存在');
  }

  return success(c, benefits);
});

/**
 * 清理过期占领 (定时任务调用)
 */
app.post('/cleanup', async (c) => {
  const db = c.env.DB;
  const service = new AppendantNPCService(db);

  // 注意：由于 repo 是私有属性，这里需要用另一种方式访问
  // 实际实现中应该将 repo 暴露出来
  const repo = new (await import('../repositories/appendant-npc.repo')).AppendantNPCRepository(db);
  const cleanedCount = await repo.cleanupExpired();

  return success(c, {
    cleanedCount,
    message: `清理了 ${cleanedCount} 个过期占领`,
  });
});


// 添加附庸NPC - POST /appendant-npc/add
app.post('/add', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, npc_id } = await c.req.json();
  if (!city_id || !npc_id) return error(c, 'city_id and npc_id are required');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取城市信息
    const city: any = await db.prepare(`
      SELECT * FROM cities WHERE wallet_address = ? AND id = ?
    `).bind(walletAddress, city_id).first();

    if (!city) return error(c, '城市不存在', 404);

    // 检查是否已有该附庸NPC
    const existing: any = await db.prepare(`
      SELECT id FROM appendant_npc WHERE npc_pos = ? AND wallet_address = ?
    `).bind(npc_id, walletAddress).first();

    if (existing) return error(c, '该NPC已是您的附庸');

    // 添加附庸NPC (npc_pos是NPC在地图上的位置)
    const now = new Date().toISOString();
    const endTime = new Date(Date.now() + 3600000).toISOString(); // 默认1小时
    const result = await db.prepare(`
      INSERT INTO appendant_npc (wallet_address, npc_pos, state, begin_time, end_time)
      VALUES (?, ?, 1, ?, ?)
    `).bind(walletAddress, npc_id, now, endTime).run();

    return success(c, {
      id: result.meta.last_row_id,
      npcId: npc_id,
      message: '附庸NPC添加成功',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetAllAppendantNpcInfo - GET /appendant-npc/list 获取所有附庸NPC
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let query = `
      SELECT an.*, c.name as city_name, c.position as city_position
      FROM appendant_npc an
      JOIN cities c ON c.wallet_address = an.wallet_address
      WHERE an.wallet_address = ?
    `;
    const params: any[] = [walletAddress];

    if (city_id) {
      query += ' AND c.id = ?';
      params.push(city_id);
    }

    query += ' ORDER BY an.created_at DESC';

    const npcs = await db.prepare(query).bind(...params).all();

    return success(c, npcs.results || []);
  } catch (err: any) {
    // 表可能不存在
    return success(c, []);
  }
});

// DelAppendantNPC - POST /appendant-npc/delete 删除附庸NPC
app.post('/delete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { npc_id } = await c.req.json();
  if (!npc_id) return error(c, 'npc_id (npc_pos) is required');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let query = `DELETE FROM appendant_npc WHERE npc_pos = ? AND wallet_address = ?`;
    const params: any[] = [npc_id, walletAddress];

    const result = await db.prepare(query).bind(...params).run();

    if (result.meta.changes === 0) {
      return error(c, '附庸NPC不存在或无权删除');
    }

    return success(c, {
      message: '附庸NPC已删除',
      deletedCount: result.meta.changes,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
