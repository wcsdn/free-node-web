/**
 * Gift Routes - 礼品兑换系统
 * 激活码/CDKey 兑换
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

// 模拟激活码数据（生产环境应从数据库读取）
const GIFT_CODES: Record<string, {
  reward: {
    gold?: number;
    exp?: number;
    items?: Array<{ item_id: number; count: number }>;
  };
  max_uses?: number;
  used_count?: number;
  expire_at?: string;
  valid: boolean;
}> = {
  'TEST123': {
    reward: { gold: 1000, exp: 500, items: [{ item_id: 1, count: 10 }] },
    max_uses: 100,
    used_count: 0,
    valid: true,
  },
  'NEWUSER2024': {
    reward: { gold: 5000, exp: 2000 },
    max_uses: 1,
    valid: true,
    expire_at: '2025-12-31',
  },
};

// 用户兑换记录
const USER_REDEMPTIONS: Map<string, Set<string>> = new Map();

/**
 * 验证激活码格式
 */
function validateCodeFormat(code: string): boolean {
  // 激活码格式：8-20位字母数字
  const regex = /^[A-Za-z0-9]{8,20}$/;
  return regex.test(code);
}

/**
 * 验证激活码是否有效
 */
function validateCode(code: string): { valid: boolean; reason?: string } {
  if (!validateCodeFormat(code)) {
    return { valid: false, reason: '激活码格式不正确' };
  }

  const upperCode = code.toUpperCase();
  const codeData = GIFT_CODES[upperCode];

  if (!codeData) {
    return { valid: false, reason: '激活码不存在' };
  }

  if (!codeData.valid) {
    return { valid: false, reason: '激活码已失效' };
  }

  if (codeData.expire_at && new Date(codeData.expire_at) < new Date()) {
    return { valid: false, reason: '激活码已过期' };
  }

  if (codeData.max_uses && (codeData.used_count || 0) >= codeData.max_uses) {
    return { valid: false, reason: '激活码已被兑换完毕' };
  }

  return { valid: true };
}

/**
 * GET: 获取激活码信息（不包含奖励详情）
 */
app.get('/code/:code', async (c) => {
  const code = c.req.param('code');
  const upperCode = code.toUpperCase();

  const validation = validateCode(upperCode);
  const codeData = GIFT_CODES[upperCode];

  if (!codeData) {
    return error(c, '激活码不存在');
  }

  return success(c, {
    code: upperCode,
    exists: true,
    valid: validation.valid,
    reason: validation.reason,
    expire_at: codeData.expire_at,
    remaining_uses: codeData.max_uses 
      ? Math.max(0, codeData.max_uses - (codeData.used_count || 0))
      : null,
  });
});

/**
 * POST: 兑换激活码
 */
app.post('/redeem', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, '请先登录游戏', 401);

  const { code } = await c.req.json<{ code?: string }>();

  if (!code) {
    return error(c, '请提供激活码');
  }

  const upperCode = code.toUpperCase();

  // 1. 验证激活码格式
  const validation = validateCode(upperCode);
  if (!validation.valid) {
    return error(c, validation.reason || '激活码无效');
  }

  // 2. 检查是否已使用
  const userRedemptions = USER_REDEMPTIONS.get(walletAddress) || new Set();
  if (userRedemptions.has(upperCode)) {
    return error(c, '该激活码您已使用过');
  }

  // 3. 获取激活码数据
  const codeData = GIFT_CODES[upperCode];
  if (!codeData) {
    return error(c, '激活码不存在');
  }

  // 4. 记录使用
  userRedemptions.add(upperCode);
  USER_REDEMPTIONS.set(walletAddress, userRedemptions);
  
  if (codeData.used_count !== undefined) {
    GIFT_CODES[upperCode].used_count = (codeData.used_count || 0) + 1;
  }

  const db = c.env.DB;

  try {
    // 5. 发放奖励（如果有数据库）
    if (db) {
      // 记录兑换日志
      await db.prepare(`
        INSERT INTO gift_redemptions (wallet_address, code, reward, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        walletAddress,
        upperCode,
        JSON.stringify(codeData.reward)
      ).run();

      // 发放金币
      if (codeData.reward.gold) {
        await db.prepare(`
          UPDATE characters SET gold = gold + ? WHERE wallet_address = ?
        `).bind(codeData.reward.gold, walletAddress).run();
      }

      // 发放经验
      if (codeData.reward.exp) {
        await db.prepare(`
          UPDATE characters SET exp = exp + ? WHERE wallet_address = ?
        `).bind(codeData.reward.exp, walletAddress).run();
      }

      // 发放物品
      if (codeData.reward.items && codeData.reward.items.length > 0) {
        for (const item of codeData.reward.items) {
          await db.prepare(`
            INSERT INTO items (wallet_address, config_id, count, source)
            VALUES (?, ?, ?, 'gift')
          `).bind(walletAddress, item.item_id, item.count).run();
        }
      }
    }
  } catch (err: any) {
    console.error('Failed to grant rewards:', err);
    // 即使发放失败也返回成功，因为激活码已标记为使用
  }

  // 6. 返回成功
  return success(c, {
    code: upperCode,
    reward: codeData.reward,
    message: '兑换成功！奖励已发放至背包',
  });
});

/**
 * GET: 获取兑换历史
 */
app.get('/history', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, '请先登录游戏', 401);

  const userRedemptions = USER_REDEMPTIONS.get(walletAddress) || new Set();
  
  const history = Array.from(userRedemptions).map(code => ({
    code,
    redeemed_at: '已兑换', // 简化展示
  }));

  return success(c, {
    history,
    total_count: history.length,
  });
});

/**
 * POST: 管理员 - 创建激活码
 */
app.post('/admin/create', async (c) => {
  // 验证管理员权限（简化）
  const authHeader = c.req.header('X-Admin-Token');
  if (authHeader !== 'admin_secret_token') {
    return error(c, '无权限', 403);
  }

  const { code, reward, max_uses, expire_at } = await c.req.json<{
    code?: string;
    reward?: { gold?: number; exp?: number; items?: Array<{ item_id: number; count: number }> };
    max_uses?: number;
    expire_at?: string;
  }>();

  if (!code) {
    return error(c, '请提供激活码');
  }

  const upperCode = code.toUpperCase();

  GIFT_CODES[upperCode] = {
    reward: reward || {},
    max_uses,
    expire_at,
    used_count: 0,
    valid: true,
  };

  return success(c, {
    code: upperCode,
    message: '激活码创建成功',
  });
});

export default app;
