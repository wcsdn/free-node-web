/**
 * Mail Service - 邮件业务逻辑层
 * 从 jx/BLL/Mail.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Mail, ServiceResult } from '../types/models';
import { mailRepo } from '../repositories';

export const mailService = {
  /** 获取邮件列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<Mail[]>> {
    try {
      const mails = await mailRepo.findByWallet(db, walletAddress);
      return { ok: true, data: mails };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取邮件详情 */
  async getDetail(db: D1Database, mailId: number): Promise<ServiceResult<Mail>> {
    try {
      const mail = await mailRepo.findById(db, mailId);
      if (!mail) return { ok: false, error: 'Mail not found', status: 404 };
      return { ok: true, data: mail };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取未读邮件数量 */
  async getUnreadCount(db: D1Database, walletAddress: string): Promise<ServiceResult<number>> {
    try {
      const count = await mailRepo.countUnread(db, walletAddress);
      return { ok: true, data: count };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 发送系统邮件 */
  async sendSystemMail(
    db: D1Database,
    walletAddress: string,
    title: string,
    content: string,
    attachment?: string
  ): Promise<ServiceResult<Mail>> {
    try {
      const mail = await mailRepo.create(db, {
        wallet_address: walletAddress,
        title,
        content,
        type: 1, // 系统邮件
        has_attachment: attachment ? 1 : 0,
        attachment: attachment ?? '',
      });

      return { ok: true, data: mail! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 标记已读 */
  async markAsRead(db: D1Database, mailId: number): Promise<ServiceResult<void>> {
    try {
      const success = await mailRepo.markAsRead(db, mailId);
      if (!success) return { ok: false, error: 'Mark read failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 删除邮件 */
  async delete(db: D1Database, mailId: number): Promise<ServiceResult<void>> {
    try {
      const success = await mailRepo.delete(db, mailId);
      if (!success) return { ok: false, error: 'Delete failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
