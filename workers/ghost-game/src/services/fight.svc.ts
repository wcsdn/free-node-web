/**
 * Fight Service - 战斗业务逻辑层
 * 从 jx/BLL/Fight.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { BattleRecord, ServiceResult } from '../types/models';

// 兵种相克表 (全局常量)
const UNIT_COUNTER: { [key: string]: string } = {
  '骑兵': '步兵',
  '步兵': '弓兵',
  '弓兵': '骑兵',
  '攻城': '城防',
  '城防': '攻城',
};

export const fightService = {
  /**
   * 计算战斗结果
   * 简化版战斗系统：基于攻击力、防御力、兵种相克
   */
  calculateBattle(params: {
    attackerPower: number;  // 攻击力
    defenderPower: number;  // 防御力
    attackerCount: number;  // 进攻兵力
    defenderCount: number;  // 防守兵力
    attackerType: string;   // 兵种
    defenderType: string;   // 防守兵种
  }): {
    winner: 'attacker' | 'defender' | 'draw';
    attackerLoss: number;
    defenderLoss: number;
    attackerRemaining: number;
    defenderRemaining: number;
  } {
    let attackerBonus = 1;
    let defenderBonus = 1;

    if (params.defenderType === UNIT_COUNTER[params.attackerType]) {
      attackerBonus = 1.5;
    }
    if (params.attackerType === UNIT_COUNTER[params.defenderType]) {
      defenderBonus = 1.5;
    }

    // 计算伤害
    const attackerDamage = (params.attackerPower * attackerBonus) / Math.max(1, params.defenderPower * 0.5);
    const defenderDamage = (params.defenderPower * defenderBonus) / Math.max(1, params.attackerPower * 0.5);

    // 计算损失
    const attackerLoss = Math.floor(Math.random() * 10 * attackerDamage);
    const defenderLoss = Math.floor(Math.random() * 10 * defenderDamage);

    return {
      winner: attackerLoss > defenderLoss ? 'defender' : attackerLoss < defenderLoss ? 'attacker' : 'draw',
      attackerLoss: Math.min(attackerLoss, params.attackerCount),
      defenderLoss: Math.min(defenderLoss, params.defenderCount),
      attackerRemaining: params.attackerCount - Math.min(attackerLoss, params.attackerCount),
      defenderRemaining: params.defenderCount - Math.min(defenderLoss, params.defenderCount),
    };
  },

  /**
   * 记录战斗结果
   */
  async recordBattle(
    db: D1Database,
    walletAddress: string,
    battle: BattleRecord
  ): Promise<ServiceResult<BattleRecord>> {
    try {
      const now = new Date().toISOString();
      
      await db.prepare(`
        INSERT INTO battle_records (wallet_address, battle_type, opponent_id, result, attacker_power, defender_power, attacker_loss, defender_loss, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        walletAddress,
        battle.battle_type,
        battle.opponent_id,
        battle.result,
        battle.attacker_power,
        battle.defender_power,
        battle.attacker_loss,
        battle.defender_loss,
        now
      ).run();

      return { ok: true, data: battle };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /**
   * 获取战斗记录
   */
  async getBattleRecords(
    db: D1Database,
    walletAddress: string,
    limit = 10
  ): Promise<ServiceResult<BattleRecord[]>> {
    try {
      const result = await db.prepare(`
        SELECT * FROM battle_records WHERE wallet_address = ? ORDER BY created_at DESC LIMIT ?
      `).bind(walletAddress, limit).all();
      
      return { ok: true, data: (result.results || []) as unknown as BattleRecord[] };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  }
};
