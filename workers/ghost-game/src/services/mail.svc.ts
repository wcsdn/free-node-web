/**
 * Mail Service - 邮件业务逻辑层
 * 原则：处理业务规则，调用 Repository 层
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../models';
import { mailRepo, type Mail, type MailCreate } from '../repositories/mail.repo';
import { characterRepo } from '../repositories/character.repo';

export const mailService = {
  /**
   * 获取用户邮件列表
   */
  async getMails(db: D1Database, walletAddress: string): Promise<ServiceResult<Mail[]>> {
    try {
      const mails = await mailRepo.findByWallet(db, walletAddress);
      return { ok: true, data: mails };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取未读邮件数量
   */
  async getUnreadCount(db: D1Database, walletAddress: string): Promise<ServiceResult<number>> {
    try {
      const count = await mailRepo.getUnreadCount(db, walletAddress);
      return { ok: true, data: count };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 发送系统邮件
   */
  async sendSystemMail(
    db: D1Database,
    targetWallet: string,
    title: string,
    content: string,
    attachment?: { gold?: number; items?: Array<{ id: number; count: number }> }
  ): Promise<ServiceResult<Mail>> {
    try {
      const mailData: MailCreate = {
        wallet_address: targetWallet,
        sender: 'SYSTEM',
        title,
        content,
        has_attachment: attachment ? 1 : 0,
        attachment_gold: attachment?.gold ?? 0,
        attachment_items: attachment?.items ? JSON.stringify(attachment.items) : undefined,
      };

      const mail = await mailRepo.create(db, mailData);
      return { ok: true, data: mail };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 发送奖励邮件（战斗奖励、成就奖励等）
   */
  async sendRewardMail(
    db: D1Database,
    targetWallet: string,
    rewardTitle: string,
    rewardContent: string,
    gold?: number,
    items?: Array<{ id: number; count: number }>
  ): Promise<ServiceResult<Mail>> {
    return this.sendSystemMail(db, targetWallet, rewardTitle, rewardContent, { gold, items });
  },

  /**
   * 阅读邮件
   */
  async readMail(db: D1Database, mailId: number, walletAddress: string): Promise<ServiceResult<{ mail: Mail; attachmentGold?: number; attachmentItems?: any }>> {
    try {
      const mail = await mailRepo.findById(db, mailId);
      if (!mail) {
        return { ok: false, error: '邮件不存在', status: 404 };
      }

      // 验证邮件属于该用户
      if (mail.wallet_address !== walletAddress) {
        return { ok: false, error: '无权访问此邮件', status: 403 };
      }

      // 如果未读，标记为已读
      if (mail.read === 0) {
        await mailRepo.markAsRead(db, mailId);
      }

      // 处理附件
      let attachmentGold: number | undefined;
      let attachmentItems: any;

      if (mail.has_attachment) {
        // 领取金币
        if (mail.attachment_gold && mail.attachment_gold > 0) {
          attachmentGold = mail.attachment_gold;
          await characterRepo.addGold(db, walletAddress, mail.attachment_gold);
        }

        // 解析物品附件
        if (mail.attachment_items) {
          try {
            attachmentItems = JSON.parse(mail.attachment_items);
          } catch {
            attachmentItems = null;
          }
        }
      }

      return {
        ok: true,
        data: {
          mail: { ...mail, read: 1 },
          attachmentGold,
          attachmentItems,
        },
      };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 批量标记为已读
   */
  async markAllAsRead(db: D1Database, walletAddress: string): Promise<ServiceResult<{ count: number }>> {
    try {
      const mails = await mailRepo.findByWallet(db, walletAddress);
      const unreadMails = mails.filter(m => m.read === 0);

      for (const mail of unreadMails) {
        await mailRepo.markAsRead(db, mail.id);
      }

      return { ok: true, data: { count: unreadMails.length } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 删除邮件
   */
  async deleteMail(db: D1Database, mailId: number, walletAddress: string): Promise<ServiceResult<null>> {
    try {
      const mail = await mailRepo.findById(db, mailId);
      if (!mail) {
        return { ok: false, error: '邮件不存在', status: 404 };
      }

      if (mail.wallet_address !== walletAddress) {
        return { ok: false, error: '无权删除此邮件', status: 403 };
      }

      await mailRepo.delete(db, mailId);
      return { ok: true, data: null };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
