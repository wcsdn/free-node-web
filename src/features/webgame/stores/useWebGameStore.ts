/**
 * WebGame 状态管理
 */

import { create } from 'zustand';
import { GAME_CONFIG } from '../config';

export type UnitType = keyof typeof GAME_CONFIG.UNIT_TYPES;

export interface Unit {
  id: string;
  type: UnitType;
  x: number;
  y: number;
  hp: number;
  owner: 'player' | 'enemy';
}

export interface GameState {
  // 游戏数据
  gold: number;
  turn: number;
  units: Unit[];
  selectedUnit: string | null;
  gameStatus: 'idle' | 'playing' | 'victory' | 'defeat';
  
  // UI 状态
  loading: boolean;
  error: string | null;
  
  // 操作
  startGame: () => void;
  endTurn: () => void;
  spawnUnit: (type: UnitType, x: number, y: number) => void;
  moveUnit: (unitId: string, x: number, y: number) => void;
  selectUnit: (unitId: string | null) => void;
  attackUnit: (attackerId: string, targetId: string) => void;
  resetGame: () => void;
  setError: (error: string | null) => void;
}

export const useWebGameStore = create<GameState>((set, get) => ({
  // 初始状态
  gold: GAME_CONFIG.INITIAL_GOLD,
  turn: 1,
  units: [],
  selectedUnit: null,
  gameStatus: 'idle',
  loading: false,
  error: null,

  // 开始游戏
  startGame: () => {
    set({
      gameStatus: 'playing',
      gold: GAME_CONFIG.INITIAL_GOLD,
      turn: 1,
      units: [],
      selectedUnit: null,
      error: null,
    });
  },

  // 结束回合
  endTurn: () => {
    const { turn, gold, units } = get();
    
    // 检查游戏结束条件
    const playerUnits = units.filter(u => u.owner === 'player');
    const enemyUnits = units.filter(u => u.owner === 'enemy');
    
    if (playerUnits.length === 0) {
      set({ gameStatus: 'defeat' });
      return;
    }
    
    if (enemyUnits.length === 0) {
      set({ gameStatus: 'victory' });
      return;
    }
    
    if (turn >= GAME_CONFIG.MAX_TURNS) {
      set({ gameStatus: 'defeat' });
      return;
    }
    
    // 增加回合和金币
    set({
      turn: turn + 1,
      gold: gold + GAME_CONFIG.GOLD_PER_TURN,
      selectedUnit: null,
    });
  },

  // 生成单位
  spawnUnit: (type: UnitType, x: number, y: number) => {
    const { gold, units } = get();
    const unitConfig = GAME_CONFIG.UNIT_TYPES[type];
    
    // 检查金币
    if (gold < unitConfig.cost) {
      set({ error: '金币不足' });
      return;
    }
    
    // 检查位置是否被占用
    if (units.some(u => u.x === x && u.y === y)) {
      set({ error: '该位置已被占用' });
      return;
    }
    
    const newUnit: Unit = {
      id: `unit-${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
      hp: unitConfig.hp,
      owner: 'player',
    };
    
    set({
      units: [...units, newUnit],
      gold: gold - unitConfig.cost,
      error: null,
    });
  },

  // 移动单位
  moveUnit: (unitId: string, x: number, y: number) => {
    const { units } = get();
    
    // 检查目标位置是否被占用
    if (units.some(u => u.x === x && u.y === y)) {
      set({ error: '该位置已被占用' });
      return;
    }
    
    set({
      units: units.map(u => 
        u.id === unitId ? { ...u, x, y } : u
      ),
      error: null,
    });
  },

  // 选择单位
  selectUnit: (unitId: string | null) => {
    set({ selectedUnit: unitId });
  },

  // 攻击单位
  attackUnit: (attackerId: string, targetId: string) => {
    const { units } = get();
    
    const attacker = units.find(u => u.id === attackerId);
    const target = units.find(u => u.id === targetId);
    
    if (!attacker || !target) return;
    
    const attackerConfig = GAME_CONFIG.UNIT_TYPES[attacker.type];
    const targetConfig = GAME_CONFIG.UNIT_TYPES[target.type];
    
    // 计算伤害
    const damage = Math.max(1, attackerConfig.attack - targetConfig.defense);
    const newHp = target.hp - damage;
    
    // 更新单位状态
    set({
      units: units
        .map(u => u.id === targetId ? { ...u, hp: newHp } : u)
        .filter(u => u.hp > 0), // 移除死亡单位
      selectedUnit: null,
    });
  },

  // 重置游戏
  resetGame: () => {
    set({
      gold: GAME_CONFIG.INITIAL_GOLD,
      turn: 1,
      units: [],
      selectedUnit: null,
      gameStatus: 'idle',
      loading: false,
      error: null,
    });
  },

  // 设置错误
  setError: (error: string | null) => {
    set({ error });
  },
}));
