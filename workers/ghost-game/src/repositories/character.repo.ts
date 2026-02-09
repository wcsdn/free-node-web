/**
 * Character Repository - 角色数据访问层
 * 原则：只负责 SQL 操作，不包含业务逻辑
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { Character, CharacterCreate } from '../models';

// ============ Base Operations ============
export const characterRepo = {
  /**
   * 根据钱包地址查找角色
   */
  async findByWallet(db: D1Database, walletAddress: string): Promise<Character | null> {
    const result = await db.prepare(`
      SELECT * FROM characters WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return result as unknown as Character | null;
  },

  /**
   * 创建新角色
   */
  async create(db: D1Database, data: CharacterCreate): Promise<Character> {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO characters (wallet_address, name, level, exp, gold, vip_level, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.wallet_address,
      data.name,
      data.level ?? 1,
      data.exp ?? 0,
      data.gold ?? 1000,
      data.vip_level ?? 0,
      now,
      now
    ).run();

    return this.findByWallet(db, data.wallet_address) as Promise<Character>;
  },

  /**
   * 更新角色
   */
  async update(
    db: D1Database,
    walletAddress: string,
    updates: Partial<Pick<Character, 'name' | 'level' | 'exp' | 'gold' | 'vip_level'>>
  ): Promise<boolean> {
    const setClause: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      setClause.push('name = ?');
      values.push(updates.name);
    }
    if (updates.level !== undefined) {
      setClause.push('level = ?');
      values.push(updates.level);
    }
    if (updates.exp !== undefined) {
      setClause.push('exp = ?');
      values.push(updates.exp);
    }
    if (updates.gold !== undefined) {
      setClause.push('gold = ?');
      values.push(updates.gold);
    }
    if (updates.vip_level !== undefined) {
      setClause.push('vip_level = ?');
      values.push(updates.vip_level);
    }

    setClause.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(walletAddress);

    const result = await db.prepare(`
      UPDATE characters SET ${setClause.join(', ')} WHERE wallet_address = ?
    `).bind(...values).run();

    return result.success;
  },

  /**
   * 增加经验
   */
  async addExp(db: D1Database, walletAddress: string, exp: number): Promise<{ levelUp: boolean; newLevel: number }> {
    const character = await this.findByWallet(db, walletAddress);
    if (!character) return { levelUp: false, newLevel: 0 };

    const newExp = character.exp + exp;
    // 简单升级逻辑: 每500经验一级
    const newLevel = Math.floor(newExp / 500) + 1;

    await db.prepare(`
      UPDATE characters SET exp = ?, level = ?, updated_at = ? WHERE wallet_address = ?
    `).bind(newExp, newLevel, new Date().toISOString(), walletAddress).run();

    return { levelUp: newLevel > character.level, newLevel };
  },

  /**
   * 增加金币
   */
  async addGold(db: D1Database, walletAddress: string, amount: number): Promise<boolean> {
    const result = await db.prepare(`
      UPDATE characters SET gold = gold + ?, updated_at = ? WHERE wallet_address = ?
    `).bind(amount, new Date().toISOString(), walletAddress).run();
    return result.success;
  },

  /**
   * 扣除金币
   */
  async deductGold(db: D1Database, walletAddress: string, amount: number): Promise<boolean> {
    const character = await this.findByWallet(db, walletAddress);
    if (!character || character.gold < amount) return false;

    const result = await db.prepare(`
      UPDATE characters SET gold = gold - ?, updated_at = ? WHERE wallet_address = ?
    `).bind(amount, new Date().toISOString(), walletAddress).run();
    return result.success;
  },
};
