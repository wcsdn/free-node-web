/**
 * Organize Repository - 军团数据访问层
 * 参考原版 jx/DAL/OrganizeAccess.cs (1,480 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Organize extends BaseEntity {
  id: number;
  name: string;
  leader_wallet: string;
  level: number;
  member_count: number;
  max_members: number;
  exp: number;
  gold: number;
  notice: string;
  icon: number;
  auto_accept: number;
  required_level: number;
  required_quality: number;
  combat_power: number;
  city_id: number;
  create_time: string;
}

export interface OrganizeMember extends BaseEntity {
  id: number;
  organize_id: number;
  wallet_address: string;
  role: number;
  contribution: number;
  total_contribution: number;
  join_time: string;
  last_active: string;
}

export interface OrganizeConfig {
  id: number;
  level: number;
  max_members: number;
  upgrade_exp: number;
  icon: string;
}

export class OrganizeRepository extends BaseRepository<Organize> {
  constructor(db: D1Database) {
    super(db, 'organizations');
  }

  // ==================== 查询操作 ====================

  /** 根据军团ID查询 */
  async findByIdSimple(id: number): Promise<Organize | null> {
    return await this.db.prepare(`SELECT * FROM organizations WHERE id = ?`).bind(id).first<Organize>();
  }

  /** 根据军团名称模糊查询 */
  async findByName(name: string): Promise<Organize[]> {
    return await this.db.prepare(
      `SELECT * FROM organizations WHERE name LIKE ?`
    ).bind(`%${name}%`).all<Organize>().then(r => (r.results as Organize[]) || []);
  }

  /** 获取军团排行榜 */
  async getRanking(limit: number = 100): Promise<Organize[]> {
    const result = await this.db.prepare(
      `SELECT * FROM organizations ORDER BY level DESC, exp DESC LIMIT ?`
    ).bind(limit).all<Organize>();
    return (result.results as Organize[]) || [];
  }

  /** 检查军团名是否存在 */
  async existsByName(name: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT 1 FROM organizations WHERE name = ? LIMIT 1`
    ).bind(name).first();
    return result !== null;
  }

  // ==================== 写入操作 ====================

  /** 创建军团 */
  async create(walletAddress: string, name: string, icon: number = 1): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO organizations (
        name, leader_wallet, level, member_count, max_members,
        exp, gold, notice, icon, auto_accept, required_level, required_quality,
        combat_power, city_id, create_time, created_at, updated_at
      ) VALUES (?, ?, 1, 1, 50, 0, 0, '欢迎加入！', ?, 0, 1, 0, 0, 0, datetime('now'), datetime('now'), datetime('now'))
    `).bind(name, walletAddress, icon).run();

    // 创建军团长成员记录
    const memberRepo = new OrganizeMemberRepository(this.db);
    await memberRepo.create(result.meta.last_row_id, walletAddress, 1); // role 1 = 团长

    return result.meta.last_row_id;
  }

  /** 更新军团信息 */
  async updateInfo(organizeId: number, data: {
    notice?: string;
    icon?: number;
    autoAccept?: number;
    requiredLevel?: number;
    requiredQuality?: number;
  }): Promise<void> {
    const clauses = Object.keys(data)
      .filter(key => data[key as keyof typeof data] !== undefined)
      .map(key => {
        const field = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${field} = ?`;
      })
      .join(', ');

    if (!clauses) return;

    const values = Object.values(data).filter(v => v !== undefined);
    
    await this.db.prepare(
      `UPDATE organizations SET ${clauses}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, organizeId).run();
  }

  /** 增加经验 */
  async addExp(organizeId: number, expToAdd: number): Promise<{
    newExp: number;
    newLevel: number;
    levelUp: boolean;
  }> {
    const org = await this.findByIdSimple(organizeId);
    if (!org) return { newExp: 0, newLevel: 1, levelUp: false };

    const newExp = org.exp + expToAdd;
    const newLevel = this.calculateLevel(newExp);
    const levelUp = newLevel > org.level;

    await this.db.prepare(`
      UPDATE organizations SET exp = ?, level = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newExp, newLevel, organizeId).run();

    // 更新最大成员数
    if (levelUp) {
      const config = await this.getConfig(newLevel);
      if (config) {
        await this.db.prepare(
          `UPDATE organizations SET max_members = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(config.max_members, organizeId).run();
      }
    }

    return { newExp, newLevel, levelUp };
  }

  /** 增加资金 */
  async addGold(organizeId: number, amount: number): Promise<void> {
    await this.db.prepare(
      `UPDATE organizations SET gold = gold + ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(amount, organizeId).run();
  }

  /** 设置军团长 */
  async setLeader(organizeId: number, newLeaderWallet: string): Promise<void> {
    await this.db.prepare(
      `UPDATE organizations SET leader_wallet = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(newLeaderWallet, organizeId).run();
  }

  /** 解散军团 */
  async dissolve(organizeId: number): Promise<boolean> {
    const memberRepo = new OrganizeMemberRepository(this.db);
    await memberRepo.deleteByOrganize(organizeId);
    
    const result = await this.delete(organizeId);
    return result;
  }

  // ==================== 配置查询 ====================

  /** 获取军团配置 */
  async getConfig(level: number): Promise<OrganizeConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM organizations_config WHERE level = ?`
    ).bind(level).first<OrganizeConfig>();
  }

  // ==================== 辅助方法 ====================

  /** 根据经验计算等级 */
  private calculateLevel(exp: number): number {
    let level = 1;
    let requiredExp = 1000;
    
    while (exp >= requiredExp && level < 100) {
      exp -= requiredExp;
      level++;
      requiredExp = 1000 * Math.pow(1.5, level - 1);
    }
    
    return Math.min(level, 100);
  }
}

/**
 * OrganizeMember Repository - 军团成员数据访问层
 */
export class OrganizeMemberRepository extends BaseRepository<OrganizeMember> {
  constructor(db: D1Database) {
    super(db, 'organize_members');
  }

  // ==================== 查询操作 ====================

  /** 根据军团ID查询所有成员 */
  async findByOrganizeId(organizeId: number): Promise<OrganizeMember[]> {
    return await this.where({ organize_id: organizeId });
  }

  /** 根据钱包地址查询成员信息 */
  async findByWallet(walletAddress: string): Promise<OrganizeMember | null> {
    return await this.where({ wallet_address: walletAddress }).then(members => members[0] || null);
  }

  /** 获取军团成员数量 */
  async getMemberCount(organizeId: number): Promise<number> {
    return await this.count({ organize_id: organizeId });
  }

  /** 根据角色查询成员 */
  async findByRole(organizeId: number, role: number): Promise<OrganizeMember[]> {
    return await this.db.prepare(
      `SELECT * FROM organize_members WHERE organize_id = ? AND role = ?`
    ).bind(organizeId, role).all<OrganizeMember>().then(r => (r.results as OrganizeMember[]) || []);
  }

  /** 获取贡献排行榜 */
  async getContributionRanking(organizeId: number, limit: number = 10): Promise<OrganizeMember[]> {
    const result = await this.db.prepare(
      `SELECT * FROM organize_members WHERE organize_id = ? ORDER BY contribution DESC LIMIT ?`
    ).bind(organizeId, limit).all<OrganizeMember>();
    return (result.results as OrganizeMember[]) || [];
  }

  // ==================== 写入操作 ====================

  /** 创建成员 */
  async create(organizeId: number, walletAddress: string, role: number = 4): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO organize_members (
        organize_id, wallet_address, role, contribution, total_contribution,
        join_time, last_active, created_at, updated_at
      ) VALUES (?, ?, 0, 0, 0, datetime('now'), datetime('now'), datetime('now'), datetime('now'))
    `).bind(organizeId, walletAddress, role).run();

    // 更新军团成员数
    await this.db.prepare(
      `UPDATE organizations SET member_count = member_count + 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(organizeId).run();

    return result.meta.last_row_id;
  }

  /** 更新角色 */
  async updateRole(memberId: number, role: number): Promise<void> {
    await this.db.prepare(
      `UPDATE organize_members SET role = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(role, memberId).run();
  }

  /** 增加贡献 */
  async addContribution(memberId: number, amount: number): Promise<void> {
    await this.db.prepare(`
      UPDATE organize_members SET contribution = contribution + ?, total_contribution = total_contribution + ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(amount, amount, memberId).run();
  }

  /** 消耗贡献 */
  async consumeContribution(memberId: number, amount: number): Promise<boolean> {
    const member = await this.findById(memberId);
    if (!member || member.contribution < amount) return false;

    await this.db.prepare(`
      UPDATE organize_members SET contribution = contribution - ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(amount, memberId).run();

    return true;
  }

  /** 更新最后活跃时间 */
  async updateLastActive(memberId: number): Promise<void> {
    await this.db.prepare(
      `UPDATE organize_members SET last_active = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    ).bind(memberId).run();
  }

  /** 退出军团 */
  async quit(organizeId: number, walletAddress: string): Promise<boolean> {
    const member = await this.findByWallet(walletAddress);
    if (!member) return false;

    const result = await this.delete(member.id);
    
    // 更新军团成员数
    await this.db.prepare(
      `UPDATE organizations SET member_count = member_count - 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(organizeId).run();

    return result;
  }

  /** 踢出成员 */
  async kick(organizeId: number, memberId: number): Promise<boolean> {
    const result = await this.delete(memberId);
    
    if (result) {
      await this.db.prepare(
        `UPDATE organizations SET member_count = member_count - 1, updated_at = datetime('now') WHERE id = ?`
      ).bind(organizeId).run();
    }

    return result;
  }

  /** 删除军团所有成员 */
  async deleteByOrganize(organizeId: number): Promise<number> {
    const result = await this.db.prepare(
      `DELETE FROM organize_members WHERE organize_id = ?`
    ).bind(organizeId).run();
    return result.meta.changes;
  }

  // ==================== 统计查询 ====================

  /** 获取成员今日贡献 */
  async getTodayContribution(memberId: number): Promise<number> {
    const result = await this.db.prepare(`
      SELECT SUM(contribution) as total FROM organize_logs 
      WHERE member_id = ? AND created_at >= date('now', 'start of day')
    `).bind(memberId).first<{ total: number }>();
    return result?.total || 0;
  }
}
