/**
 * Technic Service - 科技业务逻辑层
 * 从 jx/BLL/Technic.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../types/models';
import { Technic, technicRepo } from '../repositories';

// 科技配置
export const TECHNIC_CONFIG = {
  MAX_LEVEL: 20,
  BASE_COST: 100,
  COST_MULTIPLIER: 1.5,
};

export const technicService = {
  /** 获取科技列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<Technic[]>> {
    try {
      const technics = await technicRepo.findByWallet(db, walletAddress);
      return { ok: true, data: technics };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取科技详情 */
  async getDetail(db: D1Database, technicId: number): Promise<ServiceResult<Technic>> {
    try {
      const technic = await technicRepo.findById(db, technicId);
      if (!technic) return { ok: false, error: 'Technic not found', status: 404 };
      return { ok: true, data: technic };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 解锁科技 */
  async unlock(
    db: D1Database,
    walletAddress: string,
    technicId: number
  ): Promise<ServiceResult<Technic>> {
    try {
      // 检查是否已拥有
      const existing = await technicRepo.findByWallet(db, walletAddress);
      const hasTechnic = existing.some(t => t.technic_id === technicId);
      if (hasTechnic) {
        return { ok: false, error: 'Already have this technic', status: 400 };
      }

      // 创建科技记录
      const newId = await technicRepo.create(db, {
        wallet_address: walletAddress,
        technic_id: technicId,
        technic_level: 1,
        technic_point: 0,
      } as Technic);

      // 获取创建的科技
      const technic = await technicRepo.findById(db, newId);
      if (!technic) {
        return { ok: false, error: 'Failed to create technic', status: 500 };
      }

      return { ok: true, data: technic };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 升级科技 */
  async upgrade(db: D1Database, technicId: number): Promise<ServiceResult<Technic>> {
    try {
      const technic = await technicRepo.levelUp(db, technicId);
      if (!technic) return { ok: false, error: 'Upgrade failed', status: 400 };
      return { ok: true, data: technic };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 增加科技点数 */
  async addPoint(db: D1Database, technicId: number, points: number): Promise<ServiceResult<void>> {
    try {
      const success = await technicRepo.addPoint(db, technicId, points);
      if (!success) return { ok: false, error: 'Add point failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
