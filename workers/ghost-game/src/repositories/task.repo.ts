/**
 * Task Repository - 任务数据访问层
 */
import type { D1Database } from '@cloudflare/workers-types';

export const taskRepo = {
  /** 获取玩家任务进度 */
  async findByWallet(db: D1Database, walletAddress: string) {
    const result = await db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();
    return result;
  },

  /** 创建任务进度 */
  async create(db: D1Database, walletAddress: string, data: {
    mainId: number;
    mainIndex: number;
    taskIds: number[];
    taskStates: number[];
    taskProgress: number[];
  }) {
    await db.prepare(`
      INSERT INTO tasks (wallet_address, main_id, main_index, task_ids, task_states, task_progress)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      walletAddress,
      data.mainId,
      data.mainIndex,
      JSON.stringify(data.taskIds),
      JSON.stringify(data.taskStates),
      JSON.stringify(data.taskProgress)
    ).run();
  },

  /** 更新任务状态 */
  async updateStates(db: D1Database, walletAddress: string, taskStates: number[]) {
    await db.prepare(`
      UPDATE tasks SET task_states = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), walletAddress).run();
  },

  /** 更新任务进度 */
  async updateProgress(db: D1Database, walletAddress: string, taskProgress: number[]) {
    await db.prepare(`
      UPDATE tasks SET task_progress = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskProgress), walletAddress).run();
  },

  /** 更新任务状态和进度 */
  async updateStatesAndProgress(db: D1Database, walletAddress: string, taskStates: number[], taskProgress: number[]) {
    await db.prepare(`
      UPDATE tasks SET task_states = ?, task_progress = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(JSON.stringify(taskStates), JSON.stringify(taskProgress), walletAddress).run();
  },
};

export default taskRepo;
