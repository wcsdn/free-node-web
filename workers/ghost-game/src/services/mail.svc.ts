/**
 * Mail Service - 邮件服务层
 * 从 jx/BLL/Mail.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 邮件类型定义
export const MAIL_TYPES = {
  SYSTEM: 0,        // 系统邮件
  PLAYER: 1,        // 玩家发送
  GUILD: 2,         // 帮派邮件
  GROUP: 3,          // 群发邮件
  ATTACHMENT: 4,    // 带附件邮件
  CHESS_LOG: 5,     // 战报邮件
  ARENA: 6,         // 竞技邮件
  CORPS: 7,         // 军团邮件
};

// 邮件状态
export const MAIL_STATUS = {
  UNREAD: 0,
  READ: 1,
  ATTACHMENT_CLAIMED: 2,
};

// 邮件配置
export const MAIL_CONFIG = {
  MAX_TITLE_LENGTH: 50,
  MAX_CONTENT_LENGTH: 500,
  PAGE_SIZE: 20,
  ATTACHMENT_EXPIRY_DAYS: 7,
};

class MailService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 邮件查询 ============

  /**
   * 获取邮件列表
   */
  async getMailList(walletAddress: string, options: {
    type?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { type, page = 1, pageSize = MAIL_CONFIG.PAGE_SIZE } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM mails WHERE receiver_address = ?';
    const params: any[] = [walletAddress];

    if (type !== undefined) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const mails: any = await this.db.prepare(query).bind(...params).all();

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as count FROM mails WHERE receiver_address = ?';
    const countParams: any[] = [walletAddress];
    if (type !== undefined) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    const totalCount: any = await this.db.prepare(countQuery).bind(...countParams).first();

    return {
      mails: (mails.results || []).map(this.formatMail),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取未读邮件数量
   */
  async getUnreadCount(walletAddress: string): Promise<number> {
    const result: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM mails 
      WHERE receiver_address = ? AND is_read = 0
    `).bind(walletAddress).first();

    return (result as any)?.count || 0;
  }

  /**
   * 获取单封邮件详情
   */
  async getMailById(walletAddress: string, mailId: number) {
    const mail: any = await this.db.prepare(`
      SELECT * FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).first();

    if (!mail) return null;

    return this.formatMail(mail);
  }

  /**
   * 搜索邮件
   */
  async searchMails(walletAddress: string, keyword: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const mails: any = await this.db.prepare(`
      SELECT * FROM mails 
      WHERE receiver_address = ? 
        AND (title LIKE ? OR content LIKE ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(walletAddress, `%${keyword}%`, `%${keyword}%`, pageSize, offset).all();

    return (mails.results || []).map(this.formatMail);
  }

  // ============ 邮件操作 ============

  /**
   * 发送邮件
   */
  async sendMail(options: {
    receiverAddress: string;
    senderAddress?: string;
    title: string;
    content: string;
    type?: number;
    attachments?: string;
  }) {
    const { receiverAddress, senderAddress, title, content, type = MAIL_TYPES.SYSTEM, attachments } = options;

    // 验证参数
    if (!receiverAddress || !title || !content) {
      return { success: false, error: '参数不完整' };
    }

    // 长度验证
    if (title.length > MAIL_CONFIG.MAX_TITLE_LENGTH) {
      return { success: false, error: '标题过长' };
    }

    if (content.length > MAIL_CONFIG.MAX_CONTENT_LENGTH) {
      return { success: false, error: '内容过长' };
    }

    // 插入邮件
    const result = await this.db.prepare(`
      INSERT INTO mails (receiver_address, sender_address, title, content, type, attachments, is_read)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).bind(
      receiverAddress,
      senderAddress || 'system',
      title,
      content,
      type,
      attachments || null
    ).run();

    return { success: true, mailId: result.meta.last_row_id };
  }

  /**
   * 批量发送邮件
   */
  async sendBulkMail(receiverAddresses: string[], title: string, content: string, type = MAIL_TYPES.SYSTEM) {
    if (receiverAddresses.length === 0) {
      return { success: false, error: '收件人列表为空' };
    }

    const results: any[] = [];

    for (const address of receiverAddresses) {
      const result = await this.sendMail({
        receiverAddress: address,
        title,
        content,
        type,
      });
      results.push({ address, ...result });
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: true,
      total: receiverAddresses.length,
      successCount,
      failedCount: receiverAddresses.length - successCount,
      results,
    };
  }

  /**
   * 标记邮件已读
   */
  async markAsRead(walletAddress: string, mailId: number) {
    const mail: any = await this.db.prepare(`
      SELECT * FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).first();

    if (!mail) {
      return { success: false, error: '邮件不存在' };
    }

    await this.db.prepare(`
      UPDATE mails SET is_read = 1, read_at = datetime('now') WHERE id = ?
    `).bind(mailId).run();

    return { success: true };
  }

  /**
   * 批量标记已读
   */
  async markAllAsRead(walletAddress: string) {
    await this.db.prepare(`
      UPDATE mails SET is_read = 1, read_at = datetime('now')
      WHERE receiver_address = ? AND is_read = 0
    `).bind(walletAddress).run();

    return { success: true };
  }

  /**
   * 删除邮件
   */
  async deleteMail(walletAddress: string, mailId: number) {
    const mail: any = await this.db.prepare(`
      SELECT * FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).first();

    if (!mail) {
      return { success: false, error: '邮件不存在' };
    }

    // 检查是否有附件未领取
    if (mail.attachments && mail.has_attachment === 1) {
      return { success: false, error: '请先领取附件后再删除' };
    }

    await this.db.prepare(`
      DELETE FROM mails WHERE id = ?
    `).bind(mailId).run();

    return { success: true };
  }

  /**
   * 清理过期邮件
   */
  async cleanupExpiredMails() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - MAIL_CONFIG.ATTACHMENT_EXPIRY_DAYS);

    const result = await this.db.prepare(`
      DELETE FROM mails 
      WHERE created_at < ? 
        AND (has_attachment = 0 OR has_attachment = 2)
    `).bind(expiryDate.toISOString()).run();

    return {
      success: true,
      deletedCount: result.meta.changes,
    };
  }

  // ============ 附件操作 ============

  /**
   * 领取附件
   */
  async claimAttachment(walletAddress: string, mailId: number) {
    const mail: any = await this.db.prepare(`
      SELECT * FROM mails WHERE id = ? AND receiver_address = ?
    `).bind(mailId, walletAddress).first();

    if (!mail) {
      return { success: false, error: '邮件不存在' };
    }

    if (!mail.attachments) {
      return { success: false, error: '该邮件没有附件' };
    }

    if (mail.has_attachment === 2) {
      return { success: false, error: '附件已领取' };
    }

    // 解析附件
    const attachments = JSON.parse(mail.attachments || '[]');

    // TODO: 发放附件物品/资源到玩家背包

    // 更新邮件状态
    await this.db.prepare(`
      UPDATE mails SET has_attachment = 2, attachments = NULL WHERE id = ?
    `).bind(mailId).run();

    return {
      success: true,
      attachments,
      message: '附件领取成功',
    };
  }

  // ============ 系统邮件 ============

  /**
   * 发送系统公告
   */
  async sendSystemAnnouncement(title: string, content: string, priority = 0) {
    // 插入到系统通知表
    await this.db.prepare(`
      INSERT INTO notifications (type, title, content, priority, start_time, end_time)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now', '+30 days'))
    `).bind(priority, title, content).run();

    return { success: true };
  }

  /**
   * 发送奖励邮件
   */
  async sendRewardMail(receiverAddress: string, title: string, content: string, reward: {
    gold?: number;
    exp?: number;
    items?: Array<{ itemId: number; count: number }>;
  }) {
    const attachments = JSON.stringify({
      gold: reward.gold,
      exp: reward.exp,
      items: reward.items || [],
    });

    return this.sendMail({
      receiverAddress,
      senderAddress: 'system',
      title,
      content,
      type: MAIL_TYPES.ATTACHMENT,
      attachments,
    });
  }

  // ============ 格式化 ============

  private formatMail(mail: any) {
    return {
      // C# MailInfo 字段 (驼峰)
      MailID: mail.id,
      UserName: mail.receiver_address,
      ReadTag: mail.is_read || 0,
      MailType: mail.type || 1,
      Title: mail.title || '',
      MailFrom: mail.sender_name || mail.sender_address || '',
      Text: mail.content || '',
      DateTime: mail.created_at || '',
      // 额外字段 (兼容)
      id: mail.id,
      title: mail.title,
      content: mail.content,
      sender: mail.sender_address,
      senderName: mail.sender_name,
      type: mail.type,
      isRead: mail.is_read === 1,
      hasAttachment: mail.has_attachment === 1,
      attachments: mail.attachments ? JSON.parse(mail.attachments) : null,
      createdAt: mail.created_at,
      readAt: mail.read_at,
    };
  }
}

