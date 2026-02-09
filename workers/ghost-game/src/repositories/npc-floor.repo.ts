/**
 * NPCFloor Repository - NPC副本数据访问层
 * 从 jx/DALEX/NPCFloorAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { NPCFloor } from '../types/models';

export const npcFloorRepo = {
  /** 获取所有副本关卡 */
  async findAll(db: D1Database): Promise<NPCFloor[]> {
    const result = await db.prepare(`
      SELECT * FROM npc_floors ORDER BY floor
    `).all();
    return (result.results || []) as unknown as NPCFloor[];
  },

  /** 根据 ID 查找副本 */
  async findById(db: D1Database, floorId: number): Promise<NPCFloor | null> {
    const result = await db.prepare(`
      SELECT * FROM npc_floors WHERE id = ?
    `).bind(floorId).first();
    return result as unknown as NPCFloor | null;
  },

  /** 根据关卡数查找副本 */
  async findByFloor(db: D1Database, floor: number): Promise<NPCFloor | null> {
    const result = await db.prepare(`
      SELECT * FROM npc_floors WHERE floor = ?
    `).bind(floor).first();
    return result as unknown as NPCFloor | null;
  },
};
