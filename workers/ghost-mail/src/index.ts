/**
 * Ghost Mail Worker - API 服务
 * 处理邮箱生成、删除、邮件查询等业务逻辑
 */

interface Env {
  DB: D1Database;  // Cloudflare D1 数据库
  TREASURY_ADDRESS: string;  // 收款地址
}

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 常量配置
const MAX_ALIASES_PER_USER = 5;
const ALIAS_LENGTH = 7;
const ALIAS_REGEX = /^\d{7}$/;
const DOMAIN = '@free-node.xyz';

// 敏感词过滤
const SENSITIVE_WORDS = ['公安', '网贷', '诈骗', '赌博', '色情'];

export default {
  /**
   * 邮件接收处理器
   */
  async email(message: any, env: Env, ctx: any): Promise<void> {
    try {
      // 1. 解析邮件
      const PostalMime = (await import('postal-mime')).default;
      const parser = new PostalMime();
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const parsed = await parser.parse(rawEmail);

      // 2. 验证收件人 (Security)
      const toAddress = message.to; // e.g., "8392011@free-node.xyz"
      const aliasName = toAddress.split('@')[0];

      // 严格验证：必须是 7 位数字
      if (!/^\d{7}$/.test(aliasName)) {
        message.setReject('Invalid address format');
        return;
      }

      // 3. 查库：这个别名是否存在？
      const alias = await env.DB.prepare('SELECT * FROM aliases WHERE alias_name = ?')
        .bind(aliasName)
        .first();

      if (!alias) {
        message.setReject('Address not found'); // 拒收，避免垃圾邮件
        return;
      }

      // 4. 敏感词过滤
      const subject = parsed.subject || 'No Subject';
      const body = parsed.html || parsed.text || '';
      const sensitiveWords = ['公安', '网贷', '诈骗', '赌博', '色情'];
      
      for (const word of sensitiveWords) {
        if (subject.includes(word) || body.includes(word)) {
          message.setReject('Suspicious content detected');
          return;
        }
      }

      // 5. 入库
      await env.DB.prepare(
        'INSERT INTO inbox (alias_name, sender, subject, preview, body, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)'
      )
        .bind(
          aliasName,
          message.from,
          subject,
          (parsed.text || '').substring(0, 100), // 预览前100字
          body,
          Date.now()
        )
        .run();

      console.log(`Email received for ${aliasName} from ${message.from}`);
    } catch (error) {
      console.error('Email processing error:', error);
      message.setReject('Internal error');
    }
  },

  /**
   * 定时任务 - 自动清理旧邮件
   * 规则：每个邮箱保留最近5条邮件
   */
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    try {
      // 获取所有邮箱地址
      const aliases = await env.DB.prepare('SELECT DISTINCT to_address FROM inbox').all();
      
      let totalDeleted = 0;
      
      // 对每个邮箱，删除超过最近5条的邮件
      for (const alias of aliases.results) {
        const toAddress = alias.to_address;
        
        // 删除该邮箱中除了最近5条之外的所有邮件
        const result = await env.DB.prepare(`
          DELETE FROM inbox 
          WHERE to_address = ? 
          AND id NOT IN (
            SELECT id FROM inbox 
            WHERE to_address = ? 
            ORDER BY created_at DESC 
            LIMIT 5
          )
        `)
          .bind(toAddress, toAddress)
          .run();
        
        totalDeleted += result.meta.changes || 0;
      }

      console.log(`[Cron] Deleted ${totalDeleted} old emails across ${aliases.results.length} mailboxes.`);
    } catch (error) {
      console.error('[Cron] Error cleaning up emails:', error);
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 路由分发
      if (url.pathname === '/api/auth/verify' && request.method === 'POST') {
        return await handleVerifyPayment(request, env);
      }

      if (url.pathname === '/api/alias/generate' && request.method === 'POST') {
        return await handleGenerateAlias(request, env);
      }

      if (url.pathname.startsWith('/api/alias/') && request.method === 'DELETE') {
        const aliasName = url.pathname.split('/').pop();
        return await handleDeleteAlias(request, env, aliasName!);
      }

      if (url.pathname === '/api/inbox' && request.method === 'GET') {
        const address = url.searchParams.get('address');
        return await handleGetInbox(env, address!);
      }

      if (url.pathname === '/api/status' && request.method === 'GET') {
        const address = url.searchParams.get('address');
        return await handleGetStatus(env, address!);
      }

      if (url.pathname === '/api/tasks' && request.method === 'GET') {
        return await handleGetTasks();
      }

      if (url.pathname === '/api/tasks/complete' && request.method === 'POST') {
        return await handleCompleteTask(request, env);
      }

      return jsonResponse({ success: false, error: 'Not found' }, 404);
    } catch (error: any) {
      console.error('Error:', error);
      return jsonResponse({ success: false, error: error.message }, 500);
    }
  },
};

