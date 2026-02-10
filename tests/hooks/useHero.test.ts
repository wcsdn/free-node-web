/**
 * useHero Hook 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock gameApi before importing
const mockGetHeroList = vi.fn();
const mockGetHeroDetail = vi.fn();
const mockUpgradeHero = vi.fn();
const mockDismissHero = vi.fn();

vi.mock('../../src/features/webgame/services/gameApi', () => ({
  gameApi: {
    getHeroList: mockGetHeroList,
    getHeroDetail: mockGetHeroDetail,
    upgradeHero: mockUpgradeHero,
    dismissHero: mockDismissHero,
  },
}));

// Import after mocking
import { useHeroes, useHeroDetail, getHeroQualityColor, HERO_QUALITY_COLORS } from '../../src/features/webgame/hooks/useHero';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useHeroes', () => {
  const mockHeroes = [
    {
      id: 1,
      static_index: 101,
      name: '关羽',
      quality: 5,
      level: 30,
      exp: 10000,
      attack: 500,
      defense: 300,
      hp: 2000,
      skill_points: 5,
      hero_state: 1,
      weapon_id: 0,
      armor_id: 0,
      accessory_id: 0,
      mount_id: 0,
      soldiers: 1000,
      soldiers_max: 2000,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      static_index: 102,
      name: '张飞',
      quality: 4,
      level: 25,
      exp: 8000,
      attack: 400,
      defense: 250,
      hp: 1800,
      skill_points: 3,
      hero_state: 1,
      weapon_id: 0,
      armor_id: 0,
      accessory_id: 0,
      mount_id: 0,
      soldiers: 800,
      soldiers_max: 1500,
      created_at: new Date().toISOString(),
    },
  ];

  it('应该加载武将列表', async () => {
    mockGetHeroList.mockResolvedValue({
      success: true,
      data: mockHeroes,
    });

    const { result } = renderHook(() => useHeroes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.heroes).toEqual(mockHeroes);
    expect(result.current.error).toBeNull();
  });

  it('应该在 API 错误时设置错误状态', async () => {
    mockGetHeroList.mockResolvedValue({
      success: false,
      error: '获取武将列表失败',
    });

    const { result } = renderHook(() => useHeroes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('获取武将列表失败');
    });
  });

  it('应该正确获取武将详情', async () => {
    const mockHero = mockHeroes[0];
    
    mockGetHeroList.mockResolvedValue({
      success: true,
      data: mockHeroes,
    });

    mockGetHeroDetail.mockResolvedValue({
      success: true,
      data: mockHero,
    });

    const { result } = renderHook(() => useHeroes());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const hero = await result.current.getHeroDetail(1);
    
    expect(hero).toEqual(mockHero);
    expect(mockGetHeroDetail).toHaveBeenCalledWith(1);
  });

  it('应该正确升级武将', async () => {
    mockGetHeroList.mockResolvedValue({
      success: true,
      data: mockHeroes,
    });

    mockUpgradeHero.mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useHeroes());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.upgradeHero(1);
    
    expect(success).toBe(true);
    expect(mockUpgradeHero).toHaveBeenCalledWith(1);
  });

  it('应该正确解雇武将', async () => {
    mockGetHeroList.mockResolvedValue({
      success: true,
      data: mockHeroes,
    });

    mockDismissHero.mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useHeroes());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.dismissHero(1);
    
    expect(success).toBe(true);
    expect(mockDismissHero).toHaveBeenCalledWith(1);
  });
});

describe('useHeroDetail', () => {
  const mockHero = {
    id: 1,
    static_index: 101,
    name: '关羽',
    quality: 5,
    level: 30,
    exp: 10000,
    attack: 500,
    defense: 300,
    hp: 2000,
    skill_points: 5,
    hero_state: 1,
    weapon_id: 0,
    armor_id: 0,
    accessory_id: 0,
    mount_id: 0,
    soldiers: 1000,
    soldiers_max: 2000,
    created_at: new Date().toISOString(),
  };

  it('应该加载武将详情', async () => {
    mockGetHeroDetail.mockResolvedValue({
      success: true,
      data: mockHero,
    });

    const { result } = renderHook(() => useHeroDetail(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hero).toEqual(mockHero);
  });

  it('当 heroId 为 null 时不应该加载', () => {
    const { result } = renderHook(() => useHeroDetail(null));

    expect(result.current.hero).toBeNull();
    expect(mockGetHeroDetail).not.toHaveBeenCalled();
  });
});

describe('getHeroQualityColor', () => {
  it('应该返回正确的品质颜色', () => {
    expect(getHeroQualityColor(1)).toBe('#808080'); // 普通
    expect(getHeroQualityColor(2)).toBe('#4CAF50'); // 优秀
    expect(getHeroQualityColor(3)).toBe('#2196F3'); // 稀有
    expect(getHeroQualityColor(4)).toBe('#9C27B0'); // 史诗
    expect(getHeroQualityColor(5)).toBe('#FF9800'); // 传说
    expect(getHeroQualityColor(6)).toBe('#F44336'); // 神话
  });

  it('应该返回默认颜色用于未知品质', () => {
    expect(getHeroQualityColor(0)).toBe('#808080');
    expect(getHeroQualityColor(10)).toBe('#808080');
  });

  it('应该匹配预定义的品质颜色映射', () => {
    Object.entries(HERO_QUALITY_COLORS).forEach(([quality, color]) => {
      expect(getHeroQualityColor(parseInt(quality))).toBe(color);
    });
  });
});
