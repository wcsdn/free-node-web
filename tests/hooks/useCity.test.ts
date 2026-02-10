/**
 * useCity Hook 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock API
const mockGetCityInfo = vi.fn();
const mockGetBuildingList = vi.fn();
const mockCollect = vi.fn();

vi.mock('../../src/features/webgame/services/api/cityApi', () => ({
  cityApi: {
    getCityInfo: mockGetCityInfo,
    getBuildingList: mockGetBuildingList,
    collect: mockCollect,
  },
}));

import { useCity, useCities } from '../../src/features/webgame/hooks/useCity';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCity', () => {
  const mockCityInfo = {
    id: 1,
    wallet_address: '0x1234567890abcdef',
    name: '测试城市',
    position: 1,
    prosperity: 1000,
    money: 5000,
    food: 3000,
    population: 1000,
    money_rate: 10,
    food_rate: 5,
    population_rate: 1,
    map_image: '',
    last_collect: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const mockBuildings = [
    { id: 1, city_id: 1, config_id: 1, level: 1, position: 1, status: 1 },
    { id: 2, city_id: 1, config_id: 2, level: 1, position: 2, status: 1 },
  ];

  it('应该初始加载城市信息', async () => {
    mockGetCityInfo.mockResolvedValue({
      success: true,
      data: mockCityInfo,
    });

    mockGetBuildingList.mockResolvedValue({
      success: true,
      data: mockBuildings,
    });

    const { result } = renderHook(() => useCity(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cityInfo).toEqual(mockCityInfo);
    expect(result.current.buildings).toEqual(mockBuildings);
  });

  it('应该在 API 错误时设置错误状态', async () => {
    mockGetCityInfo.mockResolvedValue({
      success: false,
      error: '获取城市信息失败',
    });

    mockGetBuildingList.mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useCity(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('获取城市信息失败');
    });
  });

  it('应该返回正确的建筑图标路径', () => {
    const { result } = renderHook(() => useCity(1));

    // Level 1-5: 无前缀
    expect(result.current.getBuildingIcon(1, 1)).toBe('2/b/m/1.GIF');
    expect(result.current.getBuildingIcon(1, 5)).toBe('2/b/m/5.GIF');

    // Level 6-10: a 前缀
    expect(result.current.getBuildingIcon(1, 6)).toBe('2/b/m/a6.GIF');
    expect(result.current.getBuildingIcon(1, 10)).toBe('2/b/m/a10.GIF');

    // Level 11-15: b 前缀
    expect(result.current.getBuildingIcon(1, 11)).toBe('2/b/m/b11.GIF');
    expect(result.current.getBuildingIcon(1, 15)).toBe('2/b/m/b15.GIF');

    // Level 16+: c 前缀，最大 20
    expect(result.current.getBuildingIcon(1, 16)).toBe('2/b/m/c16.GIF');
    expect(result.current.getBuildingIcon(1, 25)).toBe('2/b/m/c20.GIF');
  });

  it('应该返回正确的建筑名称', () => {
    const { result } = renderHook(() => useCity(1));

    expect(result.current.getBuildingName(1)).toBe('聚义厅');
    expect(result.current.getBuildingName(3)).toBe('银库');
    expect(result.current.getBuildingName(16)).toBe('城墙');
    expect(result.current.getBuildingName(999)).toBe('未知建筑');
  });

  it('当 cityId 为 undefined 时不应该加载', () => {
    const { result } = renderHook(() => useCity(undefined));

    expect(result.current.cityInfo).toBeNull();
    expect(result.current.buildings).toEqual([]);
    expect(mockGetCityInfo).not.toHaveBeenCalled();
  });
});

describe('useCities', () => {
  const mockCities = [
    {
      id: 1,
      wallet_address: '0x1234567890abcdef',
      name: '城市1',
      position: 1,
      prosperity: 1000,
      money: 5000,
      food: 3000,
      population: 1000,
      money_rate: 10,
      food_rate: 5,
      population_rate: 1,
      map_image: '',
      last_collect: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  it('应该加载城市列表', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: mockCities,
      }),
    });

    const { result, waitFor: waitForHook } = renderHook(() => useCities());

    await waitForHook(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cities).toEqual(mockCities);
  });
});
