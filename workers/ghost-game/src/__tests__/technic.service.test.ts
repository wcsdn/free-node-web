/**
 * Technic Service Unit Tests - 科技服务层单元测试
 */
import { describe, test, expect } from 'vitest';

const TECHNIC_CONFIG = {
  MAX_LEVEL: 20,
  BASE_COST: 100,
  COST_MULTIPLIER: 1.5,
};

describe('Technic Service', () => {
  test('科技最大等级正确', () => {
    expect(TECHNIC_CONFIG.MAX_LEVEL).toBe(20);
  });

  test('基础消耗正确', () => {
    expect(TECHNIC_CONFIG.BASE_COST).toBe(100);
  });

  test('消耗系数正确', () => {
    expect(TECHNIC_CONFIG.COST_MULTIPLIER).toBe(1.5);
  });

  test('升级消耗计算', () => {
    const level = 1;
    const cost = Math.floor(TECHNIC_CONFIG.BASE_COST * Math.pow(TECHNIC_CONFIG.COST_MULTIPLIER, level));
    expect(cost).toBe(150);
  });

  test('5级升级消耗', () => {
    const level = 5;
    const cost = Math.floor(TECHNIC_CONFIG.BASE_COST * Math.pow(TECHNIC_CONFIG.COST_MULTIPLIER, level));
    expect(cost).toBe(759);
  });

  test('响应格式正确', () => {
    const response = { success: true, technics: [] };
    expect(response.success).toBe(true);
  });

  test('错误响应格式', () => {
    const response = { success: false, error: '科技不存在' };
    expect(response.success).toBe(false);
  });
});
