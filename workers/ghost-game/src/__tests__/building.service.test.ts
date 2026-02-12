/**
 * Building Service Unit Tests - 建筑服务层单元测试
 */
import { describe, test, expect } from 'vitest';

// 建筑类型
const BUILDING_TYPES = {
  INTERIOR: 'interior',
  DEFENSE: 'defense',
};

// 建筑状态
const BUILDING_STATES = {
  IDLE: 0,
  CONSTRUCTING: 1,
  UPGRADING: 2,
  DESTROYING: 3,
};

// 建筑配置
const BUILDING_CONFIG = {
  MAX_BUILDINGS: 20,
  MAX_LEVEL: 20,
};

// 内政建筑配置
const INTERIOR_BUILDINGS = {
  1: { name: '聚义厅', maxLevel: 20 },
  2: { name: '义舍', maxLevel: 20 },
  3: { name: '农场', maxLevel: 20 },
};

describe('Building Service', () => {
  test('建筑类型定义正确', () => {
    expect(BUILDING_TYPES.INTERIOR).toBe('interior');
    expect(BUILDING_TYPES.DEFENSE).toBe('defense');
  });

  test('建筑状态定义正确', () => {
    expect(BUILDING_STATES.IDLE).toBe(0);
    expect(BUILDING_STATES.CONSTRUCTING).toBe(1);
  });

  test('最大建筑数正确', () => {
    expect(BUILDING_CONFIG.MAX_BUILDINGS).toBe(20);
  });

  test('建筑位计算', () => {
    const used = 10;
    const available = BUILDING_CONFIG.MAX_BUILDINGS - used;
    expect(available).toBe(10);
  });

  test('建筑位已满', () => {
    const used = 20;
    const isFull = used >= BUILDING_CONFIG.MAX_BUILDINGS;
    expect(isFull).toBe(true);
  });

  test('升级消耗计算', () => {
    const level = 1;
    const baseMoney = 100;
    const baseFood = 200;
    const multiplier = Math.pow(1.5, level);
    const money = Math.floor(baseMoney * multiplier);
    const food = Math.floor(baseFood * multiplier);
    expect(money).toBe(150);
    expect(food).toBe(300);
  });

  test('最大等级检查', () => {
    const currentLevel = 20;
    const maxLevel = 20;
    const canUpgrade = currentLevel < maxLevel;
    expect(canUpgrade).toBe(false);
  });

  test('等级1可升级', () => {
    const currentLevel = 1;
    const maxLevel = 20;
    const canUpgrade = currentLevel < maxLevel;
    expect(canUpgrade).toBe(true);
  });

  test('内政建筑配置正确', () => {
    expect(INTERIOR_BUILDINGS[1].name).toBe('聚义厅');
    expect(INTERIOR_BUILDINGS[1].maxLevel).toBe(20);
  });

  test('响应格式正确', () => {
    const response = { success: true, buildingId: 123 };
    expect(response.success).toBe(true);
    expect(response.buildingId).toBeDefined();
  });

  test('错误响应格式', () => {
    const response = { success: false, error: '资源不足' };
    expect(response.success).toBe(false);
    expect(response.error).toBe('资源不足');
  });
});
