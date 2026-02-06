/**
 * 道具配置
 */

export const ITEM_TYPES = {
  equipment: { name: '装备', canEquip: true, canUse: false },
  consumable: { name: '消耗品', canEquip: false, canUse: true },
  material: { name: '材料', canEquip: false, canUse: false },
  reward: { name: '奖励', canEquip: false, canUse: false },
} as const;

export const ITEM_QUALITY = {
  1: { name: '普通', color: '#9ca3af' },
  2: { name: '优秀', color: '#4ade80' },
  3: { name: '精良', color: '#60a5fa' },
  4: { name: '史诗', color: '#a855f7' },
  5: { name: '传说', color: '#f59e0b' },
} as const;

export type ItemType = keyof typeof ITEM_TYPES;
