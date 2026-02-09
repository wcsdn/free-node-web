/**
 * Mail Repository - 邮件数据访问层
 * 从 jx/DALEX/MailExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Mail, MailCreate } from '../types/models';

export const mailRepo = {
  /** 根据 ID 查找邮件 */
  async findById(db: D1Database, mailId: number): Promise<Mail | null> {
    const result = await db.prepare(`
      SELECT * FROM mails WHERE id = ?
    `).bind(mailId).first();
    return result as unknown as Mail | null;
  },

  /** 根据钱包地址获取邮件列表 */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Mail[]> {
    const result = await db.prepare(`
      SELECT * FROM mails WHERE wallet_address = ? ORDER BY created_at DESC
    `).bind(walletAddress).all();
    return (result.results || []) as unknown as Mail[];
  },

  /** 获取未读邮件数量 */
  async countUnread(db: D1Database, walletAddress: string): Promise<number> {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM mails WHERE wallet_address = ? AND is_read = 0
    `).bind(walletAddress).first() as { count: number };
    return result.count;
  },

  /** 创建邮件 */
  async create(db: D1Database, data: MailCreate): Promise<Mail | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO mails (wallet_address, title, content, type, is_read, has_attachment, attachment, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.title,
      data.content,
      data.type ?? 0,
      data.has_attachment ?? 0,
      data.attachment ?? '',
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 标记已读 */
  async markAsRead(db: D1Database, mailId: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE mails SET is_read = 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), mailId).run();
    return result.success;
  },

  /** 删除邮件 */
  async delete(db: D1Database, mailId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM mails WHERE id = ?
    `).bind(mailId).run();
    return result.success;
  },

  /** 获取最后插入 ID */
  async getLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },
};
