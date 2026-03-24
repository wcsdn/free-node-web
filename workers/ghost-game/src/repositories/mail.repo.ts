/**
 * Mail Repository - 邮件数据访问层
 * 参考原版 jx/DAL/MailAccess.cs (273 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Mail extends BaseEntity {
  id: number;
  receiver_address: string;
  sender_address: string;
  type: number;
  title: string;
  content: string;
  has_attachment: number;
  attachment_gold: number;
  attachment_items: string;
  is_read: number;
  is_claim: number;
  expire_time: string;
  created_at: string;
}

export class MailRepository extends BaseRepository<Mail> {
  constructor(db: D1Database) {
    super(db, 'mails');
  }

  // ==================== 查询操作 ====================

  /** 查询用户未读邮件 */
  async findUnread(receiverAddress: string): Promise<Mail[]> {
    return await this.where({ receiver_address: receiverAddress, is_read: 0 });
  }

  /** 查询未领取附件邮件 */
  async findUnclaimed(receiverAddress: string): Promise<Mail[]> {
    return await this.db.prepare(
      `SELECT * FROM mails WHERE receiver_address = ? AND has_attachment = 1 AND is_claim = 0`
    ).bind(receiverAddress).all<Mail>().then(r => (r.results as Mail[]) || []);
  }

  /** 查询过期邮件 */
  async findExpired(receiverAddress: string): Promise<Mail[]> {
    return await this.db.prepare(
      `SELECT * FROM mails WHERE receiver_address = ? AND expire_time <= datetime('now')`
    ).bind(receiverAddress).all<Mail>().then(r => (r.results as Mail[]) || []);
  }

  // ==================== 写入操作 ====================

  /** 发送邮件 */
  async send(receiverAddress: string, data: {
    type: number;
    title: string;
    content: string;
    sender_address?: string;
    attachmentGold?: number;
    attachmentItems?: string;
    expireHours?: number;
  }): Promise<number> {
    const now = new Date();
    const expireTime = data.expireHours 
      ? new Date(now.getTime() + data.expireHours * 3600 * 1000).toISOString()
      : null;

    const result = await this.db.prepare(`
      INSERT INTO mails (
        receiver_address, type, title, content, sender_address, has_attachment,
        attachment_gold, attachment_items, is_read, is_claim, expire_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, datetime('now'), datetime('now'))
    `).bind(
      receiverAddress, data.type, data.title, data.content, 
      data.sender_address || 'system', data.attachmentGold ? 1 : 0,
      data.attachmentGold || 0, data.attachmentItems || '[]', expireTime
    ).run();

    return result.meta.last_row_id;
  }

  /** 批量发送邮件 */
  async bulkSend(receiverAddresses: string[], data: {
    type: number;
    title: string;
    content: string;
    sender_address?: string;
  }): Promise<Map<string, number>> {
    const results = new Map();
    
    for (const wallet of receiverAddresses) {
      const id = await this.send(wallet, data);
      results.set(wallet, id);
    }
    
    return results;
  }

  /** 标记已读 */
  async markRead(mailId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE mails SET is_read = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(mailId).run();
  }

  /** 标记已领取 */
  async markClaimed(mailId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE mails SET is_claim = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(mailId).run();
  }

  /** 领取附件 */
  async claimAttachment(mailId: number): Promise<{
    gold: number;
    items: string;
  } | null> {
    const mail = await this.findById(mailId);
    if (!mail || mail.is_claim) return null;

    await this.markClaimed(mailId);
    return {
      gold: mail.attachment_gold,
      items: mail.attachment_items,
    };
  }

  /** 删除邮件 */
  async deleteMail(mailId: number): Promise<boolean> {
    return await this.delete(mailId);
  }

  /** 删除过期邮件 */
  async cleanupExpired(): Promise<number> {
    const result = await this.db.prepare(
      `DELETE FROM mails WHERE expire_time IS NOT NULL AND expire_time <= datetime('now')`
    ).run();
    return result.meta.changes;
  }

  // ==================== 统计查询 ====================

  /** 获取未读邮件数 */
  async getUnreadCount(receiverAddress: string): Promise<number> {
    return await this.count({ receiver_address: receiverAddress, is_read: 0 });
  }

  /** 获取未领取附件数 */
  async getUnclaimedCount(receiverAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM mails WHERE receiver_address = ? AND has_attachment = 1 AND is_claim = 0
    `).bind(receiverAddress).first<{ count: number }>();
    return result?.count || 0;
  }
}

// 导出便捷使用对象
export const mailRepo = {
  async findByWallet(db: D1Database, walletAddress: string) {
    const repo = new MailRepository(db);
    return repo.findUnread(walletAddress);
  },
  async findById(db: D1Database, id: number) {
    const repo = new MailRepository(db);
    return repo.findById(id);
  },
  async create(db: D1Database, data: Partial<Mail>) {
    const repo = new MailRepository(db);
    return repo.insert(data);
  },
};
