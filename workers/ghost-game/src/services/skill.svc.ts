/**
 * Skill Service - 技能业务逻辑层
 * 从 jx/BLL/Skill.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Skill, SkillConfig, ServiceResult } from '../types/models';
import { skillRepo } from '../repositories';

export const skillService = {
  /** 获取技能列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<Skill[]>> {
    try {
      const skills = await skillRepo.findByWallet(db, walletAddress);
      return { ok: true, data: skills };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取技能详情 */
  async getDetail(db: D1Database, skillId: number): Promise<ServiceResult<Skill>> {
    try {
      const skill = await skillRepo.findById(db, skillId);
      if (!skill) return { ok: false, error: 'Skill not found', status: 404 };
      return { ok: true, data: skill };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取技能配置列表 */
  async getConfigs(db: D1Database): Promise<ServiceResult<SkillConfig[]>> {
    try {
      const configs = await skillRepo.getConfigs(db);
      return { ok: true, data: configs };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 学习技能 */
  async learn(
    db: D1Database,
    walletAddress: string,
    staticIndex: number
  ): Promise<ServiceResult<Skill>> {
    try {
      // 检查是否已拥有该技能
      const existing = await skillRepo.findByWallet(db, walletAddress);
      const hasSkill = existing.some(s => s.static_index === staticIndex);
      if (hasSkill) {
        return { ok: false, error: 'Already have this skill', status: 400 };
      }

      const skill = await skillRepo.create(db, {
        wallet_address: walletAddress,
        static_index: staticIndex,
        skill_level: 1,
        exp: 0,
      } as Skill);

      return { ok: true, data: skill! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 升级技能 */
  async upgrade(db: D1Database, skillId: number): Promise<ServiceResult<Skill>> {
    try {
      const skill = await skillRepo.levelUp(db, skillId);
      if (!skill) return { ok: false, error: 'Upgrade failed', status: 400 };
      return { ok: true, data: skill };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