export const mailService = {
  create(db: D1Database) {
    return new MailService(db);
  },

  async getMailList(db: D1Database, walletAddress: string, options?: any) {
    const service = new MailService(db);
    return service.getMailList(walletAddress, options);
  },

  async getUnreadCount(db: D1Database, walletAddress: string) {
    const service = new MailService(db);
    return service.getUnreadCount(walletAddress);
  },

  async getMailById(db: D1Database, walletAddress: string, mailId: number) {
    const service = new MailService(db);
    return service.getMailById(walletAddress, mailId);
  },

  async sendMail(db: D1Database, options: any) {
    const service = new MailService(db);
    return service.sendMail(options);
  },

  async sendBulkMail(db: D1Database, receiverAddresses: string[], title: string, content: string, type?: number) {
    const service = new MailService(db);
    return service.sendBulkMail(receiverAddresses, title, content, type);
  },

  async markAsRead(db: D1Database, walletAddress: string, mailId: number) {
    const service = new MailService(db);
    return service.markAsRead(walletAddress, mailId);
  },

  async markAllAsRead(db: D1Database, walletAddress: string) {
    const service = new MailService(db);
    return service.markAllAsRead(walletAddress);
  },

  async deleteMail(db: D1Database, walletAddress: string, mailId: number) {
    const service = new MailService(db);
    return service.deleteMail(walletAddress, mailId);
  },

  async claimAttachment(db: D1Database, walletAddress: string, mailId: number) {
    const service = new MailService(db);
    return service.claimAttachment(walletAddress, mailId);
  },

  async sendRewardMail(db: D1Database, receiverAddress: string, title: string, content: string, reward: any) {
    const service = new MailService(db);
    return service.sendRewardMail(receiverAddress, title, content, reward);
  },

  async sendSystemAnnouncement(db: D1Database, title: string, content: string, priority?: number) {
    const service = new MailService(db);
    return service.sendSystemAnnouncement(title, content, priority);
  },
};

export default mailService;
