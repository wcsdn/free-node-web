/**
 * Corps Service - 军团业务逻辑层
 * 从 jx/BLL/Corps.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../types/models';

export const corpsService = {
  /** 获取军团列表 */
  async getList(db: D1Database, limit = 100): Promise<ServiceResult<any[]>> {
    try {
      const result = await db.prepare(`
        SELECT id, name, leader_id, city_id, level, exp, state, notice, member_count, created_at
        FROM corps_system ORDER BY member_count DESC LIMIT ?
      `).bind(limit).all();
      
      const corps: any[] = [];
      if (result.results) {
        for (const row of result.results) {
          corps.push({
            id: Number(row.id),
            name: String(row.name || ''),
            leaderId: String(row.leader_id || ''),
            cityId: Number(row.city_id || 0),
            level: Number(row.level || 1),
            exp: Number(row.exp || 0),
            state: Number(row.state || 0),
            notice: String(row.notice || ''),
            memberCount: Number(row.member_count || 0),
            createdAt: String(row.created_at || ''),
          });
        }
      }
      
      return { ok: true, data: corps };
    } catch (error) {
      console.error('getList error:', error);
      return { ok: false, error: 'Database query failed', status: 500 };
    }
  },

  /** 获取军团详情 */
  async getDetail(db: D1Database, corpsId: number): Promise<ServiceResult<any>> {
    try {
      const result = await db.prepare(`
        SELECT id, name, leader_id, city_id, level, exp, state, notice, member_count, created_at
        FROM corps_system WHERE id = ?
      `).bind(corpsId).first();
      
      if (!result) {
        return { ok: false, error: 'Corps not found', status: 404 };
      }
      
      const corps = {
        id: Number(result.id),
        name: String(result.name || ''),
        leaderId: String(result.leader_id || ''),
        cityId: Number(result.city_id || 0),
        level: Number(result.level || 1),
        exp: Number(result.exp || 0),
        state: Number(result.state || 0),
        notice: String(result.notice || ''),
        memberCount: Number(result.member_count || 0),
        createdAt: String(result.created_at || ''),
      };
      
      // 获取成员列表
      const membersResult = await db.prepare(`
        SELECT id, corps_id, wallet_address, role, contribution, joined_at
        FROM corps_members WHERE corps_id = ? ORDER BY role, joined_at
      `).bind(corpsId).all();
      
      const members: any[] = [];
      if (membersResult.results) {
        for (const m of membersResult.results) {
          members.push({
            id: Number(m.id),
            corpsId: Number(m.corps_id),
            walletAddress: String(m.wallet_address || ''),
            role: String(m.role || 'member'),
            contribution: Number(m.contribution || 0),
            joinedAt: String(m.joined_at || ''),
          });
        }
      }
      
      return { ok: true, data: { corps, members } };
    } catch (error) {
      console.error('getDetail error:', error);
      return { ok: false, error: 'Database query failed', status: 500 };
    }
  },

  /** 创建军团 */
  async create(db: D1Database, walletAddress: string, name: string, notice?: string): Promise<ServiceResult<any>> {
    try {
      const now = new Date().toISOString();
      
      await db.prepare(`
        INSERT INTO corps_system (name, leader_id, city_id, level, exp, state, notice, member_count, created_at)
        VALUES (?, ?, 0, 1, 0, 0, ?, 1, ?)
      `).bind(name, walletAddress, notice || '欢迎加入军团', now).run();

      const idResult = await db.prepare('SELECT last_insert_rowid() as id').first();
      const id = Number(idResult.id);
      
      return { ok: true, data: { id, name, leaderId: walletAddress, notice: notice || '欢迎加入军团' } };
    } catch (error) {
      console.error('create error:', error);
      return { ok: false, error: 'Failed to create corps', status: 500 };
    }
  },

  /** 申请加入军团 */
  async apply(db: D1Database, walletAddress: string, corpsId: number, message?: string): Promise<ServiceResult<void>> {
    try {
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: 'Failed to apply', status: 500 };
    }
  },

  /** 离开军团 */
  async leave(db: D1Database, walletAddress: string): Promise<ServiceResult<void>> {
    try {
      const result = await db.prepare(`
        DELETE FROM corps_members WHERE wallet_address = ?
      `).bind(walletAddress).run();
      
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: 'Failed to leave corps', status: 500 };
    }
  },

  /** 获取我的军团信息 */
  async getMyCorps(db: D1Database, walletAddress: string): Promise<ServiceResult<any>> {
    try {
      const memberResult = await db.prepare(`
        SELECT cm.*, cs.name, cs.leader_id
        FROM corps_members cm
        LEFT JOIN corps_system cs ON cm.corps_id = cs.id
        WHERE cm.wallet_address = ?
      `).bind(walletAddress).first();
      
      if (!memberResult) {
        return { ok: true, data: null };
      }
      
      const membersResult = await db.prepare(`
        SELECT id, corps_id, wallet_address, role, contribution, joined_at
        FROM corps_members WHERE corps_id = ?
      `).bind(Number(memberResult.corps_id)).all();
      
      const members: any[] = [];
      if (membersResult.results) {
        for (const m of membersResult.results) {
          members.push({
            id: Number(m.id),
            walletAddress: String(m.wallet_address || ''),
            role: String(m.role || 'member'),
            contribution: Number(m.contribution || 0),
          });
        }
      }
      
      return {
        ok: true,
        data: {
          corps: {
            id: Number(memberResult.corps_id),
            name: String(memberResult.name || ''),
            leaderId: String(memberResult.leader_id || ''),
            memberCount: members.length,
          },
          members,
        }
      };
    } catch (error) {
      console.error('getMyCorps error:', error);
      return { ok: false, error: 'Database query failed', status: 500 };
    }
  },
};