/**
 * 验证支付 - 升级为 VIP
 */
async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { address?: string; txHash?: string };
  const { address, txHash } = body;

  if (!address || !txHash) {
    return jsonResponse({ success: false, error: 'Missing address or txHash' }, 400);
  }

  // 导入验证函数
  const { verifyTransaction } = await import('./utils/web3');

  // 验证链上交易
  const isValid = await verifyTransaction(txHash, address, env);

  if (!isValid) {
    return jsonResponse(
      { success: false, error: 'Invalid transaction. Please check the amount and recipient.' },
      400
    );
  }

  // 验证通过，升级为 VIP
  await env.DB.prepare(
    `INSERT INTO users (address, access_level, created_at) 
     VALUES (?, 1, ?) 
     ON CONFLICT(address) DO UPDATE SET access_level = 1`
  )
    .bind(address.toLowerCase(), Date.now())
    .run();

  return jsonResponse({ success: true, data: { isVIP: true } });
}

/**
 * 生成新邮箱别名
 */
async function handleGenerateAlias(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { address?: string };
  const { address } = body;

  if (!address) {
    return jsonResponse({ success: false, error: 'Missing address' }, 400);
  }

  const lowerAddress = address.toLowerCase();

  // GM 白名单检查（跳过 VIP 验证）
  const gmWhitelist = [env.TREASURY_ADDRESS?.toLowerCase()];
  const isGM = gmWhitelist.includes(lowerAddress);

  // Step 1: 检查用户是否是 VIP（GM 跳过）
  if (isGM) {
    // GM 用户：确保数据库中有记录（满足外键约束）
    await env.DB.prepare(
      `INSERT INTO users (address, access_level, created_at) 
       VALUES (?, 999, ?) 
       ON CONFLICT(address) DO UPDATE SET access_level = 999`
    )
      .bind(lowerAddress, Date.now())
      .run();
  } else {
    // 普通用户：检查 VIP 权限
    const user = await env.DB.prepare('SELECT access_level FROM users WHERE address = ?')
      .bind(lowerAddress)
      .first() as { access_level: number } | null;

    if (!user || user.access_level < 1) {
      return jsonResponse(
        { success: false, error: 'Access denied. Please upgrade to VIP first.' },
        403
      );
    }
  }

  // Step 2: 检查当前邮箱数量（GM 用户上限 99，普通用户上限 5）
  const maxLimit = isGM ? 99 : MAX_ALIASES_PER_USER;
  const count = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM aliases WHERE owner_address = ?'
  )
    .bind(lowerAddress)
    .first() as { count: number } | null;

  if (count && count.count >= maxLimit) {
    return jsonResponse(
      {
        success: false,
        error: `Max limit reached (${maxLimit}). Delete old emails to create new ones.`,
      },
      400
    );
  }

  // Step 3: 生成随机 7 位数字
  let aliasName: string;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    aliasName = generateRandomAlias();

    // Step 4: 检查是否已被占用
    const existing = await env.DB.prepare('SELECT alias_name FROM aliases WHERE alias_name = ?')
      .bind(aliasName)
      .first();

    if (!existing) {
      // 插入新别名
      const createdAt = Date.now();
      await env.DB.prepare(
        'INSERT INTO aliases (alias_name, owner_address, created_at) VALUES (?, ?, ?)'
      )
        .bind(aliasName, lowerAddress, createdAt)
        .run();

      return jsonResponse({
        success: true,
        data: {
          alias: {
            alias_name: aliasName,
            owner_address: lowerAddress,
            created_at: createdAt,
          },
        },
      });
    }

    attempts++;
  }

  return jsonResponse({ success: false, error: 'Failed to generate unique alias' }, 500);
}

/**
 * 删除邮箱别名
 */
