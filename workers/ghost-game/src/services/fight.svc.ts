/**
 * Fight Service - 战斗服务层
 * 从 jx/BLL/Fight.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { BattleRecord, ServiceResult } from '../types/models';

// 战斗类型
export const BATTLE_TYPES = {
  PVE: 'pve',      // 打怪/NPC
  PVP: 'pvp',      // 玩家对战
  GUILD: 'guild',  // 帮派战
  ARENA: 'arena',   // 竞技场
};

// 战斗状态
export const BATTLE_STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

// 战斗配置
export const BATTLE_CONFIG = {
  MAX_ROUNDS: 20,           // 最大回合数
  BASE_DAMAGE: 100,         // 基础伤害
  CRITICAL_RATE: 0.1,       // 暴击率
  CRITICAL_DAMAGE: 1.5,     // 暴击伤害
  DEFENSE_RATE: 0.2,        // 防御减伤率
  MAX_DAILY_BATTLES: 50,     // 每日最大战斗次数
  REWARD_EXP_BASE: 100,     // 基础经验奖励
  REWARD_GOLD_BASE: 50,     // 基础金币奖励
};

// 兵种相克表
export const UNIT_COUNTER: { [key: string]: string } = {
  '骑兵': '步兵',
  '步兵': '弓兵',
  '弓兵': '骑兵',
  '攻城': '城防',
  '城防': '攻城',
};

class FightService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ============ 战斗计算 ============

  /**
   * 计算战斗结果
   */
  calculateBattle(params: {
    attackerPower: number;
    defenderPower: number;
    attackerCount: number;
    defenderCount: number;
    attackerType: string;
    defenderType: string;
    attackerHeroPower?: number;
    defenderHeroPower?: number;
  }): {
    winner: 'attacker' | 'defender' | 'draw';
    attackerLoss: number;
    defenderLoss: number;
    attackerRemaining: number;
    defenderRemaining: number;
    rounds: number;
    isCritical: boolean;
    expReward: number;
    goldReward: number;
  } {
    const { attackerPower, defenderPower, attackerCount, defenderCount, attackerType, defenderType } = params;

    // 兵种相克加成
    let attackerBonus = 1;
    let defenderBonus = 1;

    if (defenderType === UNIT_COUNTER[attackerType]) {
      attackerBonus = 1.5;
    }
    if (attackerType === UNIT_COUNTER[defenderType]) {
      defenderBonus = 1.5;
    }

    // 计算总攻击力（含武将加成）
    const totalAttackerPower = attackerPower + (params.attackerHeroPower || 0);
    const totalDefenderPower = defenderPower + (params.defenderHeroPower || 0);

    // 回合计算
    let rounds = 0;
    let attackerLoss = 0;
    let defenderLoss = 0;
    let isCritical = false;

    while (rounds < BATTLE_CONFIG.MAX_ROUNDS && attackerCount - attackerLoss > 0 && defenderCount - defenderLoss > 0) {
      rounds++;

      // 暴击判定
      const criticalRoll = Math.random();
      const isCrit = criticalRoll < BATTLE_CONFIG.CRITICAL_RATE;
      
      // 伤害计算
      const attackerDamage = (totalAttackerPower * attackerBonus * (isCrit ? BATTLE_CONFIG.CRITICAL_DAMAGE : 1)) / 
                           Math.max(1, totalDefenderPower * (1 - BATTLE_CONFIG.DEFENSE_RATE));
      const defenderDamage = (totalDefenderPower * defenderBonus) / 
                           Math.max(1, totalAttackerPower * (1 - BATTLE_CONFIG.DEFENSE_RATE));

      // 随机波动 ±20%
      const attackerFinalDamage = Math.floor(attackerDamage * (0.8 + Math.random() * 0.4));
      const defenderFinalDamage = Math.floor(defenderDamage * (0.8 + Math.random() * 0.4));

      attackerLoss += Math.min(attackerFinalDamage, defenderCount - defenderLoss);
      defenderLoss += Math.min(defenderFinalDamage, attackerCount - attackerLoss);

      if (isCrit) isCritical = true;
    }

    // 计算奖励
    const winner = attackerLoss < defenderLoss ? 'attacker' : defenderLoss < attackerLoss ? 'defender' : 'draw';
    const isWin = winner === 'attacker';
    
    const expReward = isWin ? Math.floor(BATTLE_CONFIG.REWARD_EXP_BASE * (1 + rounds / BATTLE_CONFIG.MAX_ROUNDS)) : 0;
    const goldReward = isWin ? Math.floor(BATTLE_CONFIG.REWARD_GOLD_BASE * (1 + rounds / BATTLE_CONFIG.MAX_ROUNDS)) : 0;

    return {
      winner,
      attackerLoss: Math.min(attackerLoss, attackerCount),
      defenderLoss: Math.min(defenderLoss, defenderCount),
      attackerRemaining: Math.max(0, attackerCount - attackerLoss),
      defenderRemaining: Math.max(0, defenderCount - defenderLoss),
      rounds,
      isCritical,
      expReward,
      goldReward,
    };
  }

  // ============ 战斗记录 ============

  /**
   * 记录战斗结果
   */
  async recordBattle(walletAddress: string, battle: {
    battleType: string;
    opponentAddress?: string;
    opponentName?: string;
    result: 'win' | 'lose' | 'draw';
    rounds: number;
    attackerPower: number;
    defenderPower: number;
    attackerLoss: number;
    defenderLoss: number;
    expReward: number;
    goldReward: number;
  }): Promise<ServiceResult<{ battleId: number }>> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.db.prepare(`
        INSERT INTO battle_records (
          wallet_address, battle_type, opponent_address, opponent_name, result,
          rounds, attacker_power, defender_power, attacker_loss, defender_loss,
          exp_reward, gold_reward, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        walletAddress,
        battle.battleType,
        battle.opponentAddress || null,
        battle.opponentName || null,
        battle.result,
        battle.rounds,
        battle.attackerPower,
        battle.defenderPower,
        battle.attackerLoss,
        battle.defenderLoss,
        battle.expReward,
        battle.goldReward,
        now
      ).run();

      return { ok: true, data: { battleId: result.meta.last_row_id } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  }

  /**
   * 获取战斗记录列表
   */
  async getBattleRecords(walletAddress: string, options: {
    battleType?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { battleType, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM battle_records WHERE wallet_address = ?';
    const params: any[] = [walletAddress];

    if (battleType) {
      query += ' AND battle_type = ?';
      params.push(battleType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const totalCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battle_records WHERE wallet_address = ?
    `).bind(walletAddress).first();

    return {
      records: (result.results || []).map(this.formatBattleRecord),
      total: (totalCount as any).count,
      page,
      pageSize,
    };
  }

  /**
   * 获取单场战斗详情
   */
  async getBattleById(walletAddress: string, battleId: number) {
    const result: any = await this.db.prepare(`
      SELECT * FROM battle_records WHERE id = ? AND wallet_address = ?
    `).bind(battleId, walletAddress).first();

    if (!result) return null;

    return this.formatBattleRecord(result);
  }

  /**
   * 获取今日战斗统计
   */
  async getTodayBattleStats(walletAddress: string) {
    const today = new Date().toISOString().split('T')[0];

    const stats: any = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_battles,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as win_count,
        SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as lose_count,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draw_count,
        SUM(exp_reward) as total_exp,
        SUM(gold_reward) as total_gold
      FROM battle_records 
      WHERE wallet_address = ? AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    return {
      totalBattles: stats?.total_battles || 0,
      winCount: stats?.win_count || 0,
      loseCount: stats?.lose_count || 0,
      drawCount: stats?.draw_count || 0,
      totalExp: stats?.total_exp || 0,
      totalGold: stats?.total_gold || 0,
      winRate: stats?.total_battles > 0 ? 
        Math.round((stats?.win_count / stats?.total_battles) * 100) : 0,
    };
  }

  // ============ 战斗查询 ============

  /**
   * 检查目标位置状态
   */
  async checkTargetState(walletAddress: string, cityId: number, targetPos: number) {
    // 检查是否是自己的城市
    const myCity: any = await this.db.prepare(`
      SELECT position FROM cities WHERE wallet_address = ? AND id = ?
    `).bind(walletAddress, cityId).first();

    if (myCity && myCity.position === targetPos) {
      return { valid: false, error: 7, message: '不能攻击自己的城市' };
    }

    // 检查位置类型
    const target: any = await this.db.prepare(`
      SELECT * FROM cities WHERE position = ?
    `).bind(targetPos).first();

    if (target) {
      // 玩家城市
      return { valid: true, type: 'player', owner: target.wallet_address };
    }

    // 检查 NPC
    const npc: any = await this.db.prepare(`
      SELECT * FROM npc_floors WHERE position = ?
    `).bind(targetPos).first();

    if (npc) {
      return { valid: true, type: 'npc', level: npc.difficulty };
    }

    // 空地
    return { valid: true, type: 'empty' };
  }

  /**
   * 检查攻击次数限制
   */
  async checkAttackLimit(walletAddress: string, targetPos: number) {
    const today = new Date().toISOString().split('T')[0];

    // 检查当日攻击同一人次数
    const sameTargetCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battle_records 
      WHERE wallet_address = ? 
        AND opponent_address IS NOT NULL
        AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((sameTargetCount as any).count >= 2) {
      return { valid: false, error: 30131, message: '同一天攻击同一个玩家不能超过2次' };
    }

    // 检查累计攻击低级别玩家次数
    const lowLevelCount: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM battle_records 
      WHERE wallet_address = ? 
        AND result = 'win'
        AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((lowLevelCount as any).count >= 5) {
      return { valid: false, error: 30132, message: '同一天累计攻击低级别玩家不能超过5次' };
    }

    return { valid: true };
  }

  // ============ 格式化 ============

  private formatBattleRecord(record: any) {
    return {
      id: record.id,
      battleType: record.battle_type,
      opponentAddress: record.opponent_address,
      opponentName: record.opponent_name,
      result: record.result,
      rounds: record.rounds,
      attackerPower: record.attacker_power,
      defenderPower: record.defender_power,
      attackerLoss: record.attacker_loss,
      defenderLoss: record.defender_loss,
      expReward: record.exp_reward,
      goldReward: record.gold_reward,
      createdAt: record.created_at,
    };
  }
}

