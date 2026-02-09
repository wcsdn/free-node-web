/**
 * Hero Service - 武将业务逻辑层
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { ServiceResult } from '../models';
import { heroRepo } from '../repositories';

export const heroService = {
  /** 获取武将列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<any[]>> {
    try {
      const heroes = await heroRepo.findByWallet(db, walletAddress);
      return { ok: true, data: heroes.map(h => ({
        id: h.id,
        name: h.name,
        quality: h.quality,
        level: h.level,
        hp: h.hp,
        maxHp: h.max_hp,
        atk: h.atk,
        def: h.def,
        skill: h.skill,
        state: h.state,
      }))};
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取武将详情 */
  async getDetail(db: D1Database, heroId: number): Promise<ServiceResult<any>> {
    try {
      const hero = await heroRepo.findById(db, heroId);
      if (!hero) return { ok: false, error: 'Hero not found', status: 404 };
      return { ok: true, data: hero };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 招募武将 */
  async recruit(db: D1Database, walletAddress: string, cityId: number, name: string): Promise<ServiceResult<any>> {
    try {
      const hero = await heroRepo.create(db, { city_id: cityId, wallet_address: walletAddress, name });
      if (!hero) return { ok: false, error: 'Failed to create hero', status: 500 };
      return { ok: true, data: { id: hero.id, name: hero.name, quality: hero.quality } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 升级武将 */
  async levelUp(db: D1Database, heroId: number): Promise<ServiceResult<any>> {
    try {
      const hero = await heroRepo.levelUp(db, heroId);
      if (!hero) return { ok: false, error: 'Failed to level up', status: 400 };
      return { ok: true, data: { level: hero.level, hp: hero.hp, atk: hero.atk } };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 设置技能 */
  async setSkill(db: D1Database, heroId: number, skill: string): Promise<ServiceResult<null>> {
    try {
      const success = await heroRepo.setSkill(db, heroId, skill);
      if (!success) return { ok: false, error: 'Failed to set skill', status: 500 };
      return { ok: true, data: null };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
