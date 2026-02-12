/**
 * Building Service - 建筑服务层
 * 从 jx/BLL/Building.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Building, BuildingConfig, ServiceResult } from '../types/models';
import { buildingRepo } from '../repositories';

// 建筑类型
export const BUILDING_TYPES = {
  INTERIOR: 'interior',   // 内政建筑
  DEFENSE: 'defense',     // 防御建筑
};

// 建筑状态
export const BUILDING_STATES = {
  IDLE: 0,              // 空闲
  CONSTRUCTING: 1,       // 建造中
  UPGRADING: 2,         // 升级中
  DESTROYING: 3,         // 拆除中
};

// 建筑配置
export const BUILDING_CONFIG = {
  MAX_BUILDINGS: 20,        // 最大建筑数
  CONSTRUCTION_SPEED: 60,   // 建造速度（秒/级）
  UPGRADE_SPEED: 90,        // 升级速度（秒/级）
  MAX_LEVEL: 20,            // 最大等级
};

// 内政建筑配置
export const INTERIOR_BUILDINGS = {
  1: { name: '聚义厅', icon: 'building_1.png', maxLevel: 20 },
  2: { name: '义舍', icon: 'building_2.png', maxLevel: 20 },
  3: { name: '农场', icon: 'building_3.png', maxLevel: 20 },
  4: { name: '钱庄', icon: 'building_4.png', maxLevel: 20 },
  5: { name: '民居', icon: 'building_5.png', maxLevel: 20 },
  6: { name: '粮仓', icon: 'building_6.png', maxLevel: 20 },
  7: { name: '账房', icon: 'building_7.png', maxLevel: 20 },
  8: { name: '密库', icon: 'building_8.png', maxLevel: 20 },
  9: { name: '工匠坊', icon: 'building_9.png', maxLevel: 10 },
  10: { name: '营造司', icon: 'building_10.png', maxLevel: 10 },
  11: { name: '演武场', icon: 'building_11.png', maxLevel: 10 },
};

class BuildingService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 建筑查询 ============

  /**
   * 获取城市建筑列表
   */
  async getByCity(cityId: number, options: {
    type?: string;
    state?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { type, state, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM buildings WHERE city_id = ?';
    const params: any[] = [cityId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (state !== undefined) {
      query += ' AND state = ?';
      params.push(state);
    }

    query += ' ORDER BY position ASC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM buildings WHERE city_id = ?
    `).bind(cityId).first();

    return {
      buildings: (result.results || []).map(this.formatBuilding),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取建筑详情
   */
  async getDetail(buildingId: number) {
    const building: any = await this.db.prepare(`
      SELECT b.*, ic.Name as config_name, ic.Type as config_type, ic.Icon as config_icon
      FROM buildings b
      LEFT JOIN items_config ic ON b.config_id = ic.ID
      WHERE b.id = ?
    `).bind(buildingId).first();

    if (!building) return null;

    return this.formatBuilding(building);
  }

  /**
   * 获取建筑配置
   */
  async getConfig(configId: number) {
    const config = INTERIOR_BUILDINGS[configId as keyof typeof INTERIOR_BUILDINGS];
    if (!config) return null;

    return {
      id: configId,
      name: config.name,
      icon: config.icon,
      maxLevel: config.maxLevel,
    };
  }

  /**
   * 获取内政建筑配置列表
   */
  async getInteriorConfigs() {
    return Object.entries(INTERIOR_BUILDINGS).map(([id, config]) => ({
      id: parseInt(id),
      name: config.name,
      icon: config.icon,
      maxLevel: config.maxLevel,
    }));
  }

  /**
   * 获取城市建筑位
   */
  async getBuildingSlots(cityId: number) {
    const usedSlots: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM buildings WHERE city_id = ?
    `).bind(cityId).first();

    const used = (usedSlots as any).count || 0;
    const total = BUILDING_CONFIG.MAX_BUILDINGS;

    return {
      used,
      available: total - used,
      total,
    };
  }

  // ============ 建筑操作 ============

  /**
   * 建造建筑
   */
  async build(cityId: number, configId: number, position: number) {
    // 检查建筑位
    const slots = await this.getBuildingSlots(cityId);
    if (slots.available <= 0) {
      return { success: false, error: '建筑位已满' };
    }

    // 检查位置是否已被占用
    const existing: any = await this.db.prepare(`
      SELECT id FROM buildings WHERE city_id = ? AND position = ?
    `).bind(cityId, position).first();

    if (existing) {
      return { success: false, error: '该位置已有建筑' };
    }

    // 检查配置
    const config = INTERIOR_BUILDINGS[configId as keyof typeof INTERIOR_BUILDINGS];
    if (!config) {
      return { success: false, error: '建筑配置不存在' };
    }

    // 创建建筑
    const result = await this.db.prepare(`
      INSERT INTO buildings (city_id, type, level, position, state, config_id)
      VALUES (?, 'interior', 1, ?, 1, ?)
    `).bind(cityId, position, configId).run();

    return { success: true, buildingId: result.meta.last_row_id };
  }

  /**
   * 升级建筑
   */
  async upgrade(buildingId: number, walletAddress: string) {
    const building: any = await this.db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).bind(buildingId).first();

    if (!building) {
      return { success: false, error: '建筑不存在' };
    }

    const newLevel = (building.level || 0) + 1;
    const config = INTERIOR_BUILDINGS[building.config_id as keyof typeof INTERIOR_BUILDINGS];

    if (newLevel > config.maxLevel) {
      return { success: false, error: '已达到最大等级' };
    }

    // 计算升级消耗
    const upgradeCost = this.calculateUpgradeCost(building.level || 1);

    // 检查资源
    const city: any = await this.db.prepare(`
      SELECT money, food FROM cities WHERE wallet_address = ?
    `).bind(walletAddress).first();

    if ((city as any).money < upgradeCost.money || (city as any).food < upgradeCost.food) {
      return { success: false, error: '资源不足' };
    }

    // 扣除资源
    await this.db.prepare(`
      UPDATE cities SET money = money - ?, food = food - ? WHERE wallet_address = ?
    `).bind(upgradeCost.money, upgradeCost.food, walletAddress).run();

    // 升级建筑
    await this.db.prepare(`
      UPDATE buildings SET level = ? WHERE id = ?
    `).bind(newLevel, buildingId).run();

    return { success: true, newLevel };
  }

  /**
   * 加速建造/升级
   */
  async speedUp(buildingId: number) {
    const building: any = await this.db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).bind(buildingId).first();

    if (!building) {
      return { success: false, error: '建筑不存在' };
    }

    if (building.state === BUILDING_STATES.IDLE) {
      return { success: false, error: '建筑已完成建造/升级' };
    }

    // 立即完成
    await this.db.prepare(`
      UPDATE buildings SET state = 0 WHERE id = ?
    `).bind(buildingId).run();

    return { success: true };
  }

  /**
   * 拆除建筑
   */
  async demolish(buildingId: number) {
    const building: any = await this.db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).bind(buildingId).first();

    if (!building) {
      return { success: false, error: '建筑不存在' };
    }

    await this.db.prepare(`
      DELETE FROM buildings WHERE id = ?
    `).bind(buildingId).run();

    return { success: true };
  }

  /**
   * 取消建造
   */
  async cancel(buildingId: number) {
    const building: any = await this.db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).bind(buildingId).first();

    if (!building) {
      return { success: false, error: '建筑不存在' };
    }

    if (building.state === BUILDING_STATES.IDLE) {
      return { success: false, error: '无法取消已完成的建筑' };
    }

    // 删除建筑
    await this.db.prepare(`
      DELETE FROM buildings WHERE id = ?
    `).bind(buildingId).run();

    return { success: true };
  }

  // ============ 内部方法 ============

  private calculateUpgradeCost(currentLevel: number) {
    // 升级消耗 = 基础消耗 * (1.5 ^ 等级)
    const baseMoney = 100;
    const baseFood = 200;
    const multiplier = Math.pow(1.5, currentLevel);

    return {
      money: Math.floor(baseMoney * multiplier),
      food: Math.floor(baseFood * multiplier),
    };
  }

  private formatBuilding(building: any) {
    const config = INTERIOR_BUILDINGS[building.config_id as keyof typeof INTERIOR_BUILDINGS];
    return {
      id: building.id,
      cityId: building.city_id,
      type: building.type,
      level: building.level || 1,
      position: building.position,
      state: building.state,
      configId: building.config_id,
      configName: config?.name || building.config_name,
      configIcon: config?.icon || building.config_icon,
      createdAt: building.created_at,
    };
  }
}

