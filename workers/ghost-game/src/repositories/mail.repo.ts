/**
 * Mail Repository - 邮件数据访问层
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface Mail {
  id: number;
  wallet_address: string;
  sender: string;
  title: string;
  content: string;
  has_attachment: number;
  attachment_items?: string;
  attachment_gold?: number;
  read: number;
  created_at: string;
}

export interface MailCreate {
  wallet_address: string;
  sender: string;
  title: string;
  content: string;
  has_attachment?: number;
  attachment_items?: string;
  attachment_gold?: number;
}

export const mailRepo = {
  /**
   * 根据 ID 查找邮件
   */
  async findById(db: D1Database, mailId: number): Promise<Mail | null> {
    const result = await db.prepare(`
      SELECT * FROM mails WHERE id = ?
    `).bind(mailId).first();
    return result as unknown as Mail | null;
  },

  /**
   * 根据钱包地址获取邮件列表
   */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Mail[]> {
    const result = await db.prepare(`
      SELECT * FROM mails WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Mail[];
  },

  /**
   * 获取未读邮件数量
   */
  async getUnreadCount(db: D1Database, walletAddress: string): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM mails WHERE wallet_address = ? AND read = 0
    `).bind(walletAddress).first() as { count: number };
    return result.count;
  },

  /**
   * 创建新邮件
   */
  async create(db: D1Database, data: MailCreate): Promise<Mail> {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO mails (wallet_address, sender, title, content, has_attachment, attachment_items, attachment_gold, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).bind(
      data.wallet_address,
      data.sender,
      data.title,
      data.content,
      data.has_attachment ?? 0,
      data.attachment_items ?? null,
      data.attachment_gold ?? 0,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id) as Promise<Mail>;
  },

  /**
   * 标记邮件为已读
   */
  async markAsRead(db: D1Database, mailId: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE mails SET read = 1 WHERE id = ?
    `).bind(mailId).run();
    return result.success;
  },

  /**
   * 批量标记为已读
   */
  async markAllAsRead(db: D1Database, walletAddress: string): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE mails SET read = 1 WHERE wallet_address = ?
    `).bind(walletAddress).run();
    return result.success;
  },

  /**
   * 删除邮件
   */
  async delete(db: D1Database, mailId: number): Promise<boolean> {
    const result = await db.prepare(`DELETE FROM mails WHERE id = ?`).bind(mailId).run();
    return result.success;
  },

  /**
   * 获取最后插入 ID
   */
  async getLastInsertId(db: D1Database): Promise<number> {
    const r = await db.prepare('SELECT last_insert_rowid() as id').first() as { id: number };
    return r.id;
  },
};
