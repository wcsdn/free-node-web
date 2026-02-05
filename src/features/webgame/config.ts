/**
 * 游戏配置
 */

export const GAME_CONFIG = {
  // 地图配置
  MAP_WIDTH: 20,
  MAP_HEIGHT: 15,
  
  // 初始资源
  INITIAL_GOLD: 999999,
  INITIAL_MONEY: 3000,
  INITIAL_FOOD: 3000,
  INITIAL_POPULATION: 300,
  
  // 资源增长速度（每小时）
  MONEY_RATE: 99,
  FOOD_RATE: 99,
  POPULATION_RATE: 99,
  
  // 游戏回合
  GOLD_PER_TURN: 100,
  MAX_TURNS: 50,
  
  // 单位类型配置
  UNIT_TYPES: {
    warrior: {
      name: '战士',
      icon: '⚔️',
      hp: 100,
      attack: 20,
      defense: 10,
      cost: 50,
    },
    archer: {
      name: '弓箭手',
      icon: '🏹',
      hp: 80,
      attack: 25,
      defense: 5,
      cost: 60,
    },
    mage: {
      name: '法师',
      icon: '🔮',
      hp: 60,
      attack: 35,
      defense: 3,
      cost: 80,
    },
    tank: {
      name: '坦克',
      icon: '🛡️',
      hp: 150,
      attack: 15,
      defense: 20,
      cost: 100,
    },
  },
} as const;

export type UnitType = keyof typeof GAME_CONFIG.UNIT_TYPES;
