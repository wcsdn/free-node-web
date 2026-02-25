/**
 * Organize System Extensions - 军团系统扩展
 * 从 jx/BLL/OrganizeEx.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 军团职位
export const ORGANIZE_ROLES = {
  LEADER: { id: 1, name: '团长', permission: 7 },
  OFFICER: { id: 2, name: '副团长', permission: 3 },
  ELITE: { id: 3, name: '精英', permission: 1 },
  MEMBER: { id: 4, name: '成员', permission: 0 },
};

// 军团等级配置
export const ORGANIZE_LEVEL_CONFIG = {
  MAX_LEVEL: 10,
  MEMBER_LIMITS: [20, 40, 60, 80, 100, 120, 150, 180, 200, 250],
  UPGRADE_COSTS: [10000, 20000, 40000, 80000, 160000, 320000, 640000, 1280000, 2560000],
};

// 军团贡献配置
export const CONTRIBUTE_CONFIG = {
  DAILY_LIMIT: 1000,
  GOLD_TO_CONTRIBUTION: 100, // 1金币=100贡献
  RES_CONTRIBUTION: {
    gold: 10,
    food: 10,
    wood: 10,
    iron: 10,
  },
};

// 军团商店配置
export const ORGANIZE_SHOP_CONFIG = {
  ITEMS: [
    { id: 1, name: '稀有英雄碎片', cost: 5000, type: 'hero_fragment' },
    { id: 2, name: '紫色装备', cost: 3000, type: 'equipment' },
    { id: 3, name: '技能书', cost: 2000, type: 'skill_book' },
    { id: 4, name: '突破材料', cost: 1500, type: 'breakthrough' },
  ],
  REFRESH_COST: 100,
  DAILY_LIMIT: 5,
};

// 军团技能配置
export const ORGANIZE_SKILLS = {
  1: { name: '军团攻击', levelMax: 10, effect: 'atk_bonus', baseEffect: 0.05 },
  2: { name: '军团防御', levelMax: 10, effect: 'def_bonus', baseEffect: 0.05 },
  3: { name: '军团生命', levelMax: 10, effect: 'hp_bonus', baseEffect: 0.1 },
  4: { name: '资源产量', levelMax: 10, effect: 'resource_bonus', baseEffect: 0.1 },
};

export class OrganizeServiceExtension {
  private db: D1Database;
  constructor(db: D1Database) { this.db = db; }

  // ==================== 军团基础 ====================

  /** 创建军团 */
  async createOrganize(walletAddress: string, name: string, intro: string) {
    // 检查是否已有军团
    const existing: any = await this.db.prepare(`
      SELECT id FROM user_organize WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existing) {
      return { success: false, error: '您已加入军团' };
    }

    // 检查军团名是否重复
    const nameCheck: any = await this.db.prepare(`
      SELECT id FROM organizations WHERE name = ?
    `).bind(name).first();

    if (nameCheck) {
      return { success: false, error: '军团名已存在' };
    }

    const cost = ORGANIZE_LEVEL_CONFIG.UPGRADE_COSTS[0];
    const user: any = await this.db.prepare(`SELECT gold FROM users WHERE wallet_address = ?`).bind(walletAddress).first();

    if ((user as any).gold < cost) {
      return { success: false, error: `创建军团需要 ${cost} 金币` };
    }

    try {
      // 扣金币
      await this.db.prepare(`UPDATE users SET gold = gold - ? WHERE wallet_address = ?`).bind(cost, walletAddress).run();

      // 创建军团
      const result: any = await this.db.prepare(`
        INSERT INTO organizations (name, intro, leader_wallet, level, member_limit, created_at)
        VALUES (?, ?, ?, 1, ?, datetime('now'))
      `).bind(name, intro, walletAddress, ORGANIZE_LEVEL_CONFIG.MEMBER_LIMITS[0]).run();

      const orgId = result.meta.last_row_id;

      // 创建成员
      await this.db.prepare(`
        INSERT INTO user_organize (wallet_address, org_id, role, contribution, joined_at)
        VALUES (?, ?, ?, 0, datetime('now'))
      `).bind(walletAddress, orgId, ORGANIZE_ROLES.LEADER.id).run();

      return {
        success: true,
        orgId,
        name,
        level: 1,
        role: ORGANIZE_ROLES.LEADER.name,
        message: `军团 "${name}" 创建成功！`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /** 申请加入军团 */
  async applyJoin(walletAddress: string, orgName: string) {
    const org: any = await this.db.prepare(`SELECT id, name FROM organizations WHERE name = ?`).bind(orgName).first();
    if (!org) {
      return { success: false, error: '军团不存在' };
    }

    // 检查是否已有军团或申请
    const existing: any = await this.db.prepare(`
      SELECT id, org_id FROM user_organize WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existing) {
      return { success: false, error: '您已加入军团' };
    }

    const pending: any = await this.db.prepare(`
      SELECT id FROM org_applications WHERE wallet_address = ? AND org_id = ?
    `).bind(walletAddress, org.id).first();

    if (pending) {
      return { success: false, error: '您已申请过该军团' };
    }

    await this.db.prepare(`
      INSERT INTO org_applications (wallet_address, org_id, applied_at)
      VALUES (?, ?, datetime('now'))
    `).bind(walletAddress, org.id).run();

    return { success: true, orgId: org.id, message: '申请已提交' };
  }

  /** 审批申请 */
  async approveApplication(walletAddress: string, applicantWallet: string, approve: boolean) {
    const org: any = await this.db.prepare(`
      SELECT o.id, o.name, u.role 
      FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ? AND u.role <= ?
    `).bind(walletAddress, ORGANIZE_ROLES.OFFICER.id).first();

    if (!org) {
      return { success: false, error: '无权审批' };
    }

    const application: any = await this.db.prepare(`
      SELECT * FROM org_applications WHERE wallet_address = ? AND org_id = ?
    `).bind(applicantWallet, org.id).first();

    if (!application) {
      return { success: false, error: '申请不存在' };
    }

    if (approve) {
      // 检查成员数
      const count: any = await this.db.prepare(`
        SELECT COUNT(*) as count FROM user_organize WHERE org_id = ?
      `).bind(org.id).first();

      const orgInfo: any = await this.db.prepare(`SELECT member_limit FROM organizations WHERE id = ?`).bind(org.id).first();
      if ((count as any).count >= (orgInfo as any).member_limit) {
        return { success: false, error: '军团已满员' };
      }

      await this.db.prepare(`
        INSERT INTO user_organize (wallet_address, org_id, role, contribution, joined_at)
        VALUES (?, ?, ?, 0, datetime('now'))
      `).bind(applicantWallet, org.id, ORGANIZE_ROLES.MEMBER.id).run();

      // 发送邮件通知
      await this.db.prepare(`
        INSERT INTO mails (wallet_address, type, title, content, created_at)
        VALUES (?, 1, '军团申请通过', '恭喜，您已加入军团！', datetime('now'))
      `).bind(applicantWallet).run();
    }

    await this.db.prepare(`DELETE FROM org_applications WHERE wallet_address = ? AND org_id = ?`)
      .bind(applicantWallet, org.id).run();

    return { success: true, approved: approve, message: approve ? '已批准' : '已拒绝' };
  }

  /** 任命职位 */
  async setRole(walletAddress: string, targetWallet: string, roleId: number) {
    const org: any = await this.db.prepare(`
      SELECT o.id FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ? AND u.role = ?
    `).bind(walletAddress, ORGANIZE_ROLES.LEADER.id).first();

    if (!org) {
      return { success: false, error: '只有团长可以任命' };
    }

    await this.db.prepare(`
      UPDATE user_organize SET role = ? WHERE wallet_address = ? AND org_id = ?
    `).bind(roleId, targetWallet, org.id).run();

    return { success: true, role: ORGANIZE_ROLES[Object.keys(ORGANIZE_ROLES).find(k => ORGANIZE_ROLES[k as keyof typeof ORGANIZE_ROLES].id === roleId) as keyof typeof ORGANIZE_ROLES]?.name };
  }

  /** 踢出成员 */
  async kickMember(walletAddress: string, targetWallet: string) {
    const org: any = await this.db.prepare(`
      SELECT o.id, u.role FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ? AND u.role <= ?
    `).bind(walletAddress, ORGANIZE_ROLES.OFFICER.id).first();

    if (!org) {
      return { success: false, error: '无权踢人' };
    }

    await this.db.prepare(`
      DELETE FROM user_organize WHERE wallet_address = ? AND org_id = ?
    `).bind(targetWallet, org.id).run();

    return { success: true, message: '成员已踢出' };
  }

  /** 退出军团 */
  async quitOrganize(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT id, role, org_id FROM user_organize WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return { success: false, error: '您未加入军团' };
    }

    if ((member as any).role === ORGANIZE_ROLES.LEADER.id) {
      return { success: false, error: '团长不能直接退出，请先转让或解散军团' };
    }

    await this.db.prepare(`DELETE FROM user_organize WHERE wallet_address = ?`).bind(walletAddress).run();

    return { success: true, message: '已退出军团' };
  }

  /** 解散军团 */
  async disbandOrganize(walletAddress: string) {
    const org: any = await this.db.prepare(`
      SELECT id FROM organizations WHERE leader_wallet = ?
    `).bind(walletAddress).first();

    if (!org) {
      return { success: false, error: '您不是团长' };
    }

    const memberCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_organize WHERE org_id = ?
    `).bind(org.id).first();

    if ((memberCount as any).count > 1) {
      return { success: false, error: '军团还有成员，无法解散' };
    }

    await this.db.prepare(`DELETE FROM organizations WHERE id = ?`).bind(org.id).run();
    await this.db.prepare(`DELETE FROM user_organize WHERE org_id = ?`).bind(org.id).run();

    return { success: true, message: '军团已解散' };
  }

  // ==================== 军团信息 ====================

  /** 获取我的军团信息 */
  async getMyOrganize(walletAddress: string) {
    const org: any = await this.db.prepare(`
      SELECT o.*, u.role, u.contribution, u.joined_at
      FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ?
    `).bind(walletAddress).first();

    if (!org) {
      return { success: false, error: '未加入军团' };
    }

    const memberCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_organize WHERE org_id = ?
    `).bind(org.id).first();

    return {
      success: true,
      organize: {
        id: org.id,
        name: org.name,
        intro: org.intro,
        level: org.level,
        memberCount: (memberCount as any).count,
        memberLimit: org.member_limit,
        leader: org.leader_wallet,
        contribution: org.total_contribution,
        notice: org.notice,
        createdAt: org.created_at,
      },
      role: org.role,
      roleName: Object.values(ORGANIZE_ROLES).find(r => r.id === org.role)?.name,
      myContribution: org.contribution,
    };
  }

  /** 获取军团列表 */
  async getOrganizeList(page: number = 1, pageSize: number = 10, keyword?: string) {
    let query = `
      SELECT o.*, 
        (SELECT COUNT(*) FROM user_organize WHERE org_id = o.id) as member_count,
        (SELECT wallet_address FROM user_organize WHERE org_id = o.id AND role = 1) as leader_wallet
      FROM organizations o
    `;
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE o.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY o.total_contribution DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const list: any = await this.db.prepare(query).bind(...params).all();

    const total: any = await this.db.prepare(`SELECT COUNT(*) as count FROM organizations`).first();

    return {
      success: true,
      list: (list.results || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        level: o.level,
        memberCount: o.member_count,
        memberLimit: o.member_limit,
        intro: o.intro,
        contribution: o.total_contribution,
        leader: o.leader_wallet,
      })),
      pagination: {
        page,
        pageSize,
        total: (total as any).count,
        totalPages: Math.ceil((total as any).count / pageSize),
      },
    };
  }

  /** 获取成员列表 */
  async getMemberList(walletAddress: string) {
    const org: any = await this.db.prepare(`
      SELECT o.id FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ?
    `).bind(walletAddress).first();

    if (!org) {
      return { success: false, error: '未加入军团' };
    }

    const members: any = await this.db.prepare(`
      SELECT u.wallet_address, u.role, u.contribution, u.joined_at, u.last_active,
             p.level, p.nickname
      FROM user_organize u
      LEFT JOIN users p ON u.wallet_address = p.wallet_address
      WHERE u.org_id = ?
      ORDER BY u.role ASC, u.contribution DESC
    `).bind(org.id).all();

    return {
      success: true,
      members: (members.results || []).map((m: any) => ({
        wallet: m.wallet_address,
        role: m.role,
        roleName: Object.values(ORGANIZE_ROLES).find(r => r.id === m.role)?.name,
        contribution: m.contribution,
        level: m.level,
        nickname: m.nickname,
        joinedAt: m.joined_at,
        lastActive: m.last_active,
      })),
    };
  }

  // ==================== 军团贡献 ====================

  /** 贡献资源 */
  async contribute(walletAddress: string, resType: string, amount: number) {
    const org: any = await this.db.prepare(`
      SELECT o.id FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ?
    `).bind(walletAddress).first();

    if (!org) {
      return { success: false, error: '未加入军团' };
    }

    const contribution = CONTRIBUTE_CONFIG.RES_CONTRIBUTION[resType as keyof typeof CONTRIBUTE_CONFIG.RES_CONTRIBUTION] * amount;
    
    // 扣资源（简化：扣金币）
    await this.db.prepare(`
      UPDATE users SET gold = gold - ? WHERE wallet_address = ?
    `).bind(amount, walletAddress).run();

    await this.db.prepare(`
      UPDATE user_organize SET contribution = contribution + ? WHERE wallet_address = ? AND org_id = ?
    `).bind(contribution, walletAddress, org.id).run();

    await this.db.prepare(`
      UPDATE organizations SET total_contribution = total_contribution + ? WHERE id = ?
    `).bind(contribution, org.id).run();

    return {
      success: true,
      contributed: contribution,
      message: `贡献 ${amount} ${resType}，获得 ${contribution} 贡献度`,
    };
  }

  // ==================== 军团商店 ====================

  /** 获取商店列表 */
  async getShopList(walletAddress: string) {
    const org: any = await this.db.prepare(`
      SELECT o.level FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ?
    `).bind(walletAddress).first();

    if (!org) {
      return { success: false, error: '未加入军团' };
    }

    return {
      success: true,
      items: ORGANIZE_SHOP_CONFIG.ITEMS,
      contribution: org.level * 1000, // 简化：取贡献
    };
  }

  /** 购买商店物品 */
  async buyShopItem(walletAddress: string, itemId: number) {
    const item = ORGANIZE_SHOP_CONFIG.ITEMS.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: '物品不存在' };
    }

    const org: any = await this.db.prepare(`
      SELECT o.id, u.contribution FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ?
    `).bind(walletAddress).first();

    if (!org) {
      return { success: false, error: '未加入军团' };
    }

    if ((org as any).contribution < item.cost) {
      return { success: false, error: '贡献度不足' };
    }

    await this.db.prepare(`
      UPDATE user_organize SET contribution = contribution - ? WHERE wallet_address = ?
    `).bind(item.cost, walletAddress).run();

    // 发放物品
    await this.db.prepare(`
      INSERT INTO user_items (wallet_address, item_id, count, created_at)
      VALUES (?, ?, 1, datetime('now'))
    `).bind(walletAddress, item.id).run();

    return {
      success: true,
      item: item.name,
      cost: item.cost,
      message: `消耗 ${item.cost} 贡献度，获得 ${item.name}`,
    };
  }

  // ==================== 军团公告 ====================

  /** 修改公告 */
  async setNotice(walletAddress: string, notice: string) {
    const org: any = await this.db.prepare(`
      SELECT o.id FROM organizations o
      JOIN user_organize u ON o.id = u.org_id
      WHERE u.wallet_address = ? AND u.role <= ?
    `).bind(walletAddress, ORGANIZE_ROLES.OFFICER.id).first();

    if (!org) {
      return { success: false, error: '无权修改公告' };
    }

    await this.db.prepare(`UPDATE organizations SET notice = ? WHERE id = ?`).bind(notice, org.id).run();

    return { success: true, message: '公告已更新' };
  }
}
