/**
 * WebGame 配置文件
 */

// 游戏常量
export const GAME_CONFIG = {
  // 地图尺寸
  MAP_WIDTH: 20,
  MAP_HEIGHT: 15,
  
  // 单位类型
  UNIT_TYPES: {
    WARRIOR: { name: '战士', nameEn: 'Warrior', icon: '⚔️', hp: 100, attack: 20, defense: 10, cost: 50 },
    ARCHER: { name: '弓箭手', nameEn: 'Archer', icon: '🏹', hp: 80, attack: 25, defense: 5, cost: 60 },
    MAGE: { name: '法师', nameEn: 'Mage', icon: '🔮', hp: 60, attack: 35, defense: 3, cost: 80 },
    TANK: { name: '坦克', nameEn: 'Tank', icon: '🛡️', hp: 150, attack: 15, defense: 20, cost: 100 },
  },
  
  // 资源
  INITIAL_GOLD: 500,
  GOLD_PER_TURN: 100,
  
  // 游戏状态
  MAX_TURNS: 50,
} as const;

// API 端点
export const API_ENDPOINTS = {
  SAVE_GAME: 'https://core.free-node.xyz/api/webgame/save',
  LOAD_GAME: 'https://core.free-node.xyz/api/webgame/load',
  LEADERBOARD: 'https://core.free-node.xyz/api/webgame/leaderboard',
} as const;
