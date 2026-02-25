/**
 * Base Repository - 基础数据仓储类
 * 提供通用的 CRUD 操作
 */
import type { D1Database, D1Result } from '@cloudflare/workers-types';

export interface BaseEntity {
  id?: number;
  created_at?: string;
  updated_at?: string;
}

export class BaseRepository<T extends BaseEntity> {
  protected db: D1Database;
  protected tableName: string;

  constructor(db: D1Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // ==================== 查询操作 ====================

  /** 根据ID查询 */
  async findById(id: number): Promise<T | null> {
    const result = await this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE id = ?`
    ).bind(id).first<T>();
    return result;
  }

  /** 查询所有 */
  async findAll(): Promise<T[]> {
    const result = await this.db.prepare(
      `SELECT * FROM ${this.tableName}`
    ).all<T>();
    return (result.results as T[]) || [];
  }

  /** 条件查询 */
  async where(conditions: Record<string, any>): Promise<T[]> {
    const clauses = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(conditions);

    const result = await this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE ${clauses}`
    ).bind(...values).all<T>();

    return (result.results as T[]) || [];
  }

  /** 根据Wallet查询 - 子类可覆盖 */
  async findByWallet(walletAddress: string): Promise<T | T[] | null> {
    const result = await this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE wallet_address = ?`
    ).bind(walletAddress).first<T>();
    return result;
  }

  /** IN 查询 */
  async findByIds(ids: number[]): Promise<T[]> {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(', ');
    const result = await this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE id IN (${placeholders})`
    ).bind(...ids).all<T>();

    return (result.results as T[]) || [];
  }

  /** 统计数量 */
  async count(whereConditions?: Record<string, any>): Promise<number> {
    if (!whereConditions) {
      const result = await this.db.prepare(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      ).first<{ count: number }>();
      return result?.count || 0;
    }

    const clauses = Object.keys(whereConditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(whereConditions);

    const result = await this.db.prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${clauses}`
    ).bind(...values).first<{ count: number }>();

    return result?.count || 0;
  }

  /** 分页查询 */
  async paginate(
    page: number = 1,
    pageSize: number = 20,
    orderBy: string = 'id',
    order: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;
    
    const dataResult = await this.db.prepare(
      `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`
    ).bind(pageSize, offset).all<T>();

    const total = await this.count();

    return {
      data: (dataResult.results as T[]) || [],
      total,
      page,
      pageSize,
    };
  }

  // ==================== 写入操作 ====================

  /** 插入单条记录 */
  async insert(data: Partial<T>): Promise<number> {
    const keys = Object.keys(data).filter(key => key !== 'id').join(', ');
    const placeholders = Object.keys(data).filter(key => key !== 'id').map(() => '?').join(', ');
    const values = Object.keys(data)
      .filter(key => key !== 'id')
      .map(key => data[key as keyof Partial<T>]);

    const result = await this.db.prepare(
      `INSERT INTO ${this.tableName} (${keys}) VALUES (${placeholders})`
    ).bind(...values).run();

    return result.meta.last_row_id;
  }

  /** 批量插入 */
  async bulkInsert(dataList: Partial<T>[]): Promise<number[]> {
    if (dataList.length === 0) return [];

    const ids: number[] = [];
    
    for (const data of dataList) {
      const id = await this.insert(data);
      ids.push(id);
    }

    return ids;
  }

  /** 更新记录 */
  async update(id: number, data: Partial<T>): Promise<boolean> {
    const clauses = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => data[key as keyof Partial<T>]);

    if (values.length === 0) return false;

    const result = await this.db.prepare(
      `UPDATE ${this.tableName} SET ${clauses}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();

    return result.meta.changes > 0;
  }

  /** 根据Wallet更新 */
  async updateByWallet(walletAddress: string, data: Partial<T>): Promise<boolean> {
    const clauses = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'wallet_address')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'wallet_address')
      .map(key => data[key as keyof Partial<T>]);

    if (values.length === 0) return false;

    const result = await this.db.prepare(
      `UPDATE ${this.tableName} SET ${clauses}, updated_at = datetime('now') WHERE wallet_address = ?`
    ).bind(...values, walletAddress).run();

    return result.meta.changes > 0;
  }

  /** 删除记录 */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE id = ?`
    ).bind(id).run();

    return result.meta.changes > 0;
  }

  /** 根据Wallet删除 */
  async deleteByWallet(walletAddress: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE wallet_address = ?`
    ).bind(walletAddress).run();

    return result.meta.changes > 0;
  }

  /** 批量删除 */
  async bulkDelete(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(', ');
    const result = await this.db.prepare(
      `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`
    ).bind(...ids).run();

    return result.meta.changes;
  }

  // ==================== 原子操作 ====================

  /** 字段自增 */
  async increment(id: number, field: string, delta: number = 1): Promise<boolean> {
    const result = await this.db.prepare(
      `UPDATE ${this.tableName} SET ${field} = ${field} + ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(delta, id).run();

    return result.meta.changes > 0;
  }

  /** 字段自减 */
  async decrement(id: number, field: string, delta: number = 1): Promise<boolean> {
    const result = await this.db.prepare(
      `UPDATE ${this.tableName} SET ${field} = ${field} - ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(delta, id).run();

    return result.meta.changes > 0;
  }

  // ==================== 事务操作 ====================

  /** 执行事务（多条语句） */
  async transaction(operations: (() => Promise<any>)[]): Promise<any[]> {
    const results: any[] = [];

    for (const operation of operations) {
      results.push(await operation());
    }

    return results;
  }
}
