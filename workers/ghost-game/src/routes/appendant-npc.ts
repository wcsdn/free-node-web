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


// mock - POST /appendant-npc/add
app.post('/add', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id, npc_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 mock 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetAllAppendantNpcInfo - GET /appendant-npc/list
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);



  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 GetAllAppendantNpcInfo 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DelAppendantNPC - POST /appendant-npc/delete
app.post('/delete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { npc_id } = await c.req.json();

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // TODO: 实现 DelAppendantNPC 逻辑
    return success(c, { message: 'Not implemented yet' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
