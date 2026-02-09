/**
 * Event Service - 活动事件业务逻辑层
 * 从 jx/BLL/Event.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { GameEvent, ServiceResult } from '../types/models';

export const eventService = {
  /** 获取所有活动列表 */
  async getList(db: D1Database): Promise<ServiceResult<GameEvent[]>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM events WHERE is_active = 1 ORDER BY start_time DESC
      `).all();
      
      return { ok: true, data: (result.results || []) as unknown as GameEvent[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取活动详情 */
  async getDetail(db: D1Database, eventId: number): Promise<ServiceResult<GameEvent>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM events WHERE id = ?
      `).bind(eventId).first();
      
      if (!result) return { ok: false, error: 'Event not found', status: 404 };
      
      return { ok: true, data: result as unknown as GameEvent };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取当前有效活动 */
  async getActiveEvents(db: D1Database): Promise<ServiceResult<GameEvent[]>> {
    try {
      const now = new Date().toISOString();
      
      const result = await db.prepare(`
        SELECT * FROM events 
        WHERE is_active = 1 
        AND start_time <= ? 
        AND end_time >= ?
        ORDER BY end_time ASC
      `).bind(now, now).all();
      
      return { ok: true, data: (result.results || []) as unknown as GameEvent[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 检查活动是否有效 */
  async isEventActive(db: D1Database, eventId: number): Promise<boolean> {
    const now = new Date().toISOString();
    
    const result = await db.prepare(`
      SELECT id FROM events 
      WHERE id = ? AND is_active = 1 AND start_time <= ? AND end_time >= ?
    `).bind(eventId, now, now).first();
    
    return !!result;
  },
};
