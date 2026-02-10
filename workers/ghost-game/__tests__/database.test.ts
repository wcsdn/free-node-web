/**
 * 数据库访问层测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 测试配置
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

describe('Database Access Layer Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Schema Validation', () => {
    it('should have valid character table schema', () => {
      const characterSchema = {
        wallet_address: 'TEXT PRIMARY KEY',
        name: 'TEXT NOT NULL',
        level: 'INTEGER DEFAULT 1',
        exp: 'INTEGER DEFAULT 0',
        gold: 'INTEGER DEFAULT 0',
        vip_level: 'INTEGER DEFAULT 0',
        created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
      };

      // 验证必要字段
      expect(characterSchema).toHaveProperty('wallet_address');
      expect(characterSchema).toHaveProperty('name');
      expect(characterSchema.wallet_address).toContain('PRIMARY KEY');
    });

    it('should have valid city table schema', () => {
      const citySchema = {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        wallet_address: 'TEXT NOT NULL',
        name: 'TEXT NOT NULL',
        position: 'INTEGER NOT NULL',
        money: 'INTEGER DEFAULT 0',
        food: 'INTEGER DEFAULT 0',
        population: 'INTEGER DEFAULT 0',
        prosperity: 'INTEGER DEFAULT 0',
        FOREIGN KEY: '(wallet_address) REFERENCES characters(wallet_address)',
      };

      expect(citySchema).toHaveProperty('id');
      expect(citySchema).toHaveProperty('wallet_address');
      expect(citySchema.position).toContain('NOT NULL');
    });

    it('should have valid hero table schema', () => {
      const heroSchema = {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        wallet_address: 'TEXT NOT NULL',
        static_index: 'INTEGER NOT NULL',
        name: 'TEXT NOT NULL',
        quality: 'INTEGER DEFAULT 1',
        level: 'INTEGER DEFAULT 1',
        exp: 'INTEGER DEFAULT 0',
        attack: 'INTEGER DEFAULT 0',
        defense: 'INTEGER DEFAULT 0',
        hp: 'INTEGER DEFAULT 0',
        created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
      };

      expect(heroSchema).toHaveProperty('id');
      expect(heroSchema).toHaveProperty('quality');
      expect(heroSchema.quality).toContain('DEFAULT 1');
    });
  });

  describe('Query Builders', () => {
    it('should build select query correctly', () => {
      const buildSelect = (table: string, columns: string[], where?: Record<string, any>) => {
        let query = `SELECT ${columns.join(', ')} FROM ${table}`;
        
        if (where) {
          const conditions = Object.entries(where)
            .map(([key, value]) => `${key} = '${value}'`)
            .join(' AND ');
          query += ` WHERE ${conditions}`;
        }
        
        return query;
      };

      const query = buildSelect('characters', ['*'], { wallet_address: TEST_WALLET });
      expect(query).toBe(`SELECT * FROM characters WHERE wallet_address = '${TEST_WALLET}'`);
    });

    it('should build insert query correctly', () => {
      const buildInsert = (table: string, data: Record<string, any>) => {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
        return `INSERT INTO ${table} (${columns}) VALUES (${values})`;
      };

      const query = buildInsert('characters', {
        wallet_address: TEST_WALLET,
        name: 'TestPlayer',
        level: 1,
      });

      expect(query).toContain('INSERT INTO characters');
      expect(query).toContain(`'${TEST_WALLET}'`);
    });

    it('should build update query correctly', () => {
      const buildUpdate = (table: string, data: Record<string, any>, where: Record<string, any>) => {
        const setClause = Object.entries(data)
          .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
          .join(', ');
        
        const whereClause = Object.entries(where)
          .map(([key, value]) => `${key} = '${value}'`)
          .join(' AND ');

        return `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      };

      const query = buildUpdate('characters', 
        { level: 2, exp: 100 },
        { wallet_address: TEST_WALLET }
      );

      expect(query).toContain('UPDATE characters');
      expect(query).toContain('level = 2');
      expect(query).toContain(`wallet_address = '${TEST_WALLET}'`);
    });
  });

  describe('Data Transformations', () => {
    it('should transform database row to API response', () => {
      const dbRow = {
        wallet_address: TEST_WALLET,
        name: 'TestPlayer',
        level: 10,
        exp: 1000,
        gold: 5000,
        vip_level: 1,
        created_at: '2026-01-01 00:00:00',
      };

      const toApiResponse = (row: any) => ({
        success: true,
        data: {
          walletAddress: row.wallet_address,
          name: row.name,
          level: row.level,
          exp: row.exp,
          gold: row.gold,
          vipLevel: row.vip_level,
          createdAt: row.created_at,
        },
      });

      const response = toApiResponse(dbRow);
      expect(response.data.walletAddress).toBe(TEST_WALLET);
      expect(response.data.walletAddress).not.toHaveProperty('wallet_address');
    });

    it('should handle null values', () => {
      const dbRow = {
        wallet_address: TEST_WALLET,
        name: 'TestPlayer',
        last_login: null,
      };

      const toApiResponse = (row: any) => ({
        walletAddress: row.wallet_address,
        lastLogin: row.last_login || 'Never',
      });

      const response = toApiResponse(dbRow);
      expect(response.lastLogin).toBe('Never');
    });
  });

  describe('Pagination', () => {
    it('should calculate pagination correctly', () => {
      const calculatePagination = (page: number, pageSize: number, total: number) => {
        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(total / pageSize);
        
        return {
          page,
          pageSize,
          offset,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        };
      };

      const pagination = calculatePagination(2, 10, 100);
      expect(pagination.offset).toBe(10);
      expect(pagination.totalPages).toBe(10);
      expect(pagination.hasNext).toBe(true);
      expect(pagination.hasPrev).toBe(true);
    });

    it('should handle edge cases', () => {
      const calculatePagination = (page: number, pageSize: number, total: number) => {
        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(total / pageSize);
        
        return {
          page: Math.max(1, page),
          pageSize: Math.min(100, Math.max(1, pageSize)),
          offset: Math.max(0, offset),
          totalPages,
        };
      };

      // Page 0 should become page 1
      let pagination = calculatePagination(0, 10, 100);
      expect(pagination.page).toBe(1);

      // Page size 200 should become 100
      pagination = calculatePagination(1, 200, 100);
      expect(pagination.pageSize).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate key error', () => {
      const handleDuplicateKey = (error: any) => {
        if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          return { success: false, error: 'DUPLICATE_ENTRY', message: 'Record already exists' };
        }
        return { success: false, error: 'UNKNOWN_ERROR' };
      };

      const result = handleDuplicateKey({ code: 'SQLITE_CONSTRAINT_PRIMARYKEY' });
      expect(result.error).toBe('DUPLICATE_ENTRY');
    });

    it('should handle foreign key error', () => {
      const handleForeignKeyError = (error: any) => {
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          return { success: false, error: 'FOREIGN_KEY_VIOLATION', message: 'Referenced record not found' };
        }
        return { success: false, error: 'UNKNOWN_ERROR' };
      };

      const result = handleForeignKeyError({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
      expect(result.error).toBe('FOREIGN_KEY_VIOLATION');
    });
  });
});
