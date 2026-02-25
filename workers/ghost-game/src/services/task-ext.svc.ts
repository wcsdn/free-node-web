/**
 * Task System Extensions - 任务系统扩展
 * 从 jx/BLL/TaskEx.cs 迁移
 */

import type { D1Database } from '@cloudflare/workers-types';

// ==================== 常量配置 ====================

// 任务类型配置
export const TASK_TYPES = {
  MAIN: { id: 1, name: '主线任务', maxCount: 1 },
  BRANCH: { id: 2, name: '支线任务', maxCount: 5 },
  DAILY: { id: 3, name: '日常任务', maxCount: 10 },
  WEEKLY: { id: 4, name: '每周任务', maxCount: 7 },
  ACHIEVEMENT: { id: 5, name: '成就任务', maxCount: 20 },
  ACTIVITY: { id: 6, name: '活动任务', maxCount: 3 },
};

// 任务状态
export const TASK_STATES = {
  UNACCEPTED: 0,      // 未接受
  IN_PROGRESS: 1,    // 进行中
  COMPLETED: 2,      // 可领取
  FINISHED: 3,       // 已完成
  EXPIRED: 4,        // 已过期
};

// 任务进度类型
export const TASK_PROGRESS_TYPES = {
  KILL_MONSTER: 1,      // 击杀怪物
  COLLECT_ITEM: 2,     // 收集物品
  UPGRADE_BUILDING: 3,  // 升级建筑
  RECRUIT_HERO: 4,     // 招募武将
  PASS_LEVEL: 5,       // 通关关卡
  USE_RESOURCE: 6,     // 使用资源
  GAIN_EXP: 7,         // 获得经验
  COMPLETE_TASK: 8,    // 完成任务
  VISIT_NPC: 9,        // 访问NPC
  TALK_NPC: 10,        // 对话NPC
};

// 任务奖励配置
export const TASK_REWARD_CONFIG = {
  GOLD_BONUS: 1.5,      // 任务金币加成
  EXP_BONUS: 1.2,       // 任务经验加成
  ITEM_DROP_RATE: 0.3,  // 额外掉落率
};

// 日常任务重置配置
export const DAILY_RESET_CONFIG = {
  RESET_TIME: '04:00',   // 重置时间
  RESET_TYPE: 'day',     // 重置类型
};

// 任务链配置
export const TASK_CHAIN_CONFIG = {
  MAIN_CHAIN: [1001, 1002, 1003, 1004, 1005],      // 主线任务链
  BRANCH_CHAINS: {
    'city': [2001, 2002, 2003],
    'hero': [2010, 2011, 2012],
    'building': [2020, 2021, 2022],
  },
};

// ==================== 服务类扩展 ====================

export class TaskServiceExtension {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ==================== 任务查询系统 ====================