async function handleDeleteAlias(
  request: Request,
  env: Env,
  aliasName: string
): Promise<Response> {
  const body = await request.json() as { address?: string };
  const { address } = body;

  if (!address || !aliasName) {
    return jsonResponse({ success: false, error: 'Missing address or alias_name' }, 400);
  }

  if (!ALIAS_REGEX.test(aliasName)) {
    return jsonResponse({ success: false, error: 'Invalid alias format' }, 400);
  }

  const lowerAddress = address.toLowerCase();

  // 验证所有权
  const alias = await env.DB.prepare(
    'SELECT owner_address FROM aliases WHERE alias_name = ?'
  )
    .bind(aliasName)
    .first();

  if (!alias) {
    return jsonResponse({ success: false, error: 'Alias not found' }, 404);
  }

  if (alias.owner_address !== lowerAddress) {
    return jsonResponse({ success: false, error: 'Permission denied' }, 403);
  }

  // 删除别名（会级联删除相关邮件）
  await env.DB.prepare('DELETE FROM aliases WHERE alias_name = ?').bind(aliasName).run();

  return jsonResponse({ success: true });
}

/**
 * 获取收件箱
 */
async function handleGetInbox(env: Env, address: string): Promise<Response> {
  if (!address) {
    return jsonResponse({ success: false, error: 'Missing address' }, 400);
  }

  const lowerAddress = address.toLowerCase();

  // 获取用户所有别名
  const aliases = await env.DB.prepare(
    'SELECT alias_name FROM aliases WHERE owner_address = ?'
  )
    .bind(lowerAddress)
    .all();

  if (!aliases.results || aliases.results.length === 0) {
    return jsonResponse({ success: true, data: { mails: [], total: 0 } });
  }

  // 获取所有别名的邮件
  const aliasNames = aliases.results.map((a: any) => a.alias_name);
  const placeholders = aliasNames.map(() => '?').join(',');

  const mails = await env.DB.prepare(
    `SELECT * FROM inbox WHERE alias_name IN (${placeholders}) ORDER BY created_at DESC LIMIT 100`
  )
    .bind(...aliasNames)
    .all();

  return jsonResponse({
    success: true,
    data: {
      mails: mails.results || [],
      total: mails.results?.length || 0,
    },
  });
}

/**
 * 获取用户状态
 */
async function handleGetStatus(env: Env, address: string): Promise<Response> {
  if (!address) {
    return jsonResponse({ success: false, error: 'Missing address' }, 400);
  }

  const lowerAddress = address.toLowerCase();

  // GM 白名单检查
  const gmWhitelist = [env.TREASURY_ADDRESS?.toLowerCase()];
  const isGM = gmWhitelist.includes(lowerAddress);

  // 获取用户信息
  const user = await env.DB.prepare('SELECT * FROM users WHERE address = ?')
    .bind(lowerAddress)
    .first() as { access_level: number } | null;

  const isVIP = isGM || (user ? user.access_level >= 1 : false);

  // 获取别名列表
  const aliases = await env.DB.prepare(
    'SELECT * FROM aliases WHERE owner_address = ? ORDER BY created_at DESC'
  )
    .bind(lowerAddress)
    .all();

  // GM 用户上限 99，普通用户上限 5
  const maxSlots = isGM ? 99 : MAX_ALIASES_PER_USER;

  return jsonResponse({
    success: true,
    data: {
      isVIP,
      activeSlots: aliases.results?.length || 0,
      maxSlots,
      aliases: aliases.results || [],
    },
  });
}

/**
 * 生成随机 7 位数字别名
 */
function generateRandomAlias(): string {
  const min = 1000000; // 最小 7 位数
  const max = 9999999; // 最大 7 位数
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * 获取任务列表
 */
async function handleGetTasks(): Promise<Response> {
  const { referralTasks } = await import('./config/referral');
  return jsonResponse({ success: true, data: { tasks: referralTasks } });
}

/**
 * 完成任务 - 升级为 VIP
 */
async function handleCompleteTask(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { address?: string; taskId?: string };
  const { address, taskId } = body;

  if (!address || !taskId) {
    return jsonResponse({ success: false, error: 'Missing address or taskId' }, 400);
  }

  // TODO: 实际验证任务完成
  // 目前简化处理：直接升级为 VIP
  await env.DB.prepare(
    `INSERT INTO users (address, access_level, created_at) 
     VALUES (?, 1, ?) 
     ON CONFLICT(address) DO UPDATE SET access_level = 1`
  )
    .bind(address.toLowerCase(), Date.now())
    .run();

  return jsonResponse({ success: true, data: { isVIP: true } });
}

/**
 * JSON 响应辅助函数
 */
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
