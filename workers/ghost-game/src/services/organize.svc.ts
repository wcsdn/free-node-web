/**
 * Organize Service - 军团基础服务
 * 从 jx/BLL/Organize.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 军团职位
export const ORGANIZE_ROLES = {
  LEADER: { id: 1, name: '团长', permission: 7 },
  OFFICER: { id: 2, name: '副团长', permission: 3 },
  ELITE: { id: 3, name: '精英', permission: 1 },
  MEMBER: { id: 4, name: '成员', permission: 0 },
};

// 帮会配置
export const ORGANIZE_CONFIG = {
  MIN_LEVEL: 5,              // 创建帮会最低等级
  CREATE_COST: 10000,         // 创建帮会消耗金币
  MAX_MEMBERS: 50,           // 最大成员数
  MAX_NAME_LENGTH: 10,       // 最大名称长度
  MIN_NAME_LENGTH: 2,        // 最小名称长度
  UPGRADE_COST: [0, 50000, 100000, 200000, 500000], // 升级消耗
  LEVEL_MEMBERS: [10, 20, 30, 40, 50], // 各等级最大成员数
};

// 科技树配置
export const TECH_TREE = {
  1: { name: '资源生产', levels: 10, cost: [1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000] },
  2: { name: '训练速度', levels: 10, cost: [1500, 3000, 6000, 12000, 24000, 48000, 96000, 192000, 384000, 768000] },
  3: { name: '研究加成', levels: 10, cost: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000] },
  4: { name: '建筑速度', levels: 10, cost: [1200, 2400, 4800, 9600, 19200, 38400, 76800, 153600, 307200, 614400] },
};

export class OrganizeService {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  /**
   * 创建帮会
   */
  async create(walletAddress: string, orgName: string, intro: string = '') {
    // 验证名称
    if (orgName.length < ORGANIZE_CONFIG.MIN_NAME_LENGTH || orgName.length > ORGANIZE_CONFIG.MAX_NAME_LENGTH) {
      return { success: false, error: '帮会名称长度不符' };
    }

    // 检查名称是否已存在
    const existing = await this.db.prepare(`
      SELECT id FROM organizes WHERE name = ?
    `).bind(orgName).first();

    if (existing) {
      return { success: false, error: '帮会名称已存在' };
    }

    // 检查用户是否已有帮会
    const inOrg = await this.db.prepare(`
      SELECT id FROM organize_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (inOrg) {
      return { success: false, error: '您已有帮会' };
    }

    // 创建帮会
    const result = await this.db.prepare(`
      INSERT INTO organizes (name, intro, leader_address, level, member_count, max_members, created_at)
      VALUES (?, ?, ?, 1, 1, ?, datetime('now'))
    `).bind(orgName, intro, walletAddress, ORGANIZE_CONFIG.LEVEL_MEMBERS[0]).run();

    const orgId = result.meta.last_row_id;

    // 添加创建者为团长
    await this.db.prepare(`
      INSERT INTO organize_members (organize_id, wallet_address, role, contribution, joined_at)
      VALUES (?, ?, ?, 0, datetime('now'))
    `).bind(orgId, walletAddress, ORGANIZE_ROLES.LEADER.id).run();

    return { success: true, organizeId: orgId, name: orgName };
  }

  /**
   * 申请加入帮会
   */
  async applyJoin(walletAddress: string, orgName: string) {
    // 检查帮会是否存在
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE name = ?
    `).bind(orgName).first();

    if (!org) {
      return { success: false, error: '帮会不存在' };
    }

    // 检查是否已在帮会中
    const inOrg = await this.db.prepare(`
      SELECT id FROM organize_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (inOrg) {
      return { success: false, error: '您已有帮会' };
    }

    // 检查是否已申请
    const applied = await this.db.prepare(`
      SELECT id FROM organize_applications WHERE wallet_address = ? AND organize_id = ?
    `).bind(walletAddress, org.id).first();

    if (applied) {
      return { success: false, error: '已申请过该帮会' };
    }

    // 创建申请
    await this.db.prepare(`
      INSERT INTO organize_applications (organize_id, wallet_address, status, applied_at)
      VALUES (?, ?, 0, datetime('now'))
    `).bind(org.id, walletAddress).run();

    return { success: true, message: '申请已提交' };
  }

  /**
   * 审批加入申请
   */
  async approveJoin(leaderAddress: string, orgName: string, applicantAddress: string, approved: boolean) {
    // 验证权限
    const leader: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE name = ? AND leader_address = ?
    `).bind(orgName, leaderAddress).first();

    if (!leader) {
      return { success: false, error: '只有帮主可以审批' };
    }

    // 查找申请
    const application: any = await this.db.prepare(`
      SELECT * FROM organize_applications WHERE wallet_address = ? AND organize_id = ? AND status = 0
    `).bind(applicantAddress, leader.id).first();

    if (!application) {
      return { success: false, error: '申请不存在' };
    }

    if (approved) {
      // 检查成员数是否已满
      if (leader.member_count >= leader.max_members) {
        await this.db.prepare(`
          UPDATE organize_applications SET status = 2 WHERE id = ?
        `).bind(application.id).run();
        return { success: false, error: '帮会成员已满' };
      }

      // 添加成员
      await this.db.prepare(`
        INSERT INTO organize_members (organize_id, wallet_address, role, contribution, joined_at)
        VALUES (?, ?, ?, 0, datetime('now'))
      `).bind(leader.id, applicantAddress, ORGANIZE_ROLES.MEMBER.id).run();

      // 更新帮会成员数
      await this.db.prepare(`
        UPDATE organizes SET member_count = member_count + 1 WHERE id = ?
      `).bind(leader.id).run();

      // 更新申请状态
      await this.db.prepare(`
        UPDATE organize_applications SET status = 1 WHERE id = ?
      `).bind(application.id).run();

      return { success: true, message: '已批准加入' };
    } else {
      // 拒绝申请
      await this.db.prepare(`
        UPDATE organize_applications SET status = 2 WHERE id = ?
      `).bind(application.id).run();

      return { success: true, message: '已拒绝加入' };
    }
  }

  /**
   * 任命职位
   */
  async setRole(leaderAddress: string, orgName: string, targetAddress: string, roleId: number) {
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE name = ? AND leader_address = ?
    `).bind(orgName, leaderAddress).first();

    if (!org) {
      return { success: false, error: '只有帮主可以任命职位' };
    }

    // 更新职位
    await this.db.prepare(`
      UPDATE organize_members SET role = ? WHERE organize_id = ? AND wallet_address = ?
    `).bind(roleId, org.id, targetAddress).run();

    return { success: true, message: '职位已更新' };
  }

  /**
   * 踢出成员
   */
  async kickMember(leaderAddress: string, orgName: string, targetAddress: string) {
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE name = ? AND leader_address = ?
    `).bind(orgName, leaderAddress).first();

    if (!org) {
      return { success: false, error: '只有帮主可以踢人' };
    }

    // 不能踢自己
    if (targetAddress === leaderAddress) {
      return { success: false, error: '不能踢自己' };
    }

    // 移除成员
    await this.db.prepare(`
      DELETE FROM organize_members WHERE organize_id = ? AND wallet_address = ?
    `).bind(org.id, targetAddress).run();

    // 更新成员数
    await this.db.prepare(`
      UPDATE organizes SET member_count = member_count - 1 WHERE id = ?
    `).bind(org.id).run();

    return { success: true, message: '成员已踢出' };
  }

  /**
   * 退出帮会
   */
  async quit(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT * FROM organize_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return { success: false, error: '您没有帮会' };
    }

    // 获取帮会信息
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE id = ?
    `).bind(member.organize_id).first();

    // 如果是帮主，不能直接退出
    if (org.leader_address === walletAddress) {
      return { success: false, error: '帮主不能退出，请先转让帮主' };
    }

    // 移除成员
    await this.db.prepare(`
      DELETE FROM organize_members WHERE wallet_address = ?
    `).bind(walletAddress).run();

    // 更新成员数
    await this.db.prepare(`
      UPDATE organizes SET member_count = member_count - 1 WHERE id = ?
    `).bind(org.id).run();

    return { success: true, message: '已退出帮会' };
  }

  /**
   * 解散帮会
   */
  async disband(leaderAddress: string, orgName: string) {
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE name = ? AND leader_address = ?
    `).bind(orgName, leaderAddress).first();

    if (!org) {
      return { success: false, error: '只有帮主可以解散帮会' };
    }

    // 删除所有成员
    await this.db.prepare(`
      DELETE FROM organize_members WHERE organize_id = ?
    `).bind(org.id).run();

    // 删除申请
    await this.db.prepare(`
      DELETE FROM organize_applications WHERE organize_id = ?
    `).bind(org.id).run();

    // 删除帮会
    await this.db.prepare(`
      DELETE FROM organizes WHERE id = ?
    `).bind(org.id).run();

    return { success: true, message: '帮会已解散' };
  }

  /**
   * 获取帮会信息
   */
  async getInfo(orgName: string) {
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE name = ?
    `).bind(orgName).first();

    if (!org) {
      return null;
    }

    // 获取成员列表
    const members: any = await this.db.prepare(`
      SELECT om.*, c.name as member_name
      FROM organize_members om
      LEFT JOIN characters c ON om.wallet_address = c.wallet_address
      WHERE om.organize_id = ?
    `).bind(org.id).all();

    return { ...org, members: members.results || [] };
  }

  /**
   * 获取我的帮会信息
   */
  async getMyOrg(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT om.*, o.name as org_name, o.intro, o.level as org_level, o.leader_address
      FROM organize_members om
      JOIN organizes o ON om.organize_id = o.id
      WHERE om.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return null;
    }

    return member;
  }

  /**
   * 获取帮会列表
   */
  async getList(page: number = 1, pageSize: number = 20, keyword?: string) {
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM organizes';
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE name LIKE ?';
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY level DESC, member_count DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const total: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM organizes
    `).first();

    return {
      organizes: result.results || [],
      total: (total as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 帮会升级
   */
  async upgrade(leaderAddress: string) {
    const org: any = await this.db.prepare(`
      SELECT * FROM organizes WHERE leader_address = ?
    `).bind(leaderAddress).first();

    if (!org) {
      return { success: false, error: '您不是帮主' };
    }

    if (org.level >= ORGANIZE_CONFIG.LEVEL_MEMBERS.length) {
      return { success: false, error: '帮会已达最高等级' };
    }

    const upgradeCost = ORGANIZE_CONFIG.UPGRADE_COST[org.level];
    // 这里应该检查用户金币是否足够，简化处理

    // 升级
    await this.db.prepare(`
      UPDATE organizes SET level = level + 1, max_members = ? WHERE id = ?
    `).bind(ORGANIZE_CONFIG.LEVEL_MEMBERS[org.level], org.id).run();

    return { success: true, message: '帮会升级成功' };
  }

  /**
   * 科技研究
   */
  async researchTech(walletAddress: string, techId: number, level: number) {
    const member = await this.getMyOrg(walletAddress);
    if (!member) {
      return { success: false, error: '您没有帮会' };
    }

    const tech = TECH_TREE[techId as keyof typeof TECH_TREE];
    if (!tech) {
      return { success: false, error: '科技不存在' };
    }

    if (level > tech.levels) {
      return { success: false, error: '科技等级超出上限' };
    }

    const cost = tech.cost[level - 1];
    // 检查贡献度是否足够，简化处理

    // 更新科技等级
    await this.db.prepare(`
      INSERT INTO organize_techs (organize_id, tech_id, level, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(organize_id, tech_id) DO UPDATE SET level = ?
    `).bind(member.organize_id, techId, level, level).run();

    return { success: true, message: '研究成功' };
  }
}

export const organizeService = {
  create(db: D1Database, walletAddress: string, orgName: string, intro?: string) {
    const service = new OrganizeService(db);
    return service.create(walletAddress, orgName, intro);
  },
  applyJoin(db: D1Database, walletAddress: string, orgName: string) {
    const service = new OrganizeService(db);
    return service.applyJoin(walletAddress, orgName);
  },
  approveJoin(db: D1Database, leaderAddress: string, orgName: string, applicantAddress: string, approved: boolean) {
    const service = new OrganizeService(db);
    return service.approveJoin(leaderAddress, orgName, applicantAddress, approved);
  },
  setRole(db: D1Database, leaderAddress: string, orgName: string, targetAddress: string, roleId: number) {
    const service = new OrganizeService(db);
    return service.setRole(leaderAddress, orgName, targetAddress, roleId);
  },
  kickMember(db: D1Database, leaderAddress: string, orgName: string, targetAddress: string) {
    const service = new OrganizeService(db);
    return service.kickMember(leaderAddress, orgName, targetAddress);
  },
  quit(db: D1Database, walletAddress: string) {
    const service = new OrganizeService(db);
    return service.quit(walletAddress);
  },
  disband(db: D1Database, leaderAddress: string, orgName: string) {
    const service = new OrganizeService(db);
    return service.disband(leaderAddress, orgName);
  },
  getInfo(db: D1Database, orgName: string) {
    const service = new OrganizeService(db);
    return service.getInfo(orgName);
  },
  getMyOrg(db: D1Database, walletAddress: string) {
    const service = new OrganizeService(db);
    return service.getMyOrg(walletAddress);
  },
  getList(db: D1Database, page?: number, pageSize?: number, keyword?: string) {
    const service = new OrganizeService(db);
    return service.getList(page, pageSize, keyword);
  },
  upgrade(db: D1Database, leaderAddress: string) {
    const service = new OrganizeService(db);
    return service.upgrade(leaderAddress);
  },
  researchTech(db: D1Database, walletAddress: string, techId: number, level: number) {
    const service = new OrganizeService(db);
    return service.researchTech(walletAddress, techId, level);
  },
};
