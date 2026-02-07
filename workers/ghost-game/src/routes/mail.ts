/**
 * 邮件路由 - 完整版
 * 支持：系统邮件、战斗报告、附件领取、已读状态
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

// 邮件类型
const MAIL_TYPES = {
  SYSTEM: 'system',         // 系统邮件
  BATTLE: 'battle',          // 战斗报告
  GIFT: 'gift',              // 礼物邮件
  CORPS: 'corps',            // 军团邮件
  FRIEND: 'friend',          // 好友邮件
};

// 获取邮件列表
app.get('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { type, unread_only } = c.req.query();

  try {
    let query = `SELECT * FROM mails WHERE receiver_address = ?`;
    const params: any[] = [walletAddress];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (unread_only === 'true') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const mails = await db.prepare(query).bind(...params).all();

    // 解析附件 JSON
    const mailsWithParsed = (mails.results || []).map((mail: any) => ({
      ...mail,
      attachments: mail.attachments ? JSON.parse(mail.attachments) : null,
      has_attachment: !!mail.attachments,
    }));

    return success(c, {
      mails: mailsWithParsed,
      unread_count: mailsWithParsed.filter((m: any) => !m.is_read).length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取单个邮件详情
app.get('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const mail: any = await db.prepare(`
      SELECT * FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).first();

    if (!mail) return error(c, 'Mail not found', 404);

    // 标记为已读
    if (!mail.is_read) {
      await db.prepare(`
        UPDATE mails SET is_read = 1 WHERE id = ?
      `).bind(mailId).run();
    }

    return success(c, {
      ...mail,
      attachments: mail.attachments ? JSON.parse(mail.attachments) : null,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发送邮件
app.post('/send', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { 
    to_address, 
    title, 
    content, 
    mail_type,
    attachments,
  } = await c.req.json();

  if (!to_address || !title) return error(c, 'Missing required fields: to_address, title');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      INSERT INTO mails (receiver_address, sender_address, title, content, type, attachments)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      to_address,
      walletAddress,
      title,
      content || '',
      mail_type || MAIL_TYPES.SYSTEM,
      attachments ? JSON.stringify(attachments) : null
    ).run();

    return success(c, { 
      id: result.meta.last_row_id, 
      message: 'Mail sent successfully' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发送系统邮件（批量或单发）
app.post('/system', async (c) => {
  // 验证管理员权限（可以通过特殊头或配置控制）
  const adminAddress = c.req.header('X-Admin-Auth');
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { 
    to_address,      // 单个地址，留空则发送给所有用户
    title, 
    content, 
    mail_type,
    attachments,
  } = await c.req.json();

  if (!title) return error(c, 'Missing required field: title');

  try {
    if (to_address) {
      // 发送给单个用户
      const result = await db.prepare(`
        INSERT INTO mails (receiver_address, sender_address, title, content, type, attachments)
        VALUES (?, 'System', ?, ?, ?, ?)
      `).bind(to_address, title, content || '', mail_type || MAIL_TYPES.SYSTEM, attachments ? JSON.stringify(attachments) : null).run();

      return success(c, { 
        id: result.meta.last_row_id, 
        message: 'System mail sent' 
      });
    } else {
      // 广播给所有用户
      // 获取所有用户地址
      const users = await db.prepare(`
        SELECT wallet_address FROM characters
      `).all();

      let sentCount = 0;
      for (const user of (users.results || [])) {
        await db.prepare(`
          INSERT INTO mails (receiver_address, sender_address, title, content, type, attachments)
          VALUES (?, 'System', ?, ?, ?, ?)
        `).bind(
          (user as any).wallet_address,
          title,
          content || '',
          mail_type || MAIL_TYPES.SYSTEM,
          attachments ? JSON.stringify(attachments) : null
        ).run();
        sentCount++;
      }

      return success(c, { 
        message: `Broadcast sent to ${sentCount} users` 
      });
    }
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 发送战斗报告
app.post('/battle-report', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { 
    to_address, 
    battle_id,
    battle_result,
    report_data,
  } = await c.req.json();

  if (!to_address || !battle_id) return error(c, 'Missing required fields');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const title = battle_result === 'win' ? '战斗胜利' : '战斗失败';
    const content = JSON.stringify({
      battle_id,
      result: battle_result,
      report: report_data,
      time: new Date().toISOString(),
    });

    const result = await db.prepare(`
      INSERT INTO mails (receiver_address, sender_address, title, content, type)
      VALUES (?, ?, ?, ?, ?)
    `).bind(to_address, walletAddress, title, content, MAIL_TYPES.BATTLE).run();

    return success(c, { 
      id: result.meta.last_row_id, 
      message: 'Battle report sent' 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 领取附件
app.post('/:id/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 获取邮件和附件
    const mail: any = await db.prepare(`
      SELECT * FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).first();

    if (!mail) return error(c, 'Mail not found', 404);
    if (!mail.attachments) return error(c, 'No attachments in this mail');

    const attachments = JSON.parse(mail.attachments);
    
    // 发放附件物品
    if (attachments.items && attachments.items.length > 0) {
      for (const item of attachments.items) {
        // 添加物品到背包
        await db.prepare(`
          INSERT INTO items (wallet_address, config_id, type, count, source)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          walletAddress,
          item.config_id,
          item.type || 'consumable',
          item.count || 1,
          'mail_attachment'
        ).run();
      }
    }

    // 发放资源
    if (attachments.resources) {
      const city: any = await db.prepare(`
        SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
      `).bind(walletAddress).first();

      if (city) {
        await db.prepare(`
          UPDATE cities SET 
            money = money + ?,
            food = food + ?,
            population = population + ?
          WHERE id = ?
        `).bind(
          attachments.resources.money || 0,
          attachments.resources.food || 0,
          attachments.resources.population || 0,
          city.id
        ).run();
      }
    }

    // 清空附件
    await db.prepare(`
      UPDATE mails SET attachments = NULL WHERE id = ?
    `).bind(mailId).run();

    return success(c, { 
      message: 'Attachment claimed successfully',
      attachments,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 标记已读
app.post('/:id/read', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE mails SET is_read = 1 WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).run();

    return success(c, { message: 'Marked as read' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 批量标记已读
app.post('/read-all', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    await db.prepare(`
      UPDATE mails SET is_read = 1 WHERE receiver_address = ?
    `).bind(walletAddress).run();

    return success(c, { message: 'All mails marked as read' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 删除邮件
app.delete('/:id', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const mailId = parseInt(c.req.param('id'));
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      DELETE FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).run();

    if (result.meta.changes === 0) {
      return error(c, 'Mail not found', 404);
    }

    return success(c, { message: 'Mail deleted' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 批量删除已读邮件
app.delete('/read', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const result = await db.prepare(`
      DELETE FROM mails WHERE receiver_address = ? AND is_read = 1
    `).bind(walletAddress).run();

    return success(c, { 
      message: `Deleted ${result.meta.changes} read mails` 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 清理旧邮件
app.post('/cleanup', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const days = parseInt(c.req.query('days') || '30');

  try {
    const result = await db.prepare(`
      DELETE FROM mails 
      WHERE receiver_address = ? 
      AND created_at < datetime('now', ?)
    `).bind(walletAddress, `-${days} days`).run();

    return success(c, { 
      message: `Cleaned up ${result.meta.changes} old mails` 
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
