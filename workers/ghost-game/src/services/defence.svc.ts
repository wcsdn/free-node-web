/**
 * Defence Service - 城防建筑业务逻辑层
 * 从 jx/BLL/DefenceBuilding.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Defence, ServiceResult } from '../types/models';
import { defenceRepo } from '../repositories';

export const defenceService = {
  /** 获取城防建筑列表 */
  async getList(db: D1Database, cityId: number): Promise<ServiceResult<Defence[]>> {
    try {
      const defences = await defenceRepo.findByCity(db, cityId);
      return { ok: true, data: defences };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取城防建筑详情 */
  async getDetail(db: D1Database, defenceId: number): Promise<ServiceResult<Defence>> {
    try {
      const defence = await defenceRepo.findById(db, defenceId);
      if (!defence) return { ok: false, error: 'Defence not found', status: 404 };
      return { ok: true, data: defence };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 升级城防 */
  async upgrade(db: D1Database, defenceId: number): Promise<ServiceResult<Defence>> {
    try {
      const defence = await defenceRepo.levelUp(db, defenceId);
      if (!defence) return { ok: false, error: 'Upgrade failed', status: 400 };
      return { ok: true, data: defence };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 修复城防 */
  async repair(db: D1Database, defenceId: number): Promise<ServiceResult<void>> {
    try {
      const success = await defenceRepo.repair(db, defenceId);
      if (!success) return { ok: false, error: 'Repair failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取城防总防御力 */
  async getTotalDefence(db: D1Database, cityId: number): Promise<ServiceResult<number>> {
    try {
      const total = await defenceRepo.getTotalDefence(db, cityId);
      return { ok: true, data: total };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
