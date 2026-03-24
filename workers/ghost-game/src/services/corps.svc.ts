/**
 * Corps Service - 军团服务层
 * 从 jx/BLL/Corps.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';

// 军团状态
const CORPS_STATES = {
  IDLE: 0,           // 空闲
  MARCHING: 1,        // 行军中
  GARRISON: 2,        // 驻扎
  FIGHTING: 3,        // 战斗中
  RETURNING: 4,       // 返回中
};

// 军团配置
const CORPS_CONFIG = {
  MAX_HEROES: 10,         // 最大武将数
  MARCH_SPEED: 100,       // 行军速度
  GARRISON_TIME: 3600,    // 驻扎时间（秒）
  RETURN_TIME: 1800,      // 返回时间（秒）
};

class CorpsService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 军团查询 ============

  /**
   * 获取军团列表
   */
  async getCorpsList(walletAddress: string, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const corps: any = await this.db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM corps_members WHERE corps_id = c.id) as member_count
      FROM corps_system c
      ORDER BY c.level DESC, c.exp DESC
      LIMIT ? OFFSET ?
    `).bind(pageSize, offset).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM corps_system
    `).first();

    return {
      success: true,
      data: {
        corps: (corps.results || []).map(this.formatCorps),
        total: (totalCount as any).count,
        page,
        pageSize,
      },
    };
  }

  /**
   * 获取我的军团
   */
  async getMyCorps(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT cm.*, c.* 
      FROM corps_members cm
      JOIN corps_system c ON cm.corps_id = c.id
      WHERE cm.wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) return null;

    return {
      id: member.corps_id,
      name: member.name,
      level: member.level,
      exp: member.exp,
      role: member.role,
      contribution: member.contribution,
      joinedAt: member.joined_at,
    };
  }

  /**
   * 获取军团详情
   */
  async getCorpsInfo(corpsId: number) {
    const corps: any = await this.db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM corps_members WHERE corps_id = c.id) as member_count,
        (SELECT wallet_address FROM corps_members WHERE corps_id = c.id AND role = 'leader') as leader_address
      FROM corps_system c WHERE c.id = ?
    `).bind(corpsId).first();

    if (!corps) return null;

    return {
      ...this.formatCorps(corps),
      leaderAddress: corps.leader_address,
    };
  }

  /**
   * 获取军团成员列表
   */
  async getCorpsMembers(corpsId: number, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const members: any = await this.db.prepare(`
      SELECT cm.*, c.name as character_name, c.level as character_level
      FROM corps_members cm
      LEFT JOIN characters c ON cm.wallet_address = c.wallet_address
      WHERE cm.corps_id = ?
      ORDER BY 
        CASE cm.role 
          WHEN 'leader' THEN 1 
          WHEN 'deputy' THEN 2 
          ELSE 3 
        END,
        cm.contribution DESC
      LIMIT ? OFFSET ?
    `).bind(corpsId, pageSize, offset).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM corps_members WHERE corps_id = ?
    `).bind(corpsId).first();

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
    };
  }

  // ============ 军团操作 ============

  /**
   * 创建军团
   */
  async createCorps(walletAddress: string, name: string) {
    // 检查是否已有军团
    const existingMember: any = await this.db.prepare(`
      SELECT corps_id FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return { success: false, error: '您已加入其他军团' };
    }

    // 检查名称唯一性
    const existingName: any = await this.db.prepare(`
      SELECT id FROM corps_system WHERE name = ?
    `).bind(name).first();

    if (existingName) {
      return { success: false, error: '军团名称已被占用' };
    }

    // 获取玩家的城市ID
    const city: any = await this.db.prepare(`
      SELECT id FROM cities WHERE wallet_address = ? ORDER BY id ASC LIMIT 1
    `).bind(walletAddress).first();

    if (!city) {
      return { success: false, error: '您没有城市，无法创建军团' };
    }

    // 创建军团
    const result = await this.db.prepare(`
      INSERT INTO corps_system (name, leader_id, city_id, member_count)
      VALUES (?, ?, ?, 1)
    `).bind(name, walletAddress, city.id).run();

    const corpsId = result.meta.last_row_id;

    // 创建者自动成为军团长
    await this.db.prepare(`
      INSERT INTO corps_members (corps_id, wallet_address, role, contribution)
      VALUES (?, ?, 'leader', 0)
    `).bind(corpsId, walletAddress).run();

    return { success: true, corpsId };
  }

  /**
   * 申请加入军团
   */
  async applyJoinCorps(walletAddress: string, corpsId: number, message?: string) {
    // 检查是否已有军团
    const existingMember: any = await this.db.prepare(`
      SELECT corps_id FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (existingMember) {
      return { success: false, error: '您已加入军团' };
    }

    // 检查军团是否存在
    const corps: any = await this.db.prepare(`
      SELECT * FROM corps_system WHERE id = ?
    `).bind(corpsId).first();

    if (!corps) {
      return { success: false, error: '军团不存在' };
    }

    // 创建申请
    await this.db.prepare(`
      INSERT INTO corps_applies (corps_id, wallet_address, message, status)
      VALUES (?, ?, ?, 0)
    `).bind(corpsId, walletAddress, message || '').run();

    return { success: true };
  }

  /**
   * 处理入团申请
   */
  async handleApply(walletAddress: string, applyWallet: string, corpsId: number, approved: boolean) {
    // 检查权限
    const member: any = await this.db.prepare(`
      SELECT role FROM corps_members 
      WHERE corps_id = ? AND wallet_address = ?
    `).bind(corpsId, walletAddress).first();

    if (!member || (member.role !== 'leader' && member.role !== 'deputy')) {
      return { success: false, error: '权限不足' };
    }

    if (approved) {
      // 检查成员数量
      const memberCount: any = await this.db.prepare(`
        SELECT COUNT(*) as count FROM corps_members WHERE corps_id = ?
      `).bind(corpsId).first();

      if ((memberCount as any).count >= 50) {
        return { success: false, error: '军团人数已满' };
      }

      // 添加成员
      await this.db.prepare(`
        INSERT INTO corps_members (corps_id, wallet_address, role, contribution)
        VALUES (?, ?, 'member', 0)
      `).bind(corpsId, applyWallet).run();

      await this.db.prepare(`
        UPDATE corps_system SET member_count = member_count + 1 WHERE id = ?
      `).bind(corpsId).run();
    }

    // 更新申请状态
    await this.db.prepare(`
      UPDATE corps_applies SET status = ? WHERE corps_id = ? AND wallet_address = ?
    `).bind(approved ? 1 : 2, corpsId, applyWallet).run();

    return { success: true };
  }

  /**
   * 退出军团
   */
  async quitCorps(walletAddress: string) {
    const member: any = await this.db.prepare(`
      SELECT * FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if (!member) {
      return { success: false, error: '您未加入军团' };
    }

    if (member.role === 'leader') {
      return { success: false, error: '军团长无法直接退出' };
    }

    await this.db.prepare(`
      DELETE FROM corps_members WHERE wallet_address = ?
    `).bind(walletAddress).run();

    await this.db.prepare(`
      UPDATE corps_system SET member_count = member_count - 1 WHERE id = ?
    `).bind(member.corps_id).run();

    return { success: true };
  }

  /**
   * 解散军团
   */
  async disbandCorps(walletAddress: string, corpsId: number) {
    const member: any = await this.db.prepare(`
      SELECT * FROM corps_members WHERE corps_id = ? AND wallet_address = ?
    `).bind(corpsId, walletAddress).first();

    if (!member || member.role !== 'leader') {
      return { success: false, error: '只有军团长可以解散' };
    }

    const memberCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM corps_members WHERE corps_id = ?
    `).bind(corpsId).first();

    if ((memberCount as any).count > 1) {
      return { success: false, error: '请先移除所有成员' };
    }

    await this.db.prepare(`DELETE FROM corps_members WHERE corps_id = ?`).bind(corpsId).run();
    await this.db.prepare(`DELETE FROM corps_applies WHERE corps_id = ?`).bind(corpsId).run();
    await this.db.prepare(`DELETE FROM corps_system WHERE id = ?`).bind(corpsId).run();

    return { success: true };
  }

  // ============ 军团武将管理 ============

  /**
   * 分配武将到军团
   */
  async assignHero(walletAddress: string, corpsId: number, heroId: number) {
    // 验证成员身份
    const member: any = await this.db.prepare(`
      SELECT * FROM corps_members 
      WHERE corps_id = ? AND wallet_address = ?
    `).bind(corpsId, walletAddress).first();

    if (!member) {
      return { success: false, error: '您不是军团成员' };
    }

    // 检查武将是否可用
    const hero: any = await this.db.prepare(`
      SELECT * FROM heroes WHERE id = ? AND wallet_address = ?
    `).bind(heroId, walletAddress).first();

    if (!hero) {
      return { success: false, error: '武将不存在' };
    }

    // 检查军团武将数量
    const assignedCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM corps_heroes WHERE corps_id = ?
    `).bind(corpsId).first();

    if ((assignedCount as any).count >= CORPS_CONFIG.MAX_HEROES) {
      return { success: false, error: '军团武将数量已达上限' };
    }

    // 分配武将
    await this.db.prepare(`
      INSERT INTO corps_heroes (corps_id, hero_id, status, position)
      VALUES (?, ?, 0, 0)
    `).bind(corpsId, heroId).run();

    // 更新武将状态
    await this.db.prepare(`
      UPDATE heroes SET state = 2 WHERE id = ?
    `).bind(heroId).run();

    return { success: true };
  }

  /**
   * 从军团移除武将
   */
  async removeHero(walletAddress: string, corpsId: number, heroId: number) {
    const member: any = await this.db.prepare(`
      SELECT role FROM corps_members 
      WHERE corps_id = ? AND wallet_address = ?
    `).bind(corpsId, walletAddress).first();

    if (!member || (member.role !== 'leader' && member.role !== 'deputy')) {
      return { success: false, error: '权限不足' };
    }

    // 获取武将归属
    const corpsHero: any = await this.db.prepare(`
      SELECT ch.*, h.wallet_address as hero_owner
      FROM corps_heroes ch
      JOIN heroes h ON ch.hero_id = h.id
      WHERE ch.hero_id = ? AND ch.corps_id = ?
    `).bind(heroId, corpsId).first();

    if (!corpsHero) {
      return { success: false, error: '武将不在军团中' };
    }

    // 只有军团长可以移除非自己武将
    if (member.role !== 'leader' && corpsHero.hero_owner !== walletAddress) {
      return { success: false, error: '权限不足' };
    }

    await this.db.prepare(`
      DELETE FROM corps_heroes WHERE hero_id = ? AND corps_id = ?
    `).bind(heroId, corpsId).run();

    await this.db.prepare(`
      UPDATE heroes SET state = 0 WHERE id = ?
    `).bind(heroId).run();

    return { success: true };
  }

  /**
   * 获取军团武将列表
   */
  async getCorpsHeroes(corpsId: number) {
    const heroes: any = await this.db.prepare(`
      SELECT ch.*, h.name as hero_name, h.level, h.quality, h.atk, h.def, h.hp
      FROM corps_heroes ch
      JOIN heroes h ON ch.hero_id = h.id
      WHERE ch.corps_id = ?
      ORDER BY ch.position ASC, h.quality DESC
    `).bind(corpsId).all();

    return (heroes.results || []).map((h: any) => ({
      id: h.hero_id,
      name: h.hero_name,
      level: h.level,
      quality: h.quality,
      atk: h.atk,
      def: h.def,
      hp: h.hp,
      status: h.status,
      position: h.position,
    }));
  }

  // ============ 军团资源 ============

  /**
   * 获取军团资源信息
   */
  async getCorpsResources(corpsId: number) {
    const resources: any = await this.db.prepare(`
      SELECT * FROM corps_resources WHERE corps_id = ?
    `).bind(corpsId).first();

    if (!resources) {
      return {
        money: 0,
        food: 0,
        men: 0,
        contribution: 0,
      };
    }

    return {
      money: resources.money,
      food: resources.food,
      men: resources.men,
      contribution: resources.contribution,
    };
  }

  /**
   * 捐献资源
   */
  async donate(walletAddress: string, corpsId: number, type: 'money' | 'food' | 'men', amount: number) {
    const member: any = await this.db.prepare(`
      SELECT role FROM corps_members 
      WHERE corps_id = ? AND wallet_address = ?
    `).bind(corpsId, walletAddress).first();

    if (!member) {
      return { success: false, error: '您不是军团成员' };
    }

    // 计算贡献度
    let contribution = 0;
    let resourceType = '';

    switch (type) {
      case 'money':
        contribution = Math.floor(amount / 100);
        resourceType = 'money';
        break;
      case 'food':
        contribution = Math.floor(amount / 100);
        resourceType = 'food';
        break;
      case 'men':
        contribution = amount;
        resourceType = 'men';
        break;
    }

    // 更新军团资源
    await this.db.prepare(`
      UPDATE corps_resources 
      SET ${resourceType} = ${resourceType} + ?, contribution = contribution + ?
      WHERE corps_id = ?
    `).bind(amount, contribution, corpsId).run();

    // 更新成员贡献
    await this.db.prepare(`
      UPDATE corps_members 
      SET contribution = contribution + ?
      WHERE corps_id = ? AND wallet_address = ?
    `).bind(contribution, corpsId, walletAddress).run();

    return { success: true, contribution };
  }

  // ============ 格式化 ============

  private formatCorps(corps: any) {
    return {
      // C# CorpsInfo 字段 (驼峰)
      CorpsID: corps.id,
      CorpsName: corps.name || '',
      State: corps.state || 1,
      UserName: corps.leader_address || '',
      CityID: corps.city_id || 0,
      CityPos: corps.city_position || 0,
      TargetCity: corps.target_city_id || 0,
      ArriveTime: corps.arrive_time || '',
      SchlepMoney: 0,
      SchlepFood: 0,
      SchlepMen: 0,
      Insignia: 0,
      Seconds: 0,
      IsVIP: 0,
      GarrisonID: 0,
      // 额外字段 (兼容)
      id: corps.id,
      name: corps.name,
      level: corps.level,
      exp: corps.exp,
      memberCount: corps.member_count,
      notice: corps.notice,
      targetPosition: corps.target_position,
      arriveTime: corps.arrive_time,
    };
  }
}

export const corpsService = {
  create(db: D1Database) {
    return new CorpsService(db);
  },

  async getCorpsList(db: D1Database, walletAddress: string, page?: number, pageSize?: number) {
    const service = new CorpsService(db);
    return service.getCorpsList(walletAddress, page, pageSize);
  },

  async getMyCorps(db: D1Database, walletAddress: string) {
    const service = new CorpsService(db);
    return service.getMyCorps(walletAddress);
  },

  async getCorpsInfo(db: D1Database, corpsId: number) {
    const service = new CorpsService(db);
    return service.getCorpsInfo(corpsId);
  },

  async createCorps(db: D1Database, walletAddress: string, name: string) {
    const service = new CorpsService(db);
    return service.createCorps(walletAddress, name);
  },

  async assignHero(db: D1Database, walletAddress: string, corpsId: number, heroId: number) {
    const service = new CorpsService(db);
    return service.assignHero(walletAddress, corpsId, heroId);
  },

  async removeHero(db: D1Database, walletAddress: string, corpsId: number, heroId: number) {
    const service = new CorpsService(db);
    return service.removeHero(walletAddress, corpsId, heroId);
  },

  async donate(db: D1Database, walletAddress: string, corpsId: number, type: string, amount: number) {
    const service = new CorpsService(db);
    return service.donate(walletAddress, corpsId, type as any, amount);
  },

  async getCorpsHeroes(db: D1Database, corpsId: number) {
    const service = new CorpsService(db);
    return service.getCorpsHeroes(corpsId);
  },

  async getCorpsResources(db: D1Database, corpsId: number) {
    const service = new CorpsService(db);
    return service.getCorpsResources(corpsId);
  },

  async getCorpsMembers(db: D1Database, corpsId: number, page?: number, pageSize?: number) {
    const service = new CorpsService(db);
    return service.getCorpsMembers(corpsId, page, pageSize);
  },
};

export { CORPS_STATES, CORPS_CONFIG };
export default corpsService;