export const buildingService = {
  create(db: D1Database) {
    return new BuildingService(db);
  },

  async getByCity(db: D1Database, cityId: number, options?: any) {
    const service = new BuildingService(db);
    return service.getByCity(cityId, options);
  },

  async getDetail(db: D1Database, buildingId: number) {
    const service = new BuildingService(db);
    return service.getDetail(buildingId);
  },

  async getConfig(db: D1Database, configId: number) {
    const service = new BuildingService(db);
    return service.getConfig(configId);
  },

  async getInteriorConfigs(db: D1Database) {
    const service = new BuildingService(db);
    return service.getInteriorConfigs();
  },

  async getBuildingSlots(db: D1Database, cityId: number) {
    const service = new BuildingService(db);
    return service.getBuildingSlots(cityId);
  },

  async build(db: D1Database, cityId: number, configId: number, position: number) {
    const service = new BuildingService(db);
    return service.build(cityId, configId, position);
  },

  async upgrade(db: D1Database, buildingId: number, walletAddress: string) {
    const service = new BuildingService(db);
    return service.upgrade(buildingId, walletAddress);
  },

  async speedUp(db: D1Database, buildingId: number) {
    const service = new BuildingService(db);
    return service.speedUp(buildingId);
  },

  async demolish(db: D1Database, buildingId: number) {
    const service = new BuildingService(db);
    return service.demolish(buildingId);
  },

  async cancel(db: D1Database, buildingId: number) {
    const service = new BuildingService(db);
    return service.cancel(buildingId);
  },
};

export default buildingService;
