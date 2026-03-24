/**
 * User Repository - 用户数据访问层
 * 参考原版 jx/DAL/UserAccess.cs (1,204 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface User extends BaseEntity {
  id: number;
  wallet_address: string;
  username: string;
  password: string;
  level: number;
  exp: number;
  gold: number;
  food: number;
  wood: number;
  iron: number;
  stone: number;
  diamonds: number;
  energy: number;
  energy_max: number;
  vip_level: number;
  vip_exp: number;
  login_days: number;
  last_login: string;
  last_save: string;
  city_id: number;
  city_level: number;
  regist_time: string;
  regist_ip: string;
  login_ip: string;
  status: number;
  title: number;
  newbie: number;
  guide_step: number;
  last_mission_id: number;
}

export class UserRepository extends BaseRepository<User> {
  constructor(db: D1Database) {
    super(db, 'characters');  // 使用 characters 表代替 users
  }

  // ==================== 查询操作 ====================

  /** 根据钱包地址查询 */
  async findByWallet(walletAddress: string): Promise<User | null> {
    return await this.db.prepare(
      `SELECT * FROM users WHERE wallet_address = ?`
    ).bind(walletAddress).first<User>();
  }

  /** 根据用户名查询 */
  async findByUsername(username: string): Promise<User | null> {
    return await this.db.prepare(
      `SELECT * FROM users WHERE username = ?`
    ).bind(username).first<User>();
  }

  /** 检查钱包地址是否存在 */
  async existsByWallet(walletAddress: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT 1 FROM users WHERE wallet_address = ? LIMIT 1`
    ).bind(walletAddress).first();
    return result !== null;
  }

  /** 检查用户名是否存在 */
  async existsByUsername(username: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT 1 FROM users WHERE username = ? LIMIT 1`
    ).bind(username).first();
    return result !== null;
  }

  /** 获取用户等级排名 */
  async getLevelRank(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE level > (SELECT level FROM users WHERE wallet_address = ?)`
    ).bind(walletAddress).first<{ count: number }>();
    return (result?.count || 0) + 1;
  }

  /** 获取用户战力排名 */
  async getPowerRank(walletAddress: string): Promise<number> {
    // 战力 = 武将战力 + 城市战力（简化计算）
    const result = await this.db.prepare(
      `SELECT COUNT(*) as count FROM users WHERE gold > (SELECT gold FROM users WHERE wallet_address = ?)`
    ).bind(walletAddress).first<{ count: number }>();
    return (result?.count || 0) + 1;
  }

  /** 获取多个用户信息 */
  async findByWallets(walletAddresses: string[]): Promise<User[]> {
    if (walletAddresses.length === 0) return [];
    
    const placeholders = walletAddresses.map(() => '?').join(', ');
    const result = await this.db.prepare(
      `SELECT * FROM users WHERE wallet_address IN (${placeholders})`
    ).bind(...walletAddresses).all<User>();

    return (result.results as User[]) || [];
  }

  /** 根据城市ID查询 */
  async findByCityId(cityId: number): Promise<User | null> {
    return await this.db.prepare(
      `SELECT * FROM users WHERE city_id = ?`
    ).bind(cityId).first<User>();
  }

  // ==================== 写入操作 ====================

  /** 创建新用户（注册） */
  async create(walletAddress: string, username: string): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await this.db.prepare(`
      INSERT INTO users (
        wallet_address, username, level, exp, gold, food, wood, iron, stone,
        diamonds, energy, energy_max, vip_level, vip_exp, login_days,
        last_login, last_save, city_id, city_level, regist_time, status,
        newbie, guide_step, last_mission_id, created_at, updated_at
      ) VALUES (?, ?, 1, 0, 1000, 100, 100, 100, 100, 0, 100, 100, 0, 0, 0,
        datetime('now'), datetime('now'), 0, 1, datetime('now'), 0, 1, 0, 0, datetime('now'), datetime('now'))
    `).bind(walletAddress, username).run();

    return result.meta.last_row_id;
  }

  /** 更新用户基础信息 */
  async updateProfile(walletAddress: string, data: Partial<{
    username: string;
    title: number;
    guide_step: number;
  }>): Promise<boolean> {
    const clauses = Object.keys(data)
      .filter(key => data[key as keyof typeof data] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');

    if (!clauses) return false;

    const values = Object.values(data).filter(v => v !== undefined);

    const result = await this.db.prepare(
      `UPDATE users SET ${clauses}, updated_at = datetime('now') WHERE wallet_address = ?`
    ).bind(...values, walletAddress).run();

    return result.meta.changes > 0;
  }

  /** 更新资源 */
  async updateResources(walletAddress: string, updates: {
    gold?: number;
    food?: number;
    wood?: number;
    iron?: number;
    stone?: number;
    diamonds?: number;
  }): Promise<boolean> {
    const clauses = Object.keys(updates)
      .map(key => `${key} = ${key} + ?`)
      .join(', ');

    if (!clauses) return false;

    const values = Object.values(updates);

    const result = await this.db.prepare(
      `UPDATE users SET ${clauses}, updated_at = datetime('now') WHERE wallet_address = ?`
    ).bind(...values, walletAddress).run();

    return result.meta.changes > 0;
  }

  /** 设置资源（覆盖） */
  async setResources(walletAddress: string, resources: {
    gold: number;
    food: number;
    wood: number;
    iron: number;
    stone: number;
  }): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE users SET 
        gold = ?, food = ?, wood = ?, iron = ?, stone = ?,
        updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(resources.gold, resources.food, resources.wood, resources.iron, resources.stone, walletAddress).run();

    return result.meta.changes > 0;
  }

  // ==================== 经验与等级 ====================

  /** 增加经验 */
  async addExp(walletAddress: string, expToAdd: number): Promise<{
    newExp: number;
    newLevel: number;
    levelUp: boolean;
  }> {
    const user = await this.findByWallet(walletAddress);
    if (!user) {
      return { newExp: 0, newLevel: 1, levelUp: false };
    }

    const newExp = user.exp + expToAdd;
    const newLevel = this.calculateLevel(newExp);
    const levelUp = newLevel > user.level;

    await this.db.prepare(`
      UPDATE users SET exp = ?, level = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(newExp, newLevel, walletAddress).run();

    return { newExp, newLevel, levelUp };
  }

  /** VIP经验增加 */
  async addVipExp(walletAddress: string, expToAdd: number): Promise<{
    newVipExp: number;
    newVipLevel: number;
    vipLevelUp: boolean;
  }> {
    const user = await this.findByWallet(walletAddress);
    if (!user) {
      return { newVipExp: 0, newVipLevel: 0, vipLevelUp: false };
    }

    const newVipExp = user.vip_exp + expToAdd;
    const newVipLevel = this.calculateVipLevel(newVipExp);
    const vipLevelUp = newVipLevel > user.vip_level;

    await this.db.prepare(`
      UPDATE users SET vip_exp = ?, vip_level = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(newVipExp, newVipLevel, walletAddress).run();

    return { newVipExp, newVipLevel, vipLevelUp };
  }

  /** 登录更新 */
  async updateLogin(walletAddress: string, ip: string): Promise<void> {
    await this.db.prepare(`
      UPDATE users SET 
        last_login = datetime('now'),
        login_ip = ?,
        login_days = login_days + 1,
        updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(ip, walletAddress).run();
  }

  /** 更新最后保存时间 */
  async updateLastSave(walletAddress: string): Promise<void> {
    await this.db.prepare(`
      UPDATE users SET last_save = datetime('now'), updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletAddress).run();
  }

  /** 更新城市信息 */
  async updateCity(walletAddress: string, cityId: number, cityLevel: number): Promise<void> {
    await this.db.prepare(`
      UPDATE users SET city_id = ?, city_level = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(cityId, cityLevel, walletAddress).run();
  }

  // ==================== 能量系统 ====================

  /** 增加能量 */
  async addEnergy(walletAddress: string, amount: number): Promise<{
    newEnergy: number;
    overflow: number;
  }> {
    const user = await this.findByWallet(walletAddress);
    if (!user) {
      return { newEnergy: 0, overflow: amount };
    }

    const newEnergy = Math.min(user.energy + amount, user.energy_max);
    const overflow = (user.energy + amount) - user.energy_max;

    await this.db.prepare(`
      UPDATE users SET energy = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(newEnergy, walletAddress).run();

    return { newEnergy, overflow: Math.max(0, overflow) };
  }

  /** 消耗能量 */
  async consumeEnergy(walletAddress: string, amount: number): Promise<boolean> {
    const user = await this.findByWallet(walletAddress);
    if (!user || user.energy < amount) {
      return false;
    }

    await this.db.prepare(`
      UPDATE users SET energy = energy - ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(amount, walletAddress).run();

    return true;
  }

  /** 恢复能量（满上限） */
  async refillEnergy(walletAddress: string): Promise<void> {
    await this.db.prepare(`
      UPDATE users SET energy = energy_max, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(walletAddress).run();
  }

  // ==================== 辅助方法 ====================

  /** 根据经验计算等级 */
  private calculateLevel(exp: number): number {
    // 简化公式：每级需要 1000 * level 经验
    let level = 1;
    let requiredExp = 1000;
    
    while (exp >= requiredExp) {
      exp -= requiredExp;
      level++;
      requiredExp = 1000 * level;
    }
    
    return Math.min(level, 100); // 最高100级
  }

  /** 根据VIP经验计算VIP等级 */
  private calculateVipLevel(vipExp: number): number {
    // 简化公式：每级需要 1000 VIP经验
    let level = 0;
    let requiredExp = 1000;
    
    while (vipExp >= requiredExp) {
      vipExp -= requiredExp;
      level++;
      requiredExp = 1000 * (level + 1);
    }
    
    return Math.min(level, 15); // 最高VIP15级
  }

  // ==================== 统计查询 ====================

  /** 获取在线用户数（今日登录） */
  async getOnlineCount(): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE last_login >= date('now', 'start of day')
    `).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取新用户数（今日注册） */
  async getNewUserCount(): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE regist_time >= date('now', 'start of day')
    `).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取用户统计 */
  async getStatistics(): Promise<{
    total: number;
    online: number;
    newToday: number;
    avgLevel: number;
  }> {
    const totalResult = await this.db.prepare(`SELECT COUNT(*) as count FROM users`).first<{ count: number }>();
    const onlineResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE last_login >= date('now', 'start of day')
    `).first<{ count: number }>();
    const newResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE regist_time >= date('now', 'start of day')
    `).first<{ count: number }>();
    const avgResult = await this.db.prepare(`SELECT AVG(level) as avg FROM users`).first<{ avg: number }>();

    return {
      total: totalResult?.count || 0,
      online: onlineResult?.count || 0,
      newToday: newResult?.count || 0,
      avgLevel: Math.round(avgResult?.avg || 0),
    };
  }
}
