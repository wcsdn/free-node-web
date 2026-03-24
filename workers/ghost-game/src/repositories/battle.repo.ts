/**
 * Battle Repository - 战斗数据访问层
 * 参考原版 jx/DAL/BattleAccess.cs (243 行)
 */
import type { D1Database } from '@cloudflare/workers-types';
import { BaseRepository, type BaseEntity } from './base.repo';

export interface Battle extends BaseEntity {
  id: number;
  wallet_address: string;
  battle_type: number;
  enemy_id: number;
  enemy_name: string;
  enemy_level: number;
  enemy_hp: number;
  enemy_max_hp: number;
  hero_id: number;
  hero_hp: number;
  hero_max_hp: number;
  round: number;
  result: number;
  reward_gold: number;
  reward_exp: number;
  reward_items: string;
  damage: number;
  damage_taken: number;
  created_at: string;
}

export interface BattleConfig {
  id: number;
  name: string;
  type: number;
  level: number;
  enemy_id: number;
  enemy_name: string;
  enemy_level: number;
  enemy_hp: number;
  enemy_atk: number;
  enemy_def: number;
  reward_gold: number;
  reward_exp: number;
  win_rate: number;
}

export class BattleRepository extends BaseRepository<Battle> {
  constructor(db: D1Database) {
    super(db, 'battles');
  }

  // ==================== 查询操作 ====================

  /** 根据钱包地址查询战斗记录 */
  async findByWallet(walletAddress: string, limit: number = 20): Promise<Battle[]> {
    const result = await this.db.prepare(
      `SELECT * FROM battles WHERE attacker_address = ? OR defender_address = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(walletAddress, walletAddress, limit).all<Battle>();
    return (result.results as Battle[]) || [];
  }

  /** 根据类型查询 */
  async findByType(walletAddress: string, battleType: number): Promise<Battle[]> {
    const result = await this.db.prepare(`
      SELECT * FROM battles WHERE (attacker_address = ? OR defender_address = ?) AND battle_type = ?
    `).bind(walletAddress, walletAddress, battleType).all<Battle>();
    return (result.results as Battle[]) || [];
  }

  /** 查询战斗结果统计 */
  async getBattleStats(walletAddress: string): Promise<{
    total: number;
    wins: number;
    losses: number;
    totalDamage: number;
    totalRewards: number;
  }> {
    const winsResult = await this.db.prepare(`
      SELECT COUNT(*) as count, SUM(reward_gold) as gold, SUM(damage) as damage 
      FROM battles WHERE attacker_address = ? AND result = 1
    `).bind(walletAddress).first<{ count: number; gold: number; damage: number }>();

    const lossesResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles WHERE attacker_address = ? AND result = 0
    `).bind(walletAddress).first<{ count: number }>();

    return {
      total: (winsResult?.count || 0) + (lossesResult?.count || 0),
      wins: winsResult?.count || 0,
      losses: lossesResult?.count || 0,
      totalDamage: winsResult?.damage || 0,
      totalRewards: winsResult?.gold || 0,
    };
  }

  // ==================== 战斗配置查询 ====================

  /** 获取战斗配置 */
  async getBattleConfig(battleId: number): Promise<BattleConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM battles_config WHERE id = ?`
    ).bind(battleId).first<BattleConfig>();
  }

  /** 根据类型和等级获取配置 */
  async getBattleConfigByLevel(battleType: number, level: number): Promise<BattleConfig | null> {
    return await this.db.prepare(
      `SELECT * FROM battles_config WHERE type = ? AND level = ?`
    ).bind(battleType, level).first<BattleConfig>();
  }

  /** 获取所有配置 */
  async getAllConfigs(): Promise<BattleConfig[]> {
    const result = await this.db.prepare(`SELECT * FROM battles_config`).all<BattleConfig>();
    return (result.results as BattleConfig[]) || [];
  }

  // ==================== 写入操作 ====================

  /** 创建战斗记录 */
  async create(walletAddress: string, data: {
    battleType: number;
    enemyId: number;
    enemyName: string;
    enemyLevel: number;
    enemyHp: number;
    enemyMaxHp: number;
    heroId: number;
  }): Promise<number> {
    // battles表使用 attacker_address，没有 wallet_address 列
    const result = await this.db.prepare(`
      INSERT INTO battles (
        attacker_address, battle_type, enemy_id, enemy_name, enemy_level, 
        enemy_hp, enemy_max_hp, hero_id, hero_hp, hero_max_hp,
        round, result, reward_gold, reward_exp, damage, damage_taken,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, datetime('now'), datetime('now'))
    `).bind(
      walletAddress, data.battleType, data.enemyId, data.enemyName, data.enemyLevel,
      data.enemyHp, data.enemyMaxHp, data.heroId, 0, 0
    ).run();

    return result.meta.last_row_id;
  }

  /** 更新战斗结果 */
  async updateResult(battleId: number, result: {
    heroHp: number;
    heroMaxHp: number;
    round: number;
    result: number;
    rewardGold: number;
    rewardExp: number;
    rewardItems: string;
    damage: number;
    damageTaken: number;
  }): Promise<void> {
    await this.db.prepare(`
      UPDATE battles SET 
        hero_hp = ?, hero_max_hp = ?, round = ?, result = ?, 
        reward_gold = ?, reward_exp = ?, reward_items = ?,
        damage = ?, damage_taken = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      result.heroHp, result.heroMaxHp, result.round, result.result,
      result.rewardGold, result.rewardExp, result.rewardItems,
      result.damage, result.damageTaken, battleId
    ).run();
  }

  /** 快速结算（简化版） */
  async quickSettle(battleId: number, result: number, damage: number): Promise<void> {
    const battle = await this.findById(battleId);
    if (!battle) return;

    const rewardGold = result === 1 ? Math.floor(battle.enemy_level * 10) : 0;
    const rewardExp = result === 1 ? Math.floor(battle.enemy_level * 5) : 0;

    await this.updateResult(battleId, {
      heroHp: result === 1 ? battle.hero_max_hp : 0,
      heroMaxHp: battle.hero_max_hp,
      round: 1,
      result,
      rewardGold,
      rewardExp,
      rewardItems: '[]',
      damage,
      damageTaken: battle.enemy_max_hp - (result === 1 ? 0 : battle.enemy_hp),
    });
  }

  // ==================== 统计查询 ====================

  /** 获取今日战斗次数 */
  async getTodayBattleCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles 
      WHERE (attacker_address = ? OR defender_address = ?) AND created_at >= date('now', 'start of day')
    `).bind(walletAddress, walletAddress).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取今日胜利次数 */
  async getTodayWinCount(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battles 
      WHERE attacker_address = ? AND result = 1 AND created_at >= date('now', 'start of day')
    `).bind(walletAddress).first<{ count: number }>();
    return result?.count || 0;
  }

  /** 获取最大伤害 */
  async getMaxDamage(walletAddress: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT MAX(damage) as max FROM battles WHERE attacker_address = ?
    `).bind(walletAddress).first<{ max: number }>();
    return result?.max || 0;
  }

  /** 获取连续胜利次数 */
  async getWinStreak(walletAddress: string): Promise<number> {
    const battles = await this.findByWallet(walletAddress, 10);
    let streak = 0;
    
    for (const battle of battles) {
      if (battle.result === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}
