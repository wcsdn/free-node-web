/**
 * Building Service - 建筑业务逻辑层
 * 从 jx/BLL/Building.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Building, BuildingConfig, ServiceResult } from '../types/models';
import { buildingRepo } from '../repositories';

export const buildingService = {
  /** 获取城市建筑列表 */
  async getByCity(db: D1Database, cityId: number): Promise<ServiceResult<Building[]>> {
    try {
      const buildings = await buildingRepo.findByCity(db, cityId);
      return { ok: true, data: buildings };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取建筑详情 */
  async getDetail(db: D1Database, buildingId: number): Promise<ServiceResult<Building>> {
    try {
      const building = await buildingRepo.findById(db, buildingId);
      if (!building) return { ok: false, error: 'Building not found', status: 404 };
      return { ok: true, data: building };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取建筑配置 */
  async getConfig(db: D1Database, configId: number): Promise<ServiceResult<BuildingConfig>> {
    try {
      const config = await buildingRepo.getConfig(db, configId);
      if (!config) return { ok: false, error: 'Config not found', status: 404 };
      return { ok: true, data: config };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 升级建筑 */
  async upgrade(
    db: D1Database,
    buildingId: number,
    walletAddress: string
  ): Promise<ServiceResult<Building>> {
    try {
      const building = await buildingRepo.findById(db, buildingId);
      if (!building) return { ok: false, error: 'Building not found', status: 404 };

      const newLevel = (building.level ?? 0) + 1;
      const success = await buildingRepo.upgrade(db, buildingId, newLevel);
      
      if (!success) return { ok: false, error: 'Upgrade failed', status: 400 };
      
      const updated = await buildingRepo.findById(db, buildingId);
      return { ok: true, data: updated! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 拆除建筑 */
  async demolish(db: D1Database, buildingId: number): Promise<ServiceResult<void>> {
    try {
      const success = await buildingRepo.delete(db, buildingId);
      if (!success) return { ok: false, error: 'Demolish failed', status: 400 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
