/**
 * Guild Service - 帮派服务层
 * 从 jx/BLL/Corps.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Guild, GuildMember } from '../types/models';

// 帮派等级配置
const GUILD_LEVEL_CONFIG = {
  1: { maxMembers: 50, icon: 'guild_lv1.png' },
  2: { maxMembers: 80, icon: 'guild_lv2.png' },
  3: { maxMembers: 120, icon: 'guild_lv3.png' },
  4: { maxMembers: 160, icon: 'guild_lv4.png' },
  5: { maxMembers: 200, icon: 'guild_lv5.png' },
};

// 捐献配置
const DONATE_CONFIG = {
  gold: { contribution: 10, cost: 100 },      // 100元宝 = 10贡献
  money: { contribution: 1, cost: 10000 },    // 10000铜钱 = 1贡献
  food: { contribution: 1, cost: 10000 },     // 10000粮食 = 1贡献
};

class GuildService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 帮派信息查询 ============

  /**
   * 获取帮派详细信息
   */
  async getGuildInfo(guildId: number) {
    const guild: any = await this.db.prepare(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count,
        (SELECT wallet_address FROM guild_members WHERE guild_id = g.id AND role = 'leader') as leader_address,
        (SELECT name FROM characters WHERE wallet_address = (SELECT wallet_address FROM guild_members WHERE guild_id = g.id AND role = 'leader')) as leader_name
      FROM guilds g WHERE g.id = ?
    `).bind(guildId).first();

    if (!guild) return null;

    return {
      // C# DBOrganize 字段 (驼峰)
      UID: guild.id,
      OrgName: guild.name || '',
      OrgLevel: guild.level || 1,
      OrgState: guild.state || 1,
      Affiche: guild.notice || '',
      Intro: guild.description || '',
      Membership: guild.member_count || 0,
      MaxMembership: GUILD_LEVEL_CONFIG[guild.level as keyof typeof GUILD_LEVEL_CONFIG]?.maxMembers || 50,
      BattleWinNum: guild.battle_wins || 0,
      BattleFailNum: guild.battle_losses || 0,
      // 额外字段 (兼容)
      id: guild.id,
      name: guild.name,
      level: guild.level,
      exp: guild.exp,
      notice: guild.notice,
      insignia: guild.insignia,
      memberCount: guild.member_count,
      leaderAddress: guild.leader_address,
      leaderName: guild.leader_name,
      maxMembers: GUILD_LEVEL_CONFIG[guild.level as keyof typeof GUILD_LEVEL_CONFIG]?.maxMembers || 50,
    };
  }

  /**
   * 获取我的帮派信息
   */
  async getMyGuild(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT gm.*, g.name as guild_name, g.level, g.notice, g.insignia, g.exp, g.state
      FROM guild_members gm
      JOIN guilds g ON gm.guild_id = g.id
      WHERE gm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return null;

    const memberCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?
    `).bind(member.guild_id).first();

    return {
      // C# 字段
      UID: member.guild_id,
      OrgName: member.guild_name || '',
      OrgLevel: member.level || 1,
      OrgState: member.state || 1,
      Membership: (memberCount as any).count || 0,
      // 兼容字段
      guildId: member.guild_id,
      guildName: member.guild_name,
      guildLevel: member.level,
      guildExp: member.exp,
      guildNotice: member.notice,
      guildInsignia: member.insignia,
      role: member.role,
      contribution: member.contribution,
      joinedAt: member.joined_at,
      memberCount: (memberCount as any).count,
    };
  }

  /**
   * 获取帮派成员列表
   */
  async getMemberList(guildId: number, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const members: any = await this.db.prepare(`
      SELECT gm.*, c.name as character_name, c.level as character_level
      FROM guild_members gm
      LEFT JOIN characters c ON gm.wallet_address = c.wallet_address
      WHERE gm.guild_id = ?
      ORDER BY 
        CASE gm.role 
          WHEN 'leader' THEN 1 
          WHEN 'deputy' THEN 2 
          WHEN 'elder' THEN 3 
          ELSE 4 
        END,
        gm.contribution DESC
      LIMIT ? OFFSET ?
    `).bind(guildId, pageSize, offset).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?
    `).bind(guildId).first();

    return {
      members: (members.results || []).map((m: any) => ({
        walletAddress: m.wallet_address,
        characterName: m.character_name,
        characterLevel: m.character_level,
        role: m.role,
        contribution: m.contribution,
        joinedAt: m.joined_at,
      })),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取帮派申请列表
   */
  async getApplyList(guildId: number) {
    const applies: any = await this.db.prepare(`
      SELECT ga.*, c.name as character_name, c.level as character_level
      FROM guild_applies ga
      LEFT JOIN characters c ON ga.wallet_address = c.wallet_address
      WHERE ga.guild_id = ? AND ga.status = 0
      ORDER BY ga.created_at DESC
    `).bind(guildId).all();

    return (applies.results || []).map((a: any) => ({
      walletAddress: a.wallet_address,
      characterName: a.character_name,
      characterLevel: a.character_level,
      message: a.message,
      applyTime: a.created_at,
    }));
  }

  // ============ 帮派操作 ============

  /**
   * 创建帮派
   */
  async createGuild(walletAddress: string, name: string) {
    // 检查是否已有帮派
    const existingMember: any = await this.db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return { success: false, error: '您已加入其他帮派，无法创建' };
    }

    // 检查名称唯一性
    const existingName: any = await this.db.prepare(`
      SELECT id FROM guilds WHERE name = ?
    `).bind(name).first();

    if (existingName) {
      return { success: false, error: '帮派名称已被占用' };
    }

    // 创建帮派
    const result = await this.db.prepare(`
      INSERT INTO guilds (name, leader_address, notice, member_count)
      VALUES (?, ?, '欢迎加入本帮派！', 1)
    `).bind(name, walletAddress).run();

    const guildId = result.meta.last_row_id;

    // 创建者成为帮主
    await this.db.prepare(`
      INSERT INTO guild_members (guild_id, wallet_address, role, contribution)
      VALUES (?, ?, 'leader', 0)
    `).bind(guildId, walletAddress).run();

    return { success: true, guildId };
  }

  /**
   * 申请加入帮派
   */
  async applyJoinGuild(walletAddress: string, guildId: number, message?: string) {
    // 检查是否已有帮派
    const existingMember: any = await this.db.prepare(`
      SELECT guild_id FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return { success: false, error: '您已加入帮派，无法申请' };
    }

    // 检查是否已有申请
    const existingApply: any = await this.db.prepare(`
      SELECT id FROM guild_applies 
      WHERE wallet_address = ? AND guild_id = ? AND status = 0
    `).bind(walletAddress, guildId).first();

    if (existingApply) {
      return { success: false, error: '您已提交过申请，请等待审核' };
    }

    // 创建申请
    await this.db.prepare(`
      INSERT INTO guild_applies (guild_id, wallet_address, message, status)
      VALUES (?, ?, ?, 0)
    `).bind(guildId, walletAddress, message || '').run();

    return { success: true };
  }

  /**
   * 处理入帮申请
   */
  async handleApply(walletAddress: string, applyWallet: string, guildId: number, approved: boolean) {
    // 检查权限（帮主或副帮主）
    const member: any = await this.db.prepare(`
      SELECT role FROM guild_members 
      WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!member || (member.role !== 'leader' && member.role !== 'deputy')) {
      return { success: false, error: '权限不足' };
    }

    // 检查帮派人数
    const guild: any = await this.db.prepare(`
      SELECT g.*, (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count
      FROM guilds g WHERE g.id = ?
    `).bind(guildId).first();

    const maxMembers = GUILD_LEVEL_CONFIG[guild.level as keyof typeof GUILD_LEVEL_CONFIG]?.maxMembers || 50;
    if ((guild as any).member_count >= maxMembers) {
      return { success: false, error: '帮派人数已满' };
    }

    if (approved) {
      // 批准：添加成员
      await this.db.prepare(`
        INSERT INTO guild_members (guild_id, wallet_address, role, contribution)
        VALUES (?, ?, 'member', 0)
      `).bind(guildId, applyWallet).run();

      await this.db.prepare(`
        UPDATE guilds SET member_count = member_count + 1 WHERE id = ?
      `).bind(guildId).run();
    }

    // 更新申请状态
    await this.db.prepare(`
      UPDATE guild_applies SET status = ? WHERE guild_id = ? AND wallet_address = ?
    `).bind(approved ? 1 : 2, guildId, applyWallet).run();

    return { success: true };
  }

  /**
   * 退出帮派
   */
  async quitGuild(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT * FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return { success: false, error: '您未加入帮派' };
    }

    if (member.role === 'leader') {
      // 帮主不能直接退出，需要先转让
      return { success: false, error: '帮主无法直接退出，请先转让帮主' };
    }

    // 移除成员
    await this.db.prepare(`
      DELETE FROM guild_members WHERE wallet_address = ?
    `).bind(walletAddress).run();

    await this.db.prepare(`
      UPDATE guilds SET member_count = member_count - 1 WHERE id = ?
    `).bind(member.guild_id).run();

    return { success: true };
  }

  /**
   * 解散帮派
   */
  async disbandGuild(walletAddress: string, guildId: number) {
    const member: any = await this.db.prepare(`
      SELECT * FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!member || member.role !== 'leader') {
      return { success: false, error: '只有帮主可以解散帮派' };
    }

    // 检查成员数量（需要只剩帮主才能解散）
    const memberCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM guild_members WHERE guild_id = ?
    `).bind(guildId).first();

    if ((memberCount as any).count > 1) {
      return { success: false, error: '请先移除所有成员后再解散' };
    }

    // 删除帮派（级联删除成员）
    await this.db.prepare(`DELETE FROM guild_members WHERE guild_id = ?`).bind(guildId).run();
    await this.db.prepare(`DELETE FROM guild_applies WHERE guild_id = ?`).bind(guildId).run();
    await this.db.prepare(`DELETE FROM guilds WHERE id = ?`).bind(guildId).run();

    return { success: true };
  }

  // ============ 帮派成员管理 ============

  /**
   * 任命副帮主
   */
  async promote(walletAddress: string, targetWallet: string, guildId: number) {
    return this.changeRole(walletAddress, targetWallet, guildId, 'deputy');
  }

  /**
   * 罢免副帮主
   */
  async demote(walletAddress: string, targetWallet: string, guildId: number) {
    return this.changeRole(walletAddress, targetWallet, guildId, 'member');
  }

  /**
   * 转让帮主
   */
  async abdicate(walletAddress: string, targetWallet: string, guildId: number) {
    return this.changeRole(walletAddress, targetWallet, guildId, 'leader');
  }

  /**
   * 修改成员角色
   */
  private async changeRole(walletAddress: string, targetWallet: string, guildId: number, newRole: string) {
    // 检查操作者权限
    const operator: any = await this.db.prepare(`
      SELECT role FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!operator) {
      return { success: false, error: '您不是帮派成员' };
    }

    // 只有帮主可以任命/罢免副帮主，转让帮主需要原帮主操作
    if (newRole === 'leader' && operator.role !== 'leader') {
      return { success: false, error: '只有帮主可以转让帮主' };
    }

    if (newRole === 'deputy' && operator.role !== 'leader') {
      return { success: false, error: '只有帮主可以任命副帮主' };
    }

    if (newRole === 'member' && operator.role !== 'leader' && operator.role !== 'deputy') {
      return { success: false, error: '权限不足' };
    }

    // 更新角色
    await this.db.prepare(`
      UPDATE guild_members SET role = ? WHERE guild_id = ? AND wallet_address = ?
    `).bind(newRole, guildId, targetWallet).run();

    // 如果是转让帮主，原帮主变为成员
    if (newRole === 'leader') {
      await this.db.prepare(`
        UPDATE guild_members SET role = 'member' WHERE guild_id = ? AND wallet_address = ?
      `).bind(guildId, walletAddress).run();

      await this.db.prepare(`
        UPDATE guilds SET leader_address = ? WHERE id = ?
      `).bind(targetWallet, guildId).run();
    }

    return { success: true };
  }

  /**
   * 移除成员
   */
  async removeMember(walletAddress: string, targetWallet: string, guildId: number) {
    const operator: any = await this.db.prepare(`
      SELECT role FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!operator) {
      return { success: false, error: '您不是帮派成员' };
    }

    // 不能移除帮主，不能自己移除自己
    const target: any = await this.db.prepare(`
      SELECT role FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, targetWallet).first();

    if (target.role === 'leader') {
      return { success: false, error: '无法移除帮主' };
    }

    if (walletAddress === targetWallet) {
      return { success: false, error: '请使用退出帮派功能' };
    }

    // 权限检查：帮主可以移除任何人，副帮主只能移除普通成员
    if (operator.role !== 'leader' && target.role !== 'member') {
      return { success: false, error: '权限不足' };
    }

    await this.db.prepare(`
      DELETE FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, targetWallet).run();

    await this.db.prepare(`
      UPDATE guilds SET member_count = member_count - 1 WHERE id = ?
    `).bind(guildId).run();

    return { success: true };
  }

  /**
   * 修改帮派公告
   */
  async modifyNotice(walletAddress: string, guildId: number, notice: string) {
    const member: any = await this.db.prepare(`
      SELECT role FROM guild_members WHERE guild_id = ? AND wallet_address = ?
    `).bind(guildId, walletAddress).first();

    if (!member || (member.role !== 'leader' && member.role !== 'deputy')) {
      return { success: false, error: '权限不足' };
    }

    await this.db.prepare(`
      UPDATE guilds SET notice = ? WHERE id = ?
    `).bind(notice, guildId).run();

    return { success: true };
  }

  // ============ 帮派捐献 ============

  /**
   * 捐献资源
   */
  async donate(walletAddress: string, guildId: number, type: 'gold' | 'money' | 'food', amount: number) {
    const config = DONATE_CONFIG[type];
    if (!config) {
      return { success: false, error: '无效的捐献类型' };
    }

    // 计算贡献度
    const contribution = Math.floor(amount / config.cost) * config.contribution;

    // 更新成员贡献
    await this.db.prepare(`
      UPDATE guild_members SET contribution = contribution + ? WHERE guild_id = ? AND wallet_address = ?
    `).bind(contribution, guildId, walletAddress).run();

    // 更新帮派经验
    const guildExp = Math.floor(contribution * 10); // 1贡献 = 10经验
    await this.db.prepare(`
      UPDATE guilds SET exp = exp + ? WHERE id = ?
    `).bind(guildExp, guildId).run();

    // 检查升级
    const guild: any = await this.db.prepare(`
      SELECT * FROM guilds WHERE id = ?
    `).bind(guildId).first();

    const newLevel = this.calculateGuildLevel((guild as any).exp);
    if (newLevel > (guild as any).level) {
      await this.db.prepare(`
        UPDATE guilds SET level = ? WHERE id = ?
      `).bind(newLevel, guildId).run();
    }

    return { success: true, contribution, guildExp };
  }

  /**
   * 计算帮派等级
   */
  private calculateGuildLevel(exp: number): number {
    const expRequirements = [0, 10000, 50000, 150000, 500000]; // 1-5级所需经验
    for (let i = expRequirements.length - 1; i >= 0; i--) {
      if (exp >= expRequirements[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // ============ 帮派搜索 ============

  /**
   * 搜索帮派
   */
  async searchGuilds(keyword?: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count,
        (SELECT wallet_address FROM guild_members WHERE guild_id = g.id AND role = 'leader') as leader_address,
        (SELECT name FROM characters WHERE wallet_address = (SELECT wallet_address FROM guild_members WHERE guild_id = g.id AND role = 'leader')) as leader_name
      FROM guilds g
    `;
    const params: any[] = [];

    if (keyword) {
      query += ' WHERE g.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    query += ' ORDER BY g.level DESC, g.exp DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const guilds: any = await this.db.prepare(query).bind(...params).all();

    return (guilds.results || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      level: g.level,
      exp: g.exp,
      memberCount: g.member_count,
      leaderName: g.leader_name,
      notice: g.notice,
      insignia: g.insignia,
      maxMembers: GUILD_LEVEL_CONFIG[g.level as keyof typeof GUILD_LEVEL_CONFIG]?.maxMembers || 50,
      isFull: g.member_count >= (GUILD_LEVEL_CONFIG[g.level as keyof typeof GUILD_LEVEL_CONFIG]?.maxMembers || 50),
    }));
  }
}

