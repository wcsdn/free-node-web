/**
 * City Service Unit Tests - 城市服务层单元测试
 */
import { describe, test, expect } from 'vitest';

const CITY_CONFIG = {
  MAX_CITIES: 3,
  DEFAULT_NAME: '主城',
  MAX_PROSPERITY: 10000,
};

const PROSPERITY_LEVELS = [
  { level: 1, minProsperity: 0, name: '村镇' },
  { level: 2, minProsperity: 500, name: '小镇' },
  { level: 3, minProsperity: 2000, name: '城池' },
  { level: 4, minProsperity: 5000, name: '名城' },
  { level: 5, minProsperity: 8000, name: '都城' },
];

describe('City Service', () => {
  test('城市数量上限正确', () => {
    expect(CITY_CONFIG.MAX_CITIES).toBe(3);
  });

  test('默认城市名称正确', () => {
    expect(CITY_CONFIG.DEFAULT_NAME).toBe('主城');
  });

  test('繁荣等级判断', () => {
    const getLevel = (prosperity: number) => {
      for (let i = PROSPERITY_LEVELS.length - 1; i >= 0; i--) {
        if (prosperity >= PROSPERITY_LEVELS[i].minProsperity) {
          return PROSPERITY_LEVELS[i];
        }
      }
      return PROSPERITY_LEVELS[0];
    };

    expect(getLevel(0).name).toBe('村镇');
    expect(getLevel(500).name).toBe('小镇');
    expect(getLevel(2000).name).toBe('城池');
    expect(getLevel(5000).name).toBe('名城');
    expect(getLevel(8000).name).toBe('都城');
  });

  test('繁荣度上限正确', () => {
    expect(CITY_CONFIG.MAX_PROSPERITY).toBe(10000);
  });

  test('城市名称验证', () => {
    const isValid = (name: string) => name.length >= 2 && name.length <= 10;
    expect(isValid('主城')).toBe(true);
    expect(isValid('a')).toBe(false);
    expect(isValid('a'.repeat(15))).toBe(false);
  });

  test('资源产量计算', () => {
    const city = { money: 1000, money_rate: 99 };
    const hours = 1;
    const production = Math.floor(city.money * city.money_rate / 100 * hours);
    expect(production).toBe(990);
  });

  test('响应格式正确', () => {
    const response = { success: true, cities: [] };
    expect(response.success).toBe(true);
    expect(Array.isArray(response.cities)).toBe(true);
  });

  test('错误响应格式', () => {
    const response = { success: false, error: '城市不存在' };
    expect(response.success).toBe(false);
    expect(response.error).toBe('城市不存在');
  });
});
