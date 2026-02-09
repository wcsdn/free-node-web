/**
 * Hero Service - 武将业务逻辑层
 * 从 jx/BLL/Hero.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Hero, ServiceResult } from '../types/models';
import { heroRepo } from '../repositories';

export const heroService = {
  /** 获取武将列表 */
  async getList(db: D1Database, walletAddress: string): Promise<ServiceResult<Hero[]>> {
    try {
      const heroes = await heroRepo.findByWallet(db, walletAddress);
      return { ok: true, data: heroes };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取武将详情 */
  async getDetail(db: D1Database, heroId: number): Promise<ServiceResult<Hero>> {
    try {
      const hero = await heroRepo.findById(db, heroId);
      if (!hero) return { ok: false, error: 'Hero not found', status: 404 };
      return { ok: true, data: hero };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 根据城市获取武将列表 */
  async getByCity(db: D1Database, cityId: number): Promise<ServiceResult<Hero[]>> {
    try {
      const heroes = await heroRepo.findByCity(db, cityId);
      return { ok: true, data: heroes };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 招募武将 */
  async recruit(
    db: D1Database,
    walletAddress: string,
    cityId: number,
    name: string,
    quality?: number
  ): Promise<ServiceResult<Hero>> {
    try {
      // 检查城市武将数量限制
      const cityHeroes = await heroRepo.findByCity(db, cityId);
      if (cityHeroes.length >= 10) {
        return { ok: false, error: 'Max 10 heroes per city', status: 400 };
      }

      const hero = await heroRepo.create(db, {
        city_id: cityId,
        wallet_address: walletAddress,
        name,
        quality: quality ?? 1,
        level: 1,
        created_at: new Date().toISOString(),
      } as Hero);

      return { ok: true, data: hero! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 升级武将 */
  async levelUp(db: D1Database, heroId: number): Promise<ServiceResult<Hero>> {
    try {
      const hero = await heroRepo.levelUp(db, heroId);
      if (!hero) return { ok: false, error: 'Failed to level up', status: 400 };
      return { ok: true, data: hero };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 训练武将 */
  async train(db: D1Database, heroId: number): Promise<ServiceResult<Hero>> {
    try {
      const hero = await heroRepo.findById(db, heroId);
      if (!hero) return { ok: false, error: 'Hero not found', status: 404 };

      // 训练消耗资源
      const cost = 100; // 训练消耗100金币
      const expGain = 50; // 获得50经验

      // 扣钱
      await db.prepare(`
        UPDATE characters SET gold = gold - ? WHERE wallet_address = ? AND gold >= ?
      `).bind(cost, (hero as any).wallet_address, cost).run();

      // 获得经验
      await db.prepare(`
        UPDATE heroes SET exp = exp + ? WHERE id = ?
      `).bind(expGain, heroId).run();

      // 检查是否升级
      const updatedHero = await heroRepo.findById(db, heroId);
      return { ok: true, data: updatedHero! };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 设置技能 */
  async setSkill(db: D1Database, heroId: number, skill: string): Promise<ServiceResult<void>> {
    try {
      const success = await heroRepo.setSkill(db, heroId, skill);
      if (!success) return { ok: false, error: 'Failed to set skill', status: 500 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 更新武将状态 */
  async updateState(db: D1Database, heroId: number, state: number): Promise<ServiceResult<void>> {
    try {
      const success = await heroRepo.updateState(db, heroId, state);
      if (!success) return { ok: false, error: 'Failed to update state', status: 500 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 获取武将数量 */
  async count(db: D1Database, walletAddress: string): Promise<ServiceResult<number>> {
    try {
      const count = await heroRepo.countByWallet(db, walletAddress);
      return { ok: true, data: count };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },

  /** 删除武将 */
  async delete(db: D1Database, heroId: number): Promise<ServiceResult<void>> {
    try {
      const success = await heroRepo.delete(db, heroId);
      if (!success) return { ok: false, error: 'Failed to delete hero', status: 500 };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: (error as Error).message, status: 500 };
    }
  },
};
