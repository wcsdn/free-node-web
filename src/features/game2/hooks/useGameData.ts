/**
 * 游戏数据 Hook
 * 提供游戏状态的获取和更新
 */
import { useState, useCallback, useEffect } from 'react';
import type { GameState, CityData, HeroData, BuildingData, ResourceData } from '../types';
import { loadFullGameData } from '../services/gameApi';

// 开发模式配置
const DEV_MODE = import.meta.env.DEV === true;

// 默认城市数据
const getDefaultCity = (): CityData => ({
  id: 1,
  name: '临安城',
  level: 1,
  population: 1000,
  gold: 10000,
  food: 5000,
  wood: 3000,
  stone: 2000,
  iron: 1000,
});

// 默认武将数据
const getDefaultHeroes = (): HeroData[] => [
  { id: 1, name: '岳飞', level: 10, exp: 500, attack: 85, defense: 60, health: 100, skill: 75, status: 'idle' },
  { id: 2, name: '韩世忠', level: 8, exp: 300, attack: 70, defense: 55, health: 90, skill: 60, status: 'idle' },
  { id: 3, name: '张俊', level: 6, exp: 150, attack: 55, defense: 45, health: 75, skill: 40, status: 'resting' },
];

// 默认建筑数据
const getDefaultBuildings = (): BuildingData[] => [
  { id: 1, type: 'town_hall', name: '城主府', level: 5, maxLevel: 10, status: 'normal', position: { x: 5, y: 5 } },
  { id: 2, type: 'barracks', name: '兵营', level: 3, maxLevel: 10, status: 'normal', position: { x: 3, y: 5 } },
  { id: 3, type: 'academy', name: '校场', level: 2, maxLevel: 10, status: 'normal', position: { x: 7, y: 5 } },
  { id: 4, type: 'warehouse', name: '仓库', level: 4, maxLevel: 10, status: 'normal', position: { x: 5, y: 3 } },
  { id: 5, type: 'farm', name: '农田', level: 3, maxLevel: 10, status: 'normal', position: { x: 2, y: 7 } },
  { id: 6, type: 'lumber_mill', name: '伐木场', level: 2, maxLevel: 10, status: 'normal', position: { x: 8, y: 7 } },
  { id: 7, type: 'quarry', name: '采石场', level: 2, maxLevel: 10, status: 'upgrading', position: { x: 3, y: 8 } },
  { id: 8, type: 'iron_mine', name: '铁矿', level: 1, maxLevel: 10, status: 'normal', position: { x: 7, y: 8 } },
  { id: 9, type: 'market', name: '市场', level: 2, maxLevel: 10, status: 'normal', position: { x: 5, y: 7 } },
  { id: 10, type: 'wall', name: '城墙', level: 4, maxLevel: 10, status: 'normal', position: { x: 0, y: 5 } },
  { id: 11, type: 'watchtower', name: '瞭望塔', level: 2, maxLevel: 10, status: 'normal', position: { x: 10, y: 5 } },
  { id: 12, type: 'hospital', name: '医馆', level: 1, maxLevel: 10, status: 'normal', position: { x: 5, y: 9 } },
];

// 默认资源数据
const getDefaultResources = (): ResourceData => ({
  gold: 10000,
  food: 5000,
  wood: 3000,
  stone: 2000,
  iron: 1000,
});

// 初始游戏状态
const getDefaultGameState = (): GameState => ({
  playerId: 1,
  playerName: DEV_MODE ? '测试玩家' : '',
  city: getDefaultCity(),
  heroes: getDefaultHeroes(),
  buildings: getDefaultBuildings(),
  resources: getDefaultResources(),
  lastUpdate: Date.now(),
});

export interface UseGameDataReturn {
  gameState: GameState;
  isLoading: boolean;
  error: string | null;
  // 数据更新
  updateResources: (resources: Partial<ResourceData>) => void;
  updateHero: (heroId: number, data: Partial<HeroData>) => void;
  updateBuilding: (buildingId: number, data: Partial<BuildingData>) => void;
  upgradeBuilding: (buildingId: number) => void;
  // 刷新数据
  refreshData: () => Promise<void>;
  // 城市 ID
  cityId: number;
}

export function useGameData(): UseGameDataReturn {
  const [gameState, setGameState] = useState<GameState>(getDefaultGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityId, setCityId] = useState<number>(1);

  // 初始化 - 从 API 获取数据
  useEffect(() => {
    const initGame = async () => {
      if (!DEV_MODE) {
        setIsLoading(true);
        setError(null);
        try {
          const data = await loadFullGameData();
          if (data) {
            setGameState({
              ...data,
              lastUpdate: Date.now(),
            });
            setCityId(data.city.id);
          } else {
            setError('获取游戏数据失败');
          }
        } catch (err: any) {
          setError(err.message || '获取游戏数据失败');
          console.error('Game data fetch error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initGame();
  }, []);

  // 更新资源
  const updateResources = useCallback((resources: Partial<ResourceData>) => {
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, ...resources },
      lastUpdate: Date.now(),
    }));
  }, []);

  // 更新武将
  const updateHero = useCallback((heroId: number, data: Partial<HeroData>) => {
    setGameState(prev => ({
      ...prev,
      heroes: prev.heroes.map(hero =>
        hero.id === heroId ? { ...hero, ...data } : hero
      ),
      lastUpdate: Date.now(),
    }));
  }, []);

  // 更新建筑
  const updateBuilding = useCallback((buildingId: number, data: Partial<BuildingData>) => {
    setGameState(prev => ({
      ...prev,
      buildings: prev.buildings.map(building =>
        building.id === buildingId ? { ...building, ...data } : building
      ),
      lastUpdate: Date.now(),
    }));
  }, []);

  // 升级建筑
  const upgradeBuilding = useCallback((buildingId: number) => {
    setGameState(prev => ({
      ...prev,
      buildings: prev.buildings.map(building =>
        building.id === buildingId
          ? { ...building, level: building.level + 1, status: 'upgrading' as const }
          : building
      ),
      lastUpdate: Date.now(),
    }));
  }, []);

  // 刷新数据
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (DEV_MODE) {
        // 开发模式使用模拟数据
        setGameState(getDefaultGameState());
      } else {
        // 生产模式调用真实 API
        const data = await loadFullGameData();
        if (data) {
          setGameState({
            ...data,
            lastUpdate: Date.now(),
          });
          setCityId(data.city.id);
        } else {
          setError('刷新数据失败');
        }
      }
    } catch (err: any) {
      setError(err.message || '刷新数据失败');
      console.error('Game data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    gameState,
    isLoading,
    error,
    updateResources,
    updateHero,
    updateBuilding,
    upgradeBuilding,
    refreshData,
    cityId,
  };
}