export const fightService = {
  create(db: D1Database) {
    return new FightService(db);
  },

  // 静态方法
  calculateBattle(params: any) {
    const service = new FightService(null as any);
    return service.calculateBattle(params);
  },

  async recordBattle(db: D1Database, walletAddress: string, battle: any) {
    const service = new FightService(db);
    return service.recordBattle(walletAddress, battle);
  },

  async getBattleRecords(db: D1Database, walletAddress: string, options?: any) {
    const service = new FightService(db);
    return service.getBattleRecords(walletAddress, options);
  },

  async getBattleById(db: D1Database, walletAddress: string, battleId: number) {
    const service = new FightService(db);
    return service.getBattleById(walletAddress, battleId);
  },

  async getTodayBattleStats(db: D1Database, walletAddress: string) {
    const service = new FightService(db);
    return service.getTodayBattleStats(walletAddress);
  },

  async checkTargetState(db: D1Database, walletAddress: string, cityId: number, targetPos: number) {
    const service = new FightService(db);
    return service.checkTargetState(walletAddress, cityId, targetPos);
  },

  async checkAttackLimit(db: D1Database, walletAddress: string, targetPos: number) {
    const service = new FightService(db);
    return service.checkAttackLimit(walletAddress, targetPos);
  },
};

export default fightService;
