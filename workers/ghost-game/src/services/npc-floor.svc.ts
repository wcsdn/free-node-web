/**
 * NPCFloor Service - NPC副本业务逻辑层
 * 从 jx/BLL/NPCFloor.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { NPCFloor, ServiceResult } from '../types/models';
import { npcFloorRepo } from '../repositories';

export const npcFloorService = {
  /** 获取所有副本列表 */
  async getList(db: D1Database): Promise<ServiceResult<NPCFloor[]>> {
    try {
      const floors = await npcFloorRepo.findAll(db);
      return { ok: true, data: floors };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取副本详情 */
  async getDetail(db: D1Database, floorId: number): Promise<ServiceResult<NPCFloor>> {
    try {
      const floor = await npcFloorRepo.findById(db, floorId);
      if (!floor) return { ok: false, error: 'Floor not found', status: 404 };
      return { ok: true, data: floor };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 根据关卡获取副本 */
  async getByFloor(db: D1Database, floor: number): Promise<ServiceResult<NPCFloor>> {
    try {
      const npcFloor = await npcFloorRepo.findByFloor(db, floor);
      if (!npcFloor) return { ok: false, error: 'Floor not found', status: 404 };
      return { ok: true, data: npcFloor };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
