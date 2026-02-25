/**
 * Mail System Extensions - 邮件系统扩展
 * 从 jx/BLL/MailEx.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

export const MAIL_SYSTEM_CONFIG = {
  MAX_ATTACHMENTS: 5,
  RETENTION_DAYS: 30,
  BATCH_SIZE: 20,
};

export class MailServiceExtension {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  /** 发送系统邮件 */
  async sendSystemMail(walletAddress: string, title: string, content: string, attachments?: any[]) {
    try {
      const result = await this.db.prepare(`
        INSERT INTO mails (wallet_address, type, title, content, attachments, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
      `).bind(walletAddress, 1, title, content, attachments ? JSON.stringify(attachments) : null).run();

      return { success: true, mailId: result.meta.last_row_id };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /** 批量发送邮件 */
  async batchSendMail(wallets: string[], title: string, content: string, attachments?: any[]) {
    let successCount = 0;
    for (const wallet of wallets) {
      const result = await this.sendSystemMail(wallet, title, content, attachments);
      if (result.success) successCount++;
    }
    return { success: true, total: wallets.length, sent: successCount };
  }

  /** 领取附件 */
  async claimAttachment(walletAddress: string, mailId: number) {
    const mail: any = await this.db.prepare(`
      SELECT * FROM mails WHERE id = ? AND wallet_address = ? AND attachments IS NOT NULL
    `).bind(mailId, walletAddress).first();

    if (!mail) return { success: false, error: '邮件不存在或无附件' };
    if (mail.claimed) return { success: false, error: '附件已领取' };

    const attachments = JSON.parse(mail.attachments || '[]');
    const claimed: any[] = [];

    for (const att of attachments) {
      if (att.type === 'gold') {
        await this.db.prepare(`UPDATE users SET gold = gold + ? WHERE wallet_address = ?`)
          .bind(att.amount, walletAddress).run();
      } else if (att.type === 'item') {
        const existing: any = await this.db.prepare(`SELECT id FROM user_items WHERE wallet_address = ? AND item_id = ?`)
          .bind(walletAddress, att.itemId).first();
        if (existing) {
          await this.db.prepare(`UPDATE user_items SET count = count + ? WHERE id = ?`).bind(att.count, existing.id).run();
        } else {
          await this.db.prepare(`INSERT INTO user_items (wallet_address, item_id, count) VALUES (?, ?, ?)`)
            .bind(walletAddress, att.itemId, att.count).run();
        }
      }
      claimed.push(att);
    }

    await this.db.prepare(`UPDATE mails SET attachments = NULL, claimed = 1 WHERE id = ?`).bind(mailId).run();

    return { success: true, mailId, claimed };
  }

  /** 一键领取所有 */
  async claimAll(walletAddress: string) {
    const mails: any = await this.db.prepare(`
      SELECT id FROM mails WHERE wallet_address = ? AND attachments IS NOT NULL AND claimed = 0
    `).bind(walletAddress).all();

    let totalClaimed = 0;
    for (const mail of (mails.results || [])) {
      const result = await this.claimAttachment(walletAddress, mail.id);
      if (result.success) totalClaimed++;
    }

    return { success: true, claimedCount: totalClaimed };
  }

  /** 删除邮件 */
  async deleteMail(walletAddress: string, mailId: number) {
    await this.db.prepare(`DELETE FROM mails WHERE id = ? AND wallet_address = ?`).bind(mailId, walletAddress).run();
    return { success: true, mailId };
  }
}