  /**
   * 获取任务列表
   */
  async getTaskList(walletAddress: string, type?: number) {
    let query = `
      SELECT t.*, tc.name as task_name, tc.description, tc.type as task_type, 
             tc.reward_gold, tc.reward_exp, tc.reward_items, tc.progress_type,
             tc.progress_target, tc.prerequisite, tc.unlock_level
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.wallet_address = ?
    `;
    const params: any[] = [walletAddress];

    if (type) {
      query += ' AND tc.type = ?';
      params.push(type);
    }

    query += ' ORDER BY tc.type ASC, t.created_at DESC';

    const tasks: any = await this.db.prepare(query).bind(...params).all();

    const taskList = (tasks.results || []).map((t: any) => ({
      id: t.id,
      taskId: t.task_id,
      name: t.task_name,
      description: t.description,
      type: t.task_type,
      typeName: TASK_TYPES[t.task_type as keyof typeof TASK_TYPES]?.name || '未知',
      state: t.state,
      stateName: this.getStateName(t.state),
      progress: t.progress || 0,
      target: t.progress_target || t.target,
      rewardGold: t.reward_gold,
      rewardExp: t.reward_exp,
      rewardItems: t.reward_items ? JSON.parse(t.reward_items) : [],
      createdAt: t.created_at,
      completedAt: t.completed_at,
    }));

    // 分类统计
    const stats = {
      total: taskList.length,
      inProgress: taskList.filter((t: any) => t.state === TASK_STATES.IN_PROGRESS).length,
      completable: taskList.filter((t: any) => t.state === TASK_STATES.COMPLETED).length,
      finished: taskList.filter((t: any) => t.state === TASK_STATES.FINISHED).length,
    };

    return {
      success: true,
      tasks: taskList,
      stats,
    };
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(walletAddress: string, taskId: number) {
    const task: any = await this.db.prepare(`
      SELECT t.*, tc.name as task_name, tc.description, tc.type as task_type,
             tc.reward_gold, tc.reward_exp, tc.reward_items, tc.progress_type,
             tc.progress_target, tc.prerequisite, tc.unlock_level,
             tc.complete_dialog, tc.accept_dialog
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.task_id = ? AND t.wallet_address = ?
    `).bind(taskId, walletAddress).first();

    if (!task) {
      return { success: false, error: '任务不存在' };
    }

    // 获取前置任务状态
    let prerequisiteStatus = null;
    if (task.prerequisite) {
      const preTask: any = await this.db.prepare(`
        SELECT state FROM user_tasks WHERE task_id = ? AND wallet_address = ?
      `).bind(task.prerequisite, walletAddress).first();
      prerequisiteStatus = preTask ? { taskId: task.prerequisite, state: preTask.state } : null;
    }

    return {
      success: true,
      task: {
        id: task.id,
        taskId: task.task_id,
        name: task.task_name,
        description: task.description,
        type: task.task_type,
        typeName: TASK_TYPES[task.task_type as keyof typeof TASK_TYPES]?.name || '未知',
        state: task.state,
        stateName: this.getStateName(task.state),
        progress: task.progress || 0,
        target: task.progress_target || task.target,
        rewardGold: task.reward_gold,
        rewardExp: task.reward_exp,
        rewardItems: task.reward_items ? JSON.parse(task.reward_items) : [],
        acceptDialog: task.accept_dialog,
        completeDialog: task.complete_dialog,
        unlockLevel: task.unlock_level,
        prerequisite: task.prerequisite,
        prerequisiteStatus,
        createdAt: task.created_at,
        completedAt: task.completed_at,
      },
    };
  }

  /**
   * 获取可接任务列表
   */
  async getAvailableTasks(walletAddress: string) {
    const user: any = await this.db.prepare(`
      SELECT level FROM users WHERE wallet_address = ?
    `).bind(walletAddress).first();

    const userLevel = user?.level || 1;

    // 获取已完成的任务ID
    const finishedTasks: any = await this.db.prepare(`
      SELECT task_id FROM user_tasks WHERE wallet_address = ? AND state >= ?
    `).bind(walletAddress, TASK_STATES.COMPLETED).all();

    const finishedIds = new Set((finishedTasks.results || []).map((t: any) => t.task_id));

    // 获取配置中可接的任务
    const availableTasks: any = await this.db.prepare(`
      SELECT * FROM tasks_config 
      WHERE unlock_level <= ? AND state = 1
      ORDER BY unlock_level ASC, id ASC
    `).bind(userLevel).all();

    const tasks = (availableTasks.results || []).filter((t: any) => 
      !finishedIds.has(t.id) && this.checkPrerequisite(walletAddress, t.prerequisite)
    ).map((t: any) => ({
      taskId: t.id,
      name: t.name,
      description: t.description,
      type: t.type,
      typeName: TASK_TYPES[t.type as keyof typeof TASK_TYPES]?.name || '未知',
      unlockLevel: t.unlock_level,
      rewardGold: t.reward_gold,
      rewardExp: t.reward_exp,
      rewardItems: t.reward_items ? JSON.parse(t.reward_items) : [],
    }));

    return {
      success: true,
      tasks,
      total: tasks.length,
    };
  }

  // ==================== 任务执行系统 ====================

  /**
   * 接受任务
   */
  async acceptTask(walletAddress: string, taskId: number) {
    // 检查任务是否存在
    const existing: any = await this.db.prepare(`
      SELECT id, state FROM user_tasks WHERE task_id = ? AND wallet_address = ?
    `).bind(taskId, walletAddress).first();

    if (existing) {
      if (existing.state >= TASK_STATES.IN_PROGRESS) {
        return { success: false, error: '任务已接受或完成' };
      }
      // 重新激活
      await this.db.prepare(`
        UPDATE user_tasks SET state = ?, progress = 0 WHERE id = ?
      `).bind(TASK_STATES.IN_PROGRESS, existing.id).run();
      
      return { success: true, taskId, message: '任务已重新接受' };
    }

    // 获取任务配置
    const taskConfig: any = await this.db.prepare(`
      SELECT * FROM tasks_config WHERE id = ? AND state = 1
    `).bind(taskId).first();

    if (!taskConfig) {
      return { success: false, error: '任务不存在或已关闭' };
    }

    // 检查前置任务
    if (taskConfig.prerequisite) {
      const preTask: any = await this.db.prepare(`
        SELECT state FROM user_tasks WHERE task_id = ? AND wallet_address = ?
      `).bind(taskConfig.prerequisite, walletAddress).first();

      if (!preTask || preTask.state < TASK_STATES.FINISHED) {
        return { success: false, error: '前置任务未完成' };
      }
    }

    try {
      await this.db.prepare(`
        INSERT INTO user_tasks (wallet_address, task_id, state, progress, target, created_at)
        VALUES (?, ?, ?, 0, ?, datetime('now'))
      `).bind(walletAddress, taskId, TASK_STATES.IN_PROGRESS, taskConfig.progress_target).run();

      return {
        success: true,
        taskId,
        name: taskConfig.name,
        message: '任务接受成功',
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * 放弃任务
   */
  async abandonTask(walletAddress: string, taskId: number) {
    const task: any = await this.db.prepare(`
      SELECT id, state FROM user_tasks WHERE task_id = ? AND wallet_address = ?
    `).bind(taskId, walletAddress).first();

    if (!task) {
      return { success: false, error: '任务不存在' };
    }

    if (task.state !== TASK_STATES.IN_PROGRESS) {
      return { success: false, error: '只能放弃进行中的任务' };
    }

    await this.db.prepare(`
      UPDATE user_tasks SET state = ? WHERE id = ?
    `).bind(TASK_STATES.EXPIRED, task.id).run();

    return { success: true, taskId, message: '任务已放弃' };
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(walletAddress: string, progressType: number, delta: number, relatedId?: number) {
    // 获取进行中的相关任务
    const tasks: any = await this.db.prepare(`
      SELECT t.id, t.task_id, t.progress, t.target, tc.name
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.wallet_address = ? AND t.state = ? AND tc.progress_type = ?
    `).bind(walletAddress, TASK_STATES.IN_PROGRESS, progressType).all();

    const updates: { taskId: number; oldProgress: number; newProgress: number; completed: boolean }[] = [];

    for (const task of (tasks.results || [])) {
      const newProgress = Math.min((task.progress || 0) + delta, task.target);
      const completed = newProgress >= task.target;

      await this.db.prepare(`
        UPDATE user_tasks SET progress = ?, state = ? WHERE id = ?
      `).bind(newProgress, completed ? TASK_STATES.COMPLETED : TASK_STATES.IN_PROGRESS, task.id).run();

      updates.push({
        taskId: task.task_id,
        oldProgress: task.progress || 0,
        newProgress,
        completed,
      });
    }

    return {
      success: true,
      updated: updates.length,
      updates,
    };
  }

  /**
   * 完成任务（领取奖励）
   */
  async completeTask(walletAddress: string, taskId: number) {
    const task: any = await this.db.prepare(`
      SELECT t.*, tc.name, tc.reward_gold, tc.reward_exp, tc.reward_items
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.task_id = ? AND t.wallet_address = ?
    `).bind(taskId, walletAddress).first();

    if (!task) {
      return { success: false, error: '任务不存在' };
    }

    if (task.state !== TASK_STATES.COMPLETED) {
      return { success: false, error: '任务未完成，无法领取奖励' };
    }

    try {
      // 更新状态
      await this.db.prepare(`
        UPDATE user_tasks SET state = ?, completed_at = datetime('now') WHERE id = ?
      `).bind(TASK_STATES.FINISHED, task.id).run();

      // 发放奖励
      const rewards: { gold: number; exp: number; items: any[] } = {
        gold: task.reward_gold,
        exp: task.reward_exp,
        items: task.reward_items ? JSON.parse(task.reward_items) : [],
      };

      // 发放金币
      if (rewards.gold > 0) {
        await this.db.prepare(`
          UPDATE users SET gold = gold + ? WHERE wallet_address = ?
        `).bind(rewards.gold, walletAddress).run();
      }

      // 发放经验
      if (rewards.exp > 0) {
        await this.db.prepare(`
          UPDATE users SET exp = exp + ? WHERE wallet_address = ?
        `).bind(rewards.exp, walletAddress).run();
      }

      // 发放物品
      for (const item of rewards.items) {
        await this.addItem(walletAddress, item.itemId, item.count);
      }

      // 检查是否触发下一个任务
      const nextTask = await this.getNextTaskInChain(taskId);
      let nextTaskTriggered = null;
      if (nextTask) {
        nextTaskTriggered = {
          taskId: nextTask.id,
          name: nextTask.name,
          message: '已触发后续任务链',
        };
      }

      return {
        success: true,
        taskId,
        taskName: task.name,
        rewards,
        nextTask: nextTaskTriggered,
        message: `任务完成！获得 ${rewards.gold} 金币，${rewards.exp} 经验`,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * 一键完成任务
   */
  async completeAllTasks(walletAddress: string) {
    const completableTasks: any = await this.db.prepare(`
      SELECT t.task_id, tc.name, tc.reward_gold, tc.reward_exp, tc.reward_items
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.wallet_address = ? AND t.state = ?
    `).bind(walletAddress, TASK_STATES.COMPLETED).all();

    if ((completableTasks.results || []).length === 0) {
      return { success: false, error: '没有可完成的任务' };
    }

    let totalGold = 0;
    let totalExp = 0;
    let completedCount = 0;

    for (const task of (completableTasks.results || [])) {
      // 更新状态
      await this.db.prepare(`
        UPDATE user_tasks SET state = ?, completed_at = datetime('now') 
        WHERE task_id = ? AND wallet_address = ?
      `).bind(TASK_STATES.FINISHED, task.task_id, walletAddress).run();

      // 累计奖励
      totalGold += task.reward_gold || 0;
      totalExp += task.reward_exp || 0;
      completedCount++;
    }

    // 发放总奖励
    await this.db.prepare(`
      UPDATE users SET gold = gold + ?, exp = exp + ? WHERE wallet_address = ?
    `).bind(totalGold, totalExp, walletAddress).run();

    return {
      success: true,
      completedCount,
      totalGold,
      totalExp,
      message: `完成 ${completedCount} 个任务，共获得 ${totalGold} 金币，${totalExp} 经验`,
    };
  }

  // ==================== 日常任务系统 ====================

  /**
   * 获取日常任务状态
   */
  async getDailyTasks(walletAddress: string) {
    const today = new Date().toISOString().split('T')[0];

    // 检查今日日常任务
    const dailyTasks: any = await this.db.prepare(`
      SELECT t.*, tc.name, tc.description, tc.reward_gold, tc.reward_exp
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.wallet_address = ? AND tc.type = ? AND DATE(t.created_at) = ?
    `).bind(walletAddress, TASK_TYPES.DAILY.id, today).all();

    const completed = dailyTasks.results?.filter((t: any) => t.state === TASK_STATES.FINISHED).length || 0;
    const inProgress = dailyTasks.results?.filter((t: any) => t.state === TASK_STATES.IN_PROGRESS).length || 0;
    const available = dailyTasks.results?.filter((t: any) => t.state === TASK_STATES.UNACCEPTED).length || 0;

    return {
      success: true,
      date: today,
      completed,
      inProgress,
      available,
      total: TASK_TYPES.DAILY.maxCount,
      progress: Math.floor((completed / TASK_TYPES.DAILY.maxCount) * 100),
      tasks: (dailyTasks.results || []).map((t: any) => ({
        taskId: t.task_id,
        name: t.name,
        state: t.state,
        stateName: this.getStateName(t.state),
        progress: t.progress,
        target: t.target,
      })),
    };
  }

  /**
   * 重置日常任务
   */
  async resetDailyTasks(walletAddress: string) {
    const today = new Date().toISOString().split('T')[0];

    // 检查是否今日已重置
    const existing: any = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_tasks 
      WHERE wallet_address = ? AND DATE(created_at) = ?
    `).bind(walletAddress, today).first();

    if ((existing as any).count > 0) {
      return { success: false, error: '今日日常任务已重置' };
    }

    // 生成日常任务
    const dailyConfigs: any = await this.db.prepare(`
      SELECT * FROM tasks_config WHERE type = ? AND state = 1 ORDER BY RANDOM() LIMIT ?
    `).bind(TASK_TYPES.DAILY.id, TASK_TYPES.DAILY.maxCount).all();

    for (const config of (dailyConfigs.results || [])) {
      await this.db.prepare(`
        INSERT INTO user_tasks (wallet_address, task_id, state, progress, target, created_at)
        VALUES (?, ?, ?, 0, ?, datetime('now'))
      `).bind(walletAddress, config.id, TASK_STATES.IN_PROGRESS, config.progress_target).run();
    }

    return {
      success: true,
      taskCount: (dailyConfigs.results || []).length,
      message: `已刷新 ${(dailyConfigs.results || []).length} 个日常任务`,
    };
  }

  // ==================== 成就系统 ====================

  /**
   * 获取成就列表
   */
  async getAchievements(walletAddress: string) {
    const achievements: any = await this.db.prepare(`
      SELECT t.*, tc.name, tc.description, tc.reward_gold, tc.reward_items, tc.icon
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.wallet_address = ? AND tc.type = ?
    `).bind(walletAddress, TASK_TYPES.ACHIEVEMENT.id).all();

    const completed = achievements.results?.filter((t: any) => t.state === TASK_STATES.FINISHED).length || 0;
    const inProgress = achievements.results?.filter((t: any) => t.state === TASK_STATES.IN_PROGRESS).length || 0;

    return {
      success: true,
      completed,
      total: (achievements.results || []).length,
      progress: Math.floor((completed / Math.max(1, (achievements.results || []).length)) * 100),
      achievements: (achievements.results || []).map((a: any) => ({
        taskId: a.task_id,
        name: a.name,
        description: a.description,
        state: a.state,
        stateName: this.getStateName(a.state),
        progress: a.progress,
        target: a.target,
        icon: a.icon,
        rewardGold: a.reward_gold,
        rewardItems: a.reward_items ? JSON.parse(a.reward_items) : [],
      })),
    };
  }

  /**
   * 获取成就进度
   */
  async getAchievementProgress(walletAddress: string, achievementId: number) {
    const achievement: any = await this.db.prepare(`
      SELECT t.*, tc.name, tc.description, tc.progress_target, tc.reward_gold, tc.reward_items
      FROM user_tasks t
      JOIN tasks_config tc ON t.task_id = tc.id
      WHERE t.task_id = ? AND t.wallet_address = ?
    `).bind(achievementId, walletAddress).first();

    if (!achievement) {
      return { success: false, error: '成就未解锁' };
    }

    return {
      success: true,
      achievementId,
      name: achievement.name,
      description: achievement.description,
      progress: achievement.progress || 0,
      target: achievement.progress_target,
      percent: Math.floor(((achievement.progress || 0) / achievement.progress_target) * 100),
      state: achievement.state,
      stateName: this.getStateName(achievement.state),
    };
  }

  // ==================== 工具方法 ====================

  private getStateName(state: number): string {
    const states: { [key: number]: string } = {
      [TASK_STATES.UNACCEPTED]: '未接受',
      [TASK_STATES.IN_PROGRESS]: '进行中',
      [TASK_STATES.COMPLETED]: '可领取',
      [TASK_STATES.FINISHED]: '已完成',
      [TASK_STATES.EXPIRED]: '已过期',
    };
    return states[state] || '未知';
  }

  private async checkPrerequisite(walletAddress: string, prerequisite: number): Promise<boolean> {
    if (!prerequisite) return true;
    
    const preTask: any = await this.db.prepare(`
      SELECT state FROM user_tasks WHERE task_id = ? AND wallet_address = ?
    `).bind(prerequisite, walletAddress).first();

    return preTask && preTask.state >= TASK_STATES.FINISHED;
  }

  private async getNextTaskInChain(currentTaskId: number): Promise<any> {
    // 检查当前任务是否在任务链中
    for (const [chainName, chain] of Object.entries(TASK_CHAIN_CONFIG.BRANCH_CHAINS)) {
      const index = (chain as number[]).indexOf(currentTaskId);
      if (index >= 0 && index < (chain as number[]).length - 1) {
        const nextTaskId = (chain as number[])[index + 1];
        const nextTask: any = await this.db.prepare(`
          SELECT id, name FROM tasks_config WHERE id = ?
        `).bind(nextTaskId).first();
        return nextTask;
      }
    }
    return null;
  }

  private async addItem(walletAddress: string, configId: number, count: number) {
    const existing: any = await this.db.prepare(`
      SELECT id FROM user_items WHERE wallet_address = ? AND item_id = ?
    `).bind(walletAddress, configId).first();

    if (existing) {
      await this.db.prepare(`
        UPDATE user_items SET count = count + ? WHERE id = ?
      `).bind(count, existing.id).run();
    } else {
      await this.db.prepare(`
        INSERT INTO user_items (wallet_address, item_id, count, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(walletAddress, configId, count).run();
    }
  }
}
