/**
 * 繁荣度系统路由
 * 
 * 实现 CityInterior.cs 的核心功能：
 * - 繁荣度计算
 * - 人口增长
 * - 资源上限
 * - 繁荣度等级
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyWalletAuth } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

function success(c: any, data: any) {
  return c.json({ success: true, data });
}

function error(c: any, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

// ==================== 繁荣度等级配置 ====================

// 繁荣度等级阈值 (从 C# 代码移植)
export const PROSPERITY_LEVEL_THRESHOLDS = [
  150,    // 1级
  350,    // 2级
  600,    // 3级
  900,    // 4级
  1300,   // 5级
  1800,   // 6级
  2500,   // 7级
  3500,   // 8级
  4800,   // 9级
  6500,   // 10级
  8800,   // 11级
  11900,  // 12级
  16200,  // 13级
  22000,  // 14级
  29800,  // 15级
  40400,  // 16级
  54700,  // 17级
  74000,  // 18级
  100000, // 19级
];

// 繁荣度等级名称
export const PROSPERITY_LEVEL_NAMES = [
  '平民', '秀才', '举人', '进士', '知县',
  '知府', '道台', '按察使', '布政使', '巡抚',
  '总督', '提督', '将军', '都督', '司马',
  '太尉', '司空', '司徒', '丞相', '皇帝',
];

// ==================== 核心函数 ====================

/**
 * 繁荣度转换为等级
 */
export function prosperityToLevel(prosperity: number): number {
  let level = 1;
  for (let i = 0; i < PROSPERITY_LEVEL_THRESHOLDS.length; i++) {
    if (PROSPERITY_LEVEL_THRESHOLDS[i] > prosperity) {
      level = i + 1;
      break;
    }
  }
  // 超过最大值
  if (prosperity >= PROSPERITY_LEVEL_THRESHOLDS[PROSPERITY_LEVEL_THRESHOLDS.length - 1]) {
    level = PROSPERITY_LEVEL_THRESHOLDS.length + 1;
  }
  return level;
}

/**
 * 等级转换为繁荣度阈值
 */
export function levelToProsperityThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level > PROSPERITY_LEVEL_THRESHOLDS.length + 1) {
    return PROSPERITY_LEVEL_THRESHOLDS[PROSPERITY_LEVEL_THRESHOLDS.length - 1];
  }
  return PROSPERITY_LEVEL_THRESHOLDS[level - 2];
}

/**
 * 获取等级名称
 */
export function getLevelName(level: number): string {
  const index = Math.min(level - 1, PROSPERITY_LEVEL_NAMES.length - 1);
  return PROSPERITY_LEVEL_NAMES[index];
}

// ==================== API 端点 ====================

// 获取繁荣度信息
app.get('/info', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  if (!city_id) return error(c, 'Missing city_id');

  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    const city = await db.prepare(`
      SELECT * FROM cities WHERE id = ? AND wallet_address = ?
    `).bind(parseInt(city_id), walletAddress).first();

    if (!city) return error(c, 'City not found', 404);

    // 计算繁荣度
    const prosperity = (city as any).prosperity || 0;
    const level = prosperityToLevel(prosperity);

    return success(c, {
      cityId: city.id,
      cityName: city.name,
      prosperity,
      level,
      levelName: getLevelName(level),
      nextLevelThreshold: levelToProsperityThreshold(level + 1),
      thresholds: PROSPERITY_LEVEL_THRESHOLDS,
      names: PROSPERITY_LEVEL_NAMES,
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取等级信息
app.get('/level', async (c) => {
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return error(c, 'Unauthorized', 401);

  const { city_id } = c.req.query();
  const db = c.env.DB;
  if (!db) return error(c, 'Database not configured', 503);

  try {
    let prosperity: number;

    if (city_id) {
      const city = await db.prepare(`
        SELECT prosperity FROM cities WHERE id = ? AND wallet_address = ?
      `).bind(parseInt(city_id), walletAddress).first();

      if (!city) return error(c, 'City not found', 404);
      prosperity = (city as any).prosperity || 0;
    } else {
      // 取所有城市的繁荣度总和
      const result = await db.prepare(`
        SELECT SUM(prosperity) as total FROM cities WHERE wallet_address = ?
      `).bind(walletAddress).first();
      prosperity = (result as any).total || 0;
    }

    const level = prosperityToLevel(prosperity);

    return success(c, {
      prosperity,
      level,
      levelName: getLevelName(level),
      title: PROSPERITY_LEVEL_NAMES[Math.min(level - 1, PROSPERITY_LEVEL_NAMES.length - 1)],
    });
  } catch (err: any) {
    return error(c, err.message);
  }
});

// 获取繁荣度等级表
app.get('/levels', async (c) => {
  const levels = PROSPERITY_LEVEL_THRESHOLDS.map((threshold, index) => ({
    level: index + 1,
    name: PROSPERITY_LEVEL_NAMES[index],
    prosperityRequired: threshold,
  }));

  return success(c, {
    levels,
    maxLevel: PROSPERITY_LEVEL_THRESHOLDS.length + 1,
    maxProsperity: PROSPERITY_LEVEL_THRESHOLDS[PROSPERITY_LEVEL_THRESHOLDS.length - 1],
  });
});

// ==================== 繁荣度计算 ====================

// 计算资源上限（基于繁荣度等级）
export function calculateResourceLimits(level: number): {
  money: number;
  food: number;
  population: number;
} {
  // 基础值
  const baseMoney = 3000;
  const baseFood = 3000;
  const basePopulation = 300;

  // 等级加成 (每级 +20%)
  const multiplier = 1 + (level - 1) * 0.2;

  return {
    money: Math.floor(baseMoney * multiplier),
    food: Math.floor(baseFood * multiplier),
    population: Math.floor(basePopulation * multiplier),
  };
}

// 计算资源增长率（基于繁荣度）
export function calculateGrowthRates(prosperity: number): {
  moneyRate: number;
  foodRate: number;
  populationRate: number;
} {
  // 基础增长率
  const baseRate = 99;

  // 繁荣度加成 (每100繁荣度 +5%)
  const prosperityBonus = Math.floor(prosperity / 100) * 5;

  const rate = Math.min(baseRate + prosperityBonus, 500); // 上限500

  return {
    moneyRate: rate,
    foodRate: rate,
    populationRate: rate,
  };
}

// ==================== 工具函数 ====================

// 获取用户所有城市的总繁荣度
export async function getTotalProsperity(db: any, walletAddress: string): Promise<number> {
  const result = await db.prepare(`
    SELECT SUM(prosperity) as total FROM cities WHERE wallet_address = ?
  `).bind(walletAddress).first();

  return (result as any).total || 0;
}

// 获取用户等级（基于总繁荣度）
export async function getUserLevel(db: any, walletAddress: string): Promise<number> {
  const prosperity = await getTotalProsperity(db, walletAddress);
  return prosperityToLevel(prosperity);
}

export default app;
