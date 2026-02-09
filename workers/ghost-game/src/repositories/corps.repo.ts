/**
 * Corps Repository - 军团数据访问层
 * 从 jx/DALEX/CorpsExAccess.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Corps, CorpsMember, CorpsApply } from '../types/models';

export const corpsRepo = {
  // ============ Corps ============
  /** 根据 ID 查找军团 */
  async findById(db: D1Database, corpsId: number): Promise<Corps | null> {
    const result = await db.prepare(`
      SELECT * FROM corps_system WHERE id = ?
    `).bind(corpsId).first();
    return result as unknown as Corps | null;
  },

  /** 根据名称查找军团 */
  async findByName(db: D1Database, name: string): Promise<Corps | null> {
    const result = await db.prepare(`
      SELECT * FROM corps_system WHERE name = ?
    `).bind(name).first();
    return result as unknown as Corps | null;
  },

  /** 获取所有军团列表 */
  async findAll(db: D1Database, limit = 100): Promise<Corps[]> {
    const result = await db.prepare(`
      SELECT id, name, leader_id, city_id, level, exp, state, notice, member_count, created_at
      FROM corps_system ORDER BY member_count DESC LIMIT ?
    `).bind(limit).all();
    
    const results = result.results || [];
    // 确保返回的是简单对象
    return results.map((r: any) => ({
      id: r.id,
      name: r.name,
      leader_id: r.leader_id,
      city_id: r.city_id,
      level: r.level,
      exp: r.exp,
      state: r.state,
      notice: r.notice,
      member_count: r.member_count,
      created_at: r.created_at,
    })) as unknown as Corps[];
  },

  /** 创建军团 */
  async create(db: D1Database, data: Corps): Promise<Corps | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO corps_system (name, leader_id, city_id, notice, member_count, level, exp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.leader_id,
      data.city_id ?? 0,
      data.notice ?? '欢迎加入军团',
      data.member_count ?? 1,
      data.level ?? 1,
      data.exp ?? 0,
      now
    ).run();

    const id = await this.getLastInsertId(db);
    return this.findById(db, id);
  },

  /** 更新军团信息 */
  async update(db: D1Database, corpsId: number, data: Partial<Corps>): Promise<boolean> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.notice !== undefined) { updates.push('notice = ?'); values.push(data.notice); }
    if (data.level !== undefined) { updates.push('level = ?'); values.push(data.level); }
    if (data.exp !== undefined) { updates.push('exp = ?'); values.push(data.exp); }
    if (data.member_count !== undefined) { updates.push('member_count = ?'); values.push(data.member_count); }

    if (updates.length === 0) return false;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(corpsId);

    const result = await db.prepare(`
      UPDATE corps_system SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();
    return result.success;
  },

  /** 增加成员数量 */
  async incrementMemberCount(db: D1Database, corpsId: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE corps_system SET member_count = member_count + 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), corpsId).run();
    return result.success;
  },

  /** 减少成员数量 */
  async decrementMemberCount(db: D1Database, corpsId: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE corps_system SET member_count = member_count - 1, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), corpsId).run();
    return result.success;
  },

  // ============ CorpsMember ============
  /** 根据 ID 查找成员 */
  async findMemberById(db: D1Database, memberId: number): Promise<CorpsMember | null> {
    const result = await db.prepare(`
      SELECT * FROM corps_members WHERE id = ?
    `).bind(memberId).first();
    return result as unknown as CorpsMember | null;
  },

  /** 根据钱包地址查找成员 */
  async findMemberByWallet(db: D1Database, walletAddress: string): Promise<CorpsMember | null> {
    const result = await db.prepare(`
      SELECT * FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return result as unknown as CorpsMember | null;
  },

  /** 根据军团 ID 获取成员列表 */
  async findMembersByCorpsId(db: D1Database, corpsId: number): Promise<CorpsMember[]> {
    const result = await db.prepare(`
      SELECT * FROM corps_members WHERE corps_id = ? ORDER BY position, joined_at
    `).bind(corpsId).all();
    return (result.results || []) as unknown as CorpsMember[];
  },

  /** 添加成员 */
  async addMember(db: D1Database, data: CorpsMember): Promise<CorpsMember | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO corps_members (corps_id, wallet_address, name, position, contribution, joined_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(
      data.corps_id,
      data.wallet_address,
      data.name,
      data.position, // 1: leader, 2: deputy, 3: member
      now
    ).run();

    const id = await this.getMemberLastInsertId(db);
    return this.findMemberById(db, id);
  },

  /** 更新成员信息 */
  async updateMember(db: D1Database, memberId: number, data: Partial<CorpsMember>): Promise<boolean> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.position !== undefined) { updates.push('position = ?'); values.push(data.position); }
    if (data.contribution !== undefined) { updates.push('contribution = ?'); values.push(data.contribution); }

    if (updates.length === 0) return false;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(memberId);

    const result = await db.prepare(`
      UPDATE corps_members SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();
    return result.success;
  },

  /** 移除成员 */
  async removeMember(db: D1Database, memberId: number): Promise<boolean> {
    const result = await db.prepare(`
      DELETE FROM corps_members WHERE id = ?
    `).bind(memberId).run();
    return result.success;
  },

  // ============ CorpsApply ============
  /** 根据军团 ID 获取申请列表 */
  async findAppliesByCorpsId(db: D1Database, corpsId: number): Promise<CorpsApply[]> {
    const result = await db.prepare(`
      SELECT * FROM corps_applies WHERE corps_id = ? AND status = 0 ORDER BY created_at
    `).bind(corpsId).all();
    return (result.results || []) as unknown as CorpsApply[];
  },

  /** 根据钱包地址获取申请 */
  async findApplyByWallet(db: D1Database, walletAddress: string): Promise<CorpsApply | null> {
    const result = await db.prepare(`
      SELECT * FROM corps_applies WHERE wallet_address = ? AND status = 0
    `).bind(walletAddress).first();
    return result as unknown as CorpsApply | null;
  },

  /** 创建申请 */
  async createApply(db: D1Database, data: CorpsApply): Promise<CorpsApply | null> {
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO corps_applies (corps_id, wallet_address, message, status, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).bind(
      data.corps_id,
      data.wallet_address,
      data.message ?? '',
      now
    ).run();

    const id = await this.getApplyLastInsertId(db);
    return { id, ...data, status: 0, created_at: now } as CorpsApply;
  },

  /** 更新申请状态 */
  async updateApplyStatus(db: D1Database, applyId: number, status: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE corps_applies SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, new Date().toISOString(), applyId).run();
    return result.success;
  },

  /** 获取最后插入 ID */
  async getLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },

  async getMemberLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },

  async getApplyLastInsertId(db: D1Database): Promise<number> {
    const result = await db.prepare(`
      SELECT last_insert_rowid() as id
    `).first() as { id: number };
    return result.id;
  },
};