export const guildService = {
  create(db: D1Database) {
    return new GuildService(db);
  },

  async getMyGuild(db: D1Database, walletAddress: string) {
    const service = new GuildService(db);
    return service.getMyGuild(walletAddress);
  },

  async createGuild(db: D1Database, walletAddress: string, name: string) {
    const service = new GuildService(db);
    return service.createGuild(walletAddress, name);
  },

  async getGuildInfo(db: D1Database, guildId: number) {
    const service = new GuildService(db);
    return service.getGuildInfo(guildId);
  },

  async getMemberList(db: D1Database, guildId: number, page?: number, pageSize?: number) {
    const service = new GuildService(db);
    return service.getMemberList(guildId, page, pageSize);
  },

  async searchGuilds(db: D1Database, keyword?: string, page?: number, pageSize?: number) {
    const service = new GuildService(db);
    return service.searchGuilds(keyword, page, pageSize);
  },

  async applyJoinGuild(db: D1Database, walletAddress: string, guildId: number, message?: string) {
    const service = new GuildService(db);
    return service.applyJoinGuild(walletAddress, guildId, message);
  },

  async handleApply(db: D1Database, walletAddress: string, applyWallet: string, guildId: number, approved: boolean) {
    const service = new GuildService(db);
    return service.handleApply(walletAddress, applyWallet, guildId, approved);
  },

  async quitGuild(db: D1Database, walletAddress: string) {
    const service = new GuildService(db);
    return service.quitGuild(walletAddress);
  },

  async disbandGuild(db: D1Database, walletAddress: string, guildId: number) {
    const service = new GuildService(db);
    return service.disbandGuild(walletAddress, guildId);
  },

  async donate(db: D1Database, walletAddress: string, guildId: number, type: 'gold' | 'money' | 'food', amount: number) {
    const service = new GuildService(db);
    return service.donate(walletAddress, guildId, type, amount);
  },

  async removeMember(db: D1Database, walletAddress: string, targetWallet: string, guildId: number) {
    const service = new GuildService(db);
    return service.removeMember(walletAddress, targetWallet, guildId);
  },

  async promote(db: D1Database, walletAddress: string, targetWallet: string, guildId: number) {
    const service = new GuildService(db);
    return service.promote(walletAddress, targetWallet, guildId);
  },

  async demote(db: D1Database, walletAddress: string, targetWallet: string, guildId: number) {
    const service = new GuildService(db);
    return service.demote(walletAddress, targetWallet, guildId);
  },

  async abdicate(db: D1Database, walletAddress: string, targetWallet: string, guildId: number) {
    const service = new GuildService(db);
    return service.abdicate(walletAddress, targetWallet, guildId);
  },

  async modifyNotice(db: D1Database, walletAddress: string, guildId: number, notice: string) {
    const service = new GuildService(db);
    return service.modifyNotice(walletAddress, guildId, notice);
  },
};

export default guildService;
