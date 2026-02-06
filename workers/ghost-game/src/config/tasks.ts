/**
 * 任务配置
 */

export const TASK_TYPES = {
  daily: { name: '日常任务', refreshDay: 1, maxTasks: 5 },
  main: { name: '主线任务', refreshDay: null, maxTasks: null },
  achievement: { name: '成就任务', refreshDay: null, maxTasks: null },
} as const;

// 任务条件类型映射
export const CONDITION_CHECKERS: Record<string, (walletAddress: string, db: D1Database, ...args: any[]) => Promise<number>> = {
  async hero_count(walletAddress, db) {
    const result = await db
      .prepare('SELECT COUNT(*) as count FROM heroes WHERE wallet_address = ?')
      .bind(walletAddress)
      .first<{count: number}>();
    return result?.count || 0;
  },
  async building_count(walletAddress, db) {
    const result = await db
      .prepare('SELECT COUNT(*) as count FROM buildings WHERE wallet_address = ?')
      .bind(walletAddress)
      .first<{count: number}>();
    return result?.count || 0;
  },
  async battle_win(walletAddress, db) {
    const result = await db
      .prepare("SELECT COUNT(*) as count FROM battles WHERE attacker_address = ? AND result = 'win'")
      .bind(walletAddress)
      .first<{count: number}>();
    return result?.count || 0;
  },
  async battle_count(walletAddress, db) {
    const result = await db
      .prepare('SELECT COUNT(*) as count FROM battles WHERE attacker_address = ?')
      .bind(walletAddress)
      .first<{count: number}>();
    return result?.count || 0;
  },
};

export type TaskType = keyof typeof TASK_TYPES;
