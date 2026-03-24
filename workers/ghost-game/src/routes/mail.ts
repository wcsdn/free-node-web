/**
 * Mail Routes - 邮件接口
 * 使用 Service 层
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';
import { mailService, MAIL_TYPES, MAIL_STATUS, MAIL_CONFIG } from '../services';

const app = new Hono<{ Bindings: Env }>();

// 格式化MailInfo (C# MailInfo字段)
const formatMail = (mail: any) => ({
  MailID: mail.id,
  UserName: mail.wallet_address || '',
  ReadTag: mail.read || 0,
  MailType: mail.type || 1,
  Title: mail.title || '',
  MailFrom: mail.from_user || '',
  Text: mail.content || '',
  DateTime: mail.created_at || '',
});

// 辅助函数
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

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');

  const result = await mailService.getMailList(db, walletAddress, { page, pageSize });
  const r = result as any;

  return success(c, r);
});

// POST /mail/list - 获取邮件列表 (别名，兼容 POST)
app.post('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { page = 1, pageSize = 20 } = await c.req.json().catch(() => ({}));
  const result = await mailService.getMailList(db, walletAddress, { page, pageSize });
  const r = result as any;

  // 返回直接数组格式给前端 (前端 cb_GetMailList 用 result.value 作为数组)
  return success(c, r.mails || []);
});

// GET /mail/unread-count - 获取未读邮件数 (别名，兼容 GET)
app.get('/unread-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const unreadCount = await mailService.getUnreadCount(db, walletAddress);
    const listResult = await mailService.getMailList(db, walletAddress, { page: 1, pageSize: 1 });
    const total = (listResult as any).total || 0;
    
    return success(c, {
      unreadCount,
      totalCount: total,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

app.post('/', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  // POST /mail 发送邮件
  const { to_user, title, content, attachments } = await c.req.json();
  
  if (!to_user || !title || !content) {
    return error(c, 'to_user, title, content are required');
  }

  try {
    const result = await mailService.sendMail(db, {
      receiverAddress: to_user,
      senderAddress: walletAddress,
      title,
      content,
      type: MAIL_TYPES.PLAYER,
      attachments: attachments ? JSON.stringify(attachments) : undefined,
    });
    const r = result as any;

    if (!r.success) {
      return error(c, r.error || '发送失败');
    }

    return success(c, { mailId: r.mailId, message: '邮件已发送' });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetNewMailNum - 获取新邮件数量
app.get('/new-count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const unreadCount = await mailService.getUnreadCount(db, walletAddress);
    const listResult = await mailService.getMailList(db, walletAddress, { page: 1, pageSize: 1 });
    const total = (listResult as any).total || 0;
    
    return success(c, {
      unreadCount,
      totalCount: total,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMailNum - 获取邮件数量
app.get('/count', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const mail_type = parseInt(c.req.query('mail_type') || '-1');

  try {
    const result = await mailService.getMailList(db, walletAddress, { 
      type: mail_type >= 0 ? mail_type : undefined 
    });
    const r = result as any;

    return success(c, {
      total: r.total || 0,
      unread: await mailService.getUnreadCount(db, walletAddress),
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMailList - 获取邮件列表 (alias for /new)
app.get('/list', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');

  try {
    const result = await mailService.getMailList(db, walletAddress, { page, pageSize });
    const r = result as any;

    return success(c, {
      mails: r.mails || [],
      total: r.total || 0,
      page: r.page || 1,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetNewMail - 获取新邮件列表
app.get('/new', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');

  try {
    const result = await mailService.getMailList(db, walletAddress, { page, pageSize });
    const r = result as any;

    return success(c, {
      mails: r.mails || [],
      total: r.total || 0,
      page: r.page || 1,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMailByType - 按类型获取邮件
app.get('/by-type', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const mail_type = parseInt(c.req.query('mail_type') || '0');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');

  try {
    const result = await mailService.getMailList(db, walletAddress, { 
      type: mail_type, 
      page, 
      pageSize 
    });
    const r = result as any;

    return success(c, {
      mails: r.mails || [],
      total: r.total || 0,
      page: r.page || 1,
      type: mail_type,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetMailByID - 获取邮件详情
app.get('/detail', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const mail_id = parseInt(c.req.query('mail_id') || '0');

  if (!mail_id) return error(c, 'mail_id is required');

  try {
    const mail = await mailService.getMailById(db, walletAddress, mail_id);
    
    if (!mail) {
      return error(c, '邮件不存在', 404);
    }

    // 标记为已读
    await mailService.markAsRead(db, walletAddress, mail_id);

    return success(c, mail);
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetFightMailByID - 获取战报邮件
app.get('/fight', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const mail_id = parseInt(c.req.query('mail_id') || '0');

  if (!mail_id) return error(c, 'mail_id is required');

  try {
    const mail = await mailService.getMailById(db, walletAddress, mail_id);
    
    if (!mail) {
      return error(c, '战报不存在', 404);
    }

    // 解析战报内容中的战斗数据
    let battleData = null;
    try {
      // 邮件内容可能是JSON格式的战报
      battleData = JSON.parse(mail.content || '{}');
    } catch (e) {
      // 解析失败，使用默认
    }

    // 返回战斗相关数据
    return success(c, {
      ...mail,
      battleData: battleData || {
        message: '战报详情请查看邮件内容',
      },
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// DeleteMails - 删除邮件
app.post('/delete', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { mail_ids } = await c.req.json<{ mail_ids?: number[] }>();

  if (!mail_ids || !Array.isArray(mail_ids) || mail_ids.length === 0) {
    return error(c, 'mail_ids is required');
  }

  try {
    // 批量删除邮件
    for (const id of mail_ids) {
      await mailService.deleteMail(db, walletAddress, id);
    }
    const deleted = mail_ids.length;
    const r = deleted as any;

    return success(c, {
      deletedCount: r.deletedCount || mail_ids.length,
      message: '邮件已删除',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// SendMessage - 发送消息
app.post('/send', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { junta, message, title } = await c.req.json<{
    junta?: string;
    message?: string;
    title?: string;
  }>();

  if (!junta || !message) {
    return error(c, 'junta and message are required');
  }

  try {
    const result = await mailService.sendMail(db, {
      receiverAddress: junta,
      senderAddress: walletAddress,
      title: title || '私信',
      content: message,
      type: MAIL_TYPES.PLAYER,
    });
    const r = result as any;

    if (!r.success) {
      return error(c, r.error || '发送失败');
    }

    return success(c, {
      success: true,
      mailId: r.mailId,
      message: '邮件已发送',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// AddnewMail - 创建新邮件（系统邮件）
app.post('/new', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { to_user, title, content, mail_type, attachments } = await c.req.json<{
    to_user?: string;
    title?: string;
    content?: string;
    mail_type?: number;
    attachments?: any;
  }>();

  if (!to_user || !title || !content) {
    return error(c, 'to_user, title, and content are required');
  }

  try {
    const result = await mailService.sendMail(db, {
      receiverAddress: to_user,
      senderAddress: walletAddress,
      title,
      content,
      type: mail_type || MAIL_TYPES.SYSTEM,
      attachments: attachments ? JSON.stringify(attachments) : undefined,
    });
    const r = result as any;

    if (!r.success) {
      return error(c, r.error || '发送失败');
    }

    return success(c, {
      success: true,
      mailId: r.mailId,
      message: '邮件已创建',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// ClaimAttachment - 领取附件
app.post('/claim', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  const { mail_id } = await c.req.json<{ mail_id?: number }>();

  if (!mail_id) return error(c, 'mail_id is required');

  try {
    const result = await mailService.claimAttachment(db, walletAddress, mail_id);
    const r = result as any;

    if (!r.success) {
      return error(c, r.error || '领取失败');
    }

    return success(c, {
      success: true,
      attachments: r.attachments || [],
      message: '附件已领取',
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// GetAnnouncements - 获取系统公告
app.get('/announcements', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    // 从数据库获取系统公告邮件
    const result = await mailService.getMailList(db, walletAddress, { 
      type: MAIL_TYPES.SYSTEM, 
    });
    const r = result as any;
    
    const announcements = (r.mails || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      date: m.created_at,
      important: false,
    }));

    return success(c, {
      announcements,
      total: announcements.length,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

export default app;
