/**
 * Task Service - 任务服务层
 * 从 jx/BLL/Task.cs 迁移
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { TaskConfig, UserTask } from '../types/models';
import { taskConfigs, getTaskConfig as getTaskCfg } from '../config/tasks';

// 任务类型定义
export interface TaskInfo {
  id: number;                    // 任务ID
  mainId: number;                // 章节ID
  mainIndex: number;              // 章节内索引
  index: number;                 // 任务在章节中的位置
  name: string;                  // 任务名称
  type: number;                  // 任务类型: 1=达到条件, 2=领取道具, 3=战斗任务, 4=探索任务
  nameType: number;              // 名称类型: 1=内政, 2=剧情, 3=活动, 4=日常
  beginDes: string;              // 任务描述
  actionDes: string;             // 操作描述
  endDes: string;                // 结束描述
  
  // 需求条件
  needObjType: number;            // 需求对象类型
  needObjID: number;              // 需求对象ID
  needObjValue: number;           // 需求数量值
  
  // 消耗资源
  costMoney?: number;
  costFood?: number;
  costMen?: number;
  costGold?: number;
  
  // 目标信息
  target?: number;                // 目标位置/ID
  targetType?: number;            // 目标类型: 0=通用, 1=玩家, 2=NPC
  overFlag?: number;             // 完成标记
  
  // 任务品信息
  taskItem?: string;             // 任务品名称
  taskItemNum?: number;           // 任务品需求数量
  taskItemCondition?: number;     // 战斗条件: 0=胜/败, 1=胜, 2=败
  taskItemProbability?: number;   // 获得概率 (1-10000)
  
  // 额外掉落
  appendItemIndex?: number;       // 额外掉落物品ID
  appendItemProbability?: number; // 额外掉落概率
  
  // 完成任务奖励
  getMoney?: number;
  getFood?: number;
  getMen?: number;
  getGold?: number;
  getItemIndex?: number;         // 奖励物品ID
  
  // 增益效果
  gainType?: number;              // 增益类型
  gainIndex?: number;             // 增益索引
  
  // 用户状态
  state: number;                  // 状态: 0=未接取, 1=进行中, 2=已完成(未领取), 3=已领取
  hasTaskItemNum?: number;        // 已获得任务品数量
  hasCondition?: number;           // 已达成条件数量
}

// 用户任务状态
export interface UserTaskState {
  walletAddress: string;
  mainId: number;
  mainIndex: number;
  taskIds: number[];             // 任务ID数组
  taskStates: number[];          // 任务状态数组
  taskProgress: number[];        // 任务进度数组
}

class TaskService {
  private db: D1Database;
  private taskConfig: Map<number, TaskConfig> = new Map();
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  /**
   * 加载任务配置
   */
  async loadTaskConfig() {
    // 从 tasks.json 加载配置
    // 实际实现时从数据库或配置文件读取
  }
  
  /**
   * 获取当前可执行任务列表
   */
  async getCurrentTasks(walletAddress: string, cityId: number): Promise<TaskInfo[]> {
    // 获取用户任务状态（如果不存在，自动创建）
    let userTask = await this.getUserTaskState(walletAddress);
    if (!userTask) {
      await this.createUserTask(walletAddress);
      userTask = await this.getUserTaskState(walletAddress);
      if (!userTask) return [];
    }
    
    const taskList: TaskInfo[] = [];
    const { mainId, mainIndex, taskIds, taskStates, taskProgress } = userTask;
    
    // 遍历当前章节的任务
    for (let i = 0; i < taskIds.length; i++) {
      if (taskIds[i] === 0) continue; // 跳过无效任务
      
      const taskId = taskIds[i];
      const taskConfig = await this.getTaskConfig(taskId);
      if (!taskConfig) continue;
      
      const taskInfo: TaskInfo = {
        ...taskConfig,
        state: taskStates[i],
        hasTaskItemNum: taskProgress[i],
        hasCondition: taskProgress[i],
      };
      
      // 根据任务类型计算状态
      if (taskInfo.type === 1) {
        // 达到条件类任务
        taskInfo.state = await this.calculateTaskState(walletAddress, cityId, taskInfo);
      } else if (taskInfo.type === 3) {
        // 战斗类任务
        taskInfo.state = taskProgress[i] >= (taskInfo.taskItemNum || 1) ? 2 : 1;
      } else if (taskInfo.type === 4) {
        // 探索类任务
        taskInfo.state = taskProgress[i] >= (taskInfo.taskItemNum || 1) ? 2 : 1;
      }
      
      taskList.push(taskInfo);
    }
    
    // 如果没有可执行任务，检查是否需要进入下一章节
    if (taskList.length === 0 || taskList.every(t => t.state === 3)) {
      const isOver = await this.isChapterComplete(userTask);
      if (isOver) {
        const nextTask = await this.getNextChapter(walletAddress, userTask);
        if (nextTask) {
          return this.getCurrentTasks(walletAddress, cityId);
        }
      }
    }
    
    return taskList;
  }
  
  /**
   * 根据类型获取任务
   */
  async getTasksByType(walletAddress: string, cityId: number, subType: number): Promise<TaskInfo[]> {
    const allTasks = await this.getCurrentTasks(walletAddress, cityId);
    return allTasks.filter(t => t.nameType === subType);
  }
  
  /**
   * 计算任务状态
   */
  private async calculateTaskState(
    walletAddress: string, 
    cityId: number, 
    task: TaskInfo
  ): Promise<number> {
    switch (task.needObjType) {
      case 1: // 建筑等级
        return this.getInteriorState(walletAddress, cityId, task);
      case 2: // 科技等级
        return this.getTechnicState(walletAddress, cityId, task);
      case 3: // 城防数量
        return this.getDefenceNum(walletAddress, cityId, task);
      case 4: // 已雇佣侠客数
        return this.getHeroNumByEngage(walletAddress, cityId, task);
      case 5: // 未雇佣侠客数
        return this.getHeroNumByNoEngage(walletAddress, cityId, task);
      case 6: // 出战侠客数
        return this.getHeroNumByHeroList(walletAddress, cityId, task, 2);
      case 7: // 后备侠客数
        return this.getHeroNumByHeroList(walletAddress, cityId, task, 3);
      case 8: // 训练度总和
        return this.getHeroAllTraining(walletAddress, cityId, task);
      case 9: // 繁荣度
        return this.getCityTitle(walletAddress, cityId, task);
      case 10: // 金钱
        return this.getCityRes(walletAddress, cityId, task, 1);
      case 11: // 粮食
        return this.getCityRes(walletAddress, cityId, task, 2);
      case 12: // 人口
        return this.getCityRes(walletAddress, cityId, task, 3);
      case 13: // 元宝
        return this.getCityRes(walletAddress, cityId, task, 4);
      case 14: // 物品数量
        return this.getItemNum(walletAddress, cityId, task);
      case 15: // 门派建筑数量
        return this.getJuntaNum(walletAddress, cityId, task);
      case 16: // 弟子数量
        return this.getAllPrenticeNum(walletAddress, cityId, task);
      default:
        return 1;
    }
  }
  
  // 状态计算方法
  // C#: 根据 needObjType 检查对应条件，返回 2=完成/可领取 或 1=进行中
  private async getInteriorState(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    if (!task.needObjID) return 1;
    const building: any = await this.db.prepare(
      `SELECT level FROM buildings WHERE wallet_address = ? AND city_id = ? AND config_id = ? LIMIT 1`
    ).bind(walletAddress, cityId, task.needObjID).first();
    const current = building?.level || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getTechnicState(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    if (!task.needObjID) return 1;
    const technic: any = await this.db.prepare(
      `SELECT level FROM technics WHERE wallet_address = ? AND city_id = ? AND config_id = ? LIMIT 1`
    ).bind(walletAddress, cityId, task.needObjID).first();
    const current = technic?.level || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getDefenceNum(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    const result: any = await this.db.prepare(
      `SELECT COALESCE(SUM(defence_num), 0) as total FROM city_defence WHERE wallet_address = ? AND city_id = ?`
    ).bind(walletAddress, cityId).first();
    const current = result?.total || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getHeroNumByEngage(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    const result: any = await this.db.prepare(
      `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND state > 0`
    ).bind(walletAddress, cityId).first();
    const current = result?.cnt || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getHeroNumByNoEngage(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    const result: any = await this.db.prepare(
      `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND state = 0`
    ).bind(walletAddress, cityId).first();
    const current = result?.cnt || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getHeroNumByHeroList(
    walletAddress: string,
    cityId: number,
    task: TaskInfo,
    listType: number
  ): Promise<number> {
    let sql = '';
    if (listType === 2) {
      // 出战侠客
      sql = `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND corps_id > 0`;
    } else if (listType === 3) {
      // 后备侠客
      sql = `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND corps_id = 0 AND state > 0`;
    } else {
      return 1;
    }
    const result: any = await this.db.prepare(sql).bind(walletAddress, cityId).first();
    const current = result?.cnt || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getHeroAllTraining(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    const result: any = await this.db.prepare(
      `SELECT COALESCE(SUM(training_level), 0) as total FROM heroes WHERE wallet_address = ? AND city_id = ? AND state > 0`
    ).bind(walletAddress, cityId).first();
    const current = result?.total || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getCityTitle(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    // 繁荣度从城市信息中获取
    const city: any = await this.db.prepare(
      `SELECT prosperity FROM cities WHERE wallet_address = ? AND id = ?`
    ).bind(walletAddress, cityId).first();
    const current = city?.prosperity || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getCityRes(
    walletAddress: string,
    cityId: number,
    task: TaskInfo,
    type: number
  ): Promise<number> {
    let field = '';
    if (type === 1) field = 'money';
    else if (type === 2) field = 'food';
    else if (type === 3) field = 'population';
    else return 1;

    const city: any = await this.db.prepare(
      `SELECT ${field} as val FROM cities WHERE wallet_address = ? AND id = ?`
    ).bind(walletAddress, cityId).first();
    const current = city?.val || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getItemNum(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    const result: any = await this.db.prepare(
      `SELECT COALESCE(SUM(count), 0) as total FROM items WHERE wallet_address = ? AND config_id = ?`
    ).bind(walletAddress, task.needObjID).first();
    const current = result?.total || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getJuntaNum(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    const result: any = await this.db.prepare(
      `SELECT COUNT(*) as cnt FROM junta_buildings WHERE wallet_address = ? AND city_id = ?`
    ).bind(walletAddress, cityId).first();
    const current = result?.cnt || 0;
    return current >= task.needObjValue ? 2 : 1;
  }

  private async getAllPrenticeNum(walletAddress: string, cityId: number, task: TaskInfo): Promise<number> {
    // 弟子数量 = 城市人口中的一部分（简化计算）
    const city: any = await this.db.prepare(
      `SELECT population FROM cities WHERE wallet_address = ? AND id = ?`
    ).bind(walletAddress, cityId).first();
    const current = city?.population || 0;
    return current >= task.needObjValue ? 2 : 1;
  }
  
  /**
   * 完成任务并领取奖励
   */
  async gainTaskReward(walletAddress: string, cityId: number, taskId: number): Promise<{ success: boolean; error?: string }> {
    const userTask = await this.getUserTaskState(walletAddress);
    if (!userTask) {
      return { success: false, error: '任务状态不存在' };
    }
    
    const taskIndex = userTask.taskIds.indexOf(taskId);
    if (taskIndex === -1) {
      return { success: false, error: '任务不存在' };
    }
    
    const currentState = userTask.taskStates[taskIndex];
    if (currentState === 0) {
      return { success: false, error: '任务未接取' };
    }
    if (currentState === 1) {
      return { success: false, error: '任务未完成' };
    }
    if (currentState === 3) {
      return { success: false, error: '奖励已领取' };
    }
    
    const taskConfig = await this.getTaskConfig(taskId);
    if (!taskConfig) {
      return { success: false, error: '任务配置不存在' };
    }
    
    // 验证任务条件
    const isComplete = await this.checkTaskComplete(walletAddress, cityId, taskId);
    if (!isComplete) {
      return { success: false, error: '任务条件未满足' };
    }
    
    // 更新任务状态为已领取
    await this.updateTaskState(walletAddress, taskIndex, 3);
    
    // 发放奖励
    await this.grantRewards(walletAddress, cityId, taskConfig);
    
    return { success: true };
  }
  
  /**
   * 验证任务是否完成
   */
  private async verifyTaskComplete(
    walletAddress: string,
    cityId: number,
    task: TaskInfo,
    userTask: UserTaskState
  ): Promise<boolean> {
    // 根据任务类型验证
    if (task.type === 1) {
      const state = await this.calculateTaskState(walletAddress, cityId, task);
      return state === 2;
    }
    
    // 战斗和探索任务检查进度
    const taskIndex = userTask.taskIds.indexOf(task.id);
    const progress = userTask.taskProgress[taskIndex] || 0;
    return progress >= (task.taskItemNum || 1);
  }
  
  /**
   * 发放任务奖励
   * C#: MissionPrize 中发放奖励的逻辑
   */
  private async grantRewards(walletAddress: string, cityId: number, task: TaskInfo): Promise<void> {
    // 发放金钱、粮食、人口
    if ((task.getMoney || 0) > 0 || (task.getFood || 0) > 0 || (task.getMen || 0) > 0) {
      await this.db.prepare(`
        UPDATE cities SET
          money = money + ?,
          food = food + ?,
          population = population + ?
        WHERE wallet_address = ? AND id = ?
      `).bind(task.getMoney || 0, task.getFood || 0, task.getMen || 0, walletAddress, cityId).run();
    }

    // 发放元宝
    if ((task.getGold || 0) > 0) {
      await this.db.prepare(
        `UPDATE characters SET gold = gold + ? WHERE wallet_address = ?`
      ).bind(task.getGold, walletAddress).run();
    }

    // 发放物品
    if ((task.getItemIndex || 0) > 0) {
      await this.db.prepare(`
        INSERT INTO items (wallet_address, config_id, count, source)
        VALUES (?, ?, 1, 'task_reward')
        ON CONFLICT(wallet_address, config_id) DO UPDATE SET count = count + 1
      `).bind(walletAddress, task.getItemIndex).run();
    }
  }
  
  /**
   * 获取合适的战斗任务
   */
  async getFitFightTask(
    walletAddress: string,
    cityId: number,
    pos: number
  ): Promise<TaskInfo | null> {
    const tasks = await this.getCurrentTasks(walletAddress, cityId);
    
    for (const task of tasks) {
      if (task.type !== 3) continue; // 只看战斗任务
      
      // 检查目标位置
      const target = pos % 1000; // 假设地图大小为 1000x1000
      
      if (task.target === 0 || task.target === pos || task.target === target) {
        if (task.targetType === 2) {
          // NPC 战斗，检查是否为 NPC 位置
          // TODO: 验证 NPC 位置
        }
        
        if (task.state === 1) {
          return task;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 更新战斗任务进度
   */
  async updateFightTaskProgress(
    walletAddress: string,
    cityId: number,
    taskId: number,
    win: boolean,
    userType: number
  ): Promise<TaskInfo | null> {
    const userTask = await this.getUserTaskState(walletAddress);
    if (!userTask) return null;
    
    const taskIndex = userTask.taskIds.indexOf(taskId);
    if (taskIndex === -1) return null;
    
    const task = await this.getTaskConfig(taskId);
    if (!task) return null;
    
    // 检查胜利条件
    const condition = task.taskItemCondition || 0;
    if (condition !== 0 && condition !== (win ? 1 : 2)) {
      return null;
    }
    
    // 检查目标类型
    if (task.targetType && task.targetType !== 0 && task.targetType !== userType) {
      return null;
    }
    
    // 计算掉落
    const baseNum = Math.pow(10, 6);
    const realItemPer = task.appendItemProbability || 0;
    
    // 额外物品掉落
    let dropItem: number | null = null;
    if (realItemPer > 0 && Math.random() * baseNum < realItemPer) {
      dropItem = task.appendItemIndex || 0;
    }
    
    // 更新进度
    const virtualItemPer = task.taskItemProbability || 0;
    if (Math.random() * Math.pow(10, 4) < virtualItemPer) {
      userTask.taskProgress[taskIndex]++;
      
      // 检查是否完成
      if (userTask.taskProgress[taskIndex] >= (task.taskItemNum || 1)) {
        userTask.taskStates[taskIndex] = 2;
      } else {
        userTask.taskStates[taskIndex] = 1;
      }
      
      await this.saveUserTaskState(walletAddress, userTask);
      
      return {
        ...task,
        state: userTask.taskStates[taskIndex],
        hasTaskItemNum: userTask.taskProgress[taskIndex],
      };
    }
    
    return null;
  }

  /**
   * 检查任务是否完成（供外部和内部调用）
   */
  async checkTaskComplete(
    walletAddress: string,
    cityId: number,
    taskId: number
  ): Promise<boolean> {
    const task = this.getTaskConfig(taskId);
    if (!task) return false;

    const progress = await this.getTaskProgress(walletAddress, cityId, taskId);
    return progress.current >= progress.target;
  }

  /**
   * 获取任务进度
   */
  async getTaskProgress(
    walletAddress: string,
    cityId: number,
    taskId: number
  ): Promise<{ current: number; target: number }> {
    const task = this.getTaskConfig(taskId);
    if (!task) return { current: 0, target: 0 };

    const target = task.needObjValue || task.taskItemNum || 1;
    let current = 0;

    // 获取用户任务进度
    const userTask = await this.getUserTaskState(walletAddress);
    if (userTask) {
      const idx = userTask.taskIds.indexOf(taskId);
      if (idx !== -1) {
        current = userTask.taskProgress[idx] || 0;
      }
    }

    // 战斗/探索任务检查任务品
    if (task.type === 3 || task.type === 4) {
      return { current, target: task.taskItemNum || 1 };
    }

    // 达到条件类任务 - 实时计算
    if (task.type === 1) {
      current = await this.calculateCurrentProgress(walletAddress, cityId, task);
      return { current, target };
    }

    return { current, target };
  }

  /**
   * 实时计算任务进度（针对条件类任务）
   */
  private async calculateCurrentProgress(
    walletAddress: string,
    cityId: number,
    task: TaskInfo
  ): Promise<number> {
    switch (task.needObjType) {
      case 1: { // 建筑等级
        const building: any = await this.db.prepare(
          `SELECT level FROM buildings WHERE wallet_address = ? AND city_id = ? AND config_id = ? LIMIT 1`
        ).bind(walletAddress, cityId, task.needObjID).first();
        return building?.level || 0;
      }
      case 2: { // 科技等级
        const technic: any = await this.db.prepare(
          `SELECT level FROM technics WHERE wallet_address = ? AND city_id = ? AND config_id = ? LIMIT 1`
        ).bind(walletAddress, cityId, task.needObjID).first();
        return technic?.level || 0;
      }
      case 3: { // 城防数量
        const result: any = await this.db.prepare(
          `SELECT COALESCE(SUM(defence_num), 0) as total FROM city_defence WHERE wallet_address = ? AND city_id = ?`
        ).bind(walletAddress, cityId).first();
        return result?.total || 0;
      }
      case 4: { // 已雇佣侠客数
        const result: any = await this.db.prepare(
          `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND state > 0`
        ).bind(walletAddress, cityId).first();
        return result?.cnt || 0;
      }
      case 5: { // 未雇佣侠客数
        const result: any = await this.db.prepare(
          `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND state = 0`
        ).bind(walletAddress, cityId).first();
        return result?.cnt || 0;
      }
      case 6: { // 出战侠客数
        const result: any = await this.db.prepare(
          `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND corps_id > 0`
        ).bind(walletAddress, cityId).first();
        return result?.cnt || 0;
      }
      case 7: { // 后备侠客数
        const result: any = await this.db.prepare(
          `SELECT COUNT(*) as cnt FROM heroes WHERE wallet_address = ? AND city_id = ? AND corps_id = 0 AND state > 0`
        ).bind(walletAddress, cityId).first();
        return result?.cnt || 0;
      }
      case 10: { // 金钱
        const city: any = await this.db.prepare(
          `SELECT money FROM cities WHERE wallet_address = ? AND id = ?`
        ).bind(walletAddress, cityId).first();
        return city?.money || 0;
      }
      case 11: { // 粮食
        const city: any = await this.db.prepare(
          `SELECT food FROM cities WHERE wallet_address = ? AND id = ?`
        ).bind(walletAddress, cityId).first();
        return city?.food || 0;
      }
      case 12: { // 人口
        const city: any = await this.db.prepare(
          `SELECT population FROM cities WHERE wallet_address = ? AND id = ?`
        ).bind(walletAddress, cityId).first();
        return city?.population || 0;
      }
      case 13: { // 元宝
        const char: any = await this.db.prepare(
          `SELECT gold FROM characters WHERE wallet_address = ?`
        ).bind(walletAddress).first();
        return char?.gold || 0;
      }
      case 14: { // 物品数量
        const result: any = await this.db.prepare(
          `SELECT COALESCE(SUM(count), 0) as total FROM items WHERE wallet_address = ? AND config_id = ?`
        ).bind(walletAddress, task.needObjID).first();
        return result?.total || 0;
      }
      default:
        return 0;
    }
  }

  /**
   * 获取下一个任务ID
   */
  async getNextTaskId(
    mainId: number,
    mainIndex: number,
    currentIndex: number
  ): Promise<number | null> {
    // 从 tasks.json 中查找下一个任务
    // 查找相同 MainID/MainIndex 的下一个 Index
    const key = `${mainId}_${mainIndex}`;
    const chapter = taskConfigs[key];
    if (!chapter?.Task) return null;

    // currentIndex 是 taskIds 数组中的位置，对应 Task[0..9]
    const nextArrayIndex = currentIndex + 1;
    if (nextArrayIndex >= chapter.Task.length) {
      // 尝试下一章节
      const nextKey = `${mainId}_${mainIndex + 1}`;
      const nextChapter = taskConfigs[nextKey];
      if (nextChapter?.Task?.[0]) {
        return nextChapter.Task[0];
      }
      return null;
    }

    const nextTaskId = chapter.Task[nextArrayIndex];
    return nextTaskId > 0 ? nextTaskId : null;
  }

  /**
   * 获取探索任务
   */
  async getFitSearchTask(
    walletAddress: string,
    cityId: number,
    targetPos: number,
    targetType: number
  ): Promise<TaskInfo | null> {
    const tasks = await this.getCurrentTasks(walletAddress, cityId);
    
    for (const task of tasks) {
      if (task.type !== 4) continue; // 只看探索任务
      
      if (task.target === targetPos || task.target === 0) {
        if (task.targetType === 2 && targetType === 2) {
          return task.state === 1 ? task : null;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 更新探索任务进度
   */
  async updateSearchTaskProgress(
    walletAddress: string,
    cityId: number,
    taskId: number,
    found: boolean
  ): Promise<TaskInfo | null> {
    if (!found) return null;
    
    const userTask = await this.getUserTaskState(walletAddress);
    if (!userTask) return null;
    
    const taskIndex = userTask.taskIds.indexOf(taskId);
    if (taskIndex === -1) return null;
    
    const task = await this.getTaskConfig(taskId);
    if (!task) return null;
    
    // 计算进度
    const baseNum = Math.pow(10, 4);
    const probability = task.taskItemProbability || 0;
    
    if (Math.random() * baseNum < probability) {
      userTask.taskProgress[taskIndex]++;
      
      if (userTask.taskProgress[taskIndex] >= (task.taskItemNum || 1)) {
        userTask.taskProgress[taskIndex] = task.taskItemNum || 1;
        userTask.taskStates[taskIndex] = 2;
      } else {
        userTask.taskStates[taskIndex] = 1;
      }
      
      await this.saveUserTaskState(walletAddress, userTask);
      
      return {
        ...task,
        state: userTask.taskStates[taskIndex],
        hasTaskItemNum: userTask.taskProgress[taskIndex],
      };
    }
    
    return null;
  }
  
  /**
   * 检查章节是否完成
   */
  private async isChapterComplete(userTask: UserTaskState): Promise<boolean> {
    // 章节完成条件：所有任务都已领取(状态为3)
    return userTask.taskStates.every(state => state === 3);
  }
  
  /**
   * 获取下一章节
   */
  private async getNextChapter(walletAddress: string, currentTask: UserTaskState): Promise<UserTaskState | null> {
    // TODO: 实现章节跳转逻辑
    return null;
  }
  
  /**
   * 获取用户任务状态
   */
  private async getUserTaskState(walletAddress: string): Promise<UserTaskState | null> {
    const result = await this.db.prepare(`
      SELECT * FROM tasks WHERE wallet_address = ?
    `).bind(walletAddress).first();
    
    if (!result) return null;
    
    return {
      walletAddress: result.wallet_address as string,
      mainId: result.main_id as number,
      mainIndex: result.main_index as number,
      taskIds: JSON.parse((result.task_ids as string) || '[]'),
      taskStates: JSON.parse((result.task_states as string) || '[]'),
      taskProgress: JSON.parse((result.task_progress as string) || '[]'),
    };
  }
  
  /**
   * 保存用户任务状态
   */
  private async saveUserTaskState(walletAddress: string, state: UserTaskState): Promise<void> {
    await this.db.prepare(`
      UPDATE tasks 
      SET main_id = ?, main_index = ?, task_ids = ?, task_states = ?, task_progress = ?, updated_at = datetime('now')
      WHERE wallet_address = ?
    `).bind(
      state.mainId,
      state.mainIndex,
      JSON.stringify(state.taskIds),
      JSON.stringify(state.taskStates),
      JSON.stringify(state.taskProgress),
      walletAddress
    ).run();
  }
  
  /**
   * 更新单个任务状态
   */
  private async updateTaskState(walletAddress: string, taskIndex: number, newState: number): Promise<void> {
    const userTask = await this.getUserTaskState(walletAddress);
    if (!userTask) return;
    
    userTask.taskStates[taskIndex] = newState;
    await this.saveUserTaskState(walletAddress, userTask);
  }
  
  /**
   * 获取任务配置（对齐C# XmlData.MainTask）
   */
  getTaskConfig(taskId: number, db?: D1Database): TaskInfo | null {
    if (taskId <= 0) return null;
    const task = getTaskCfg(taskId);
    if (!task) return null;
    return {
      id: task.ID,
      mainId: task.MainID,
      mainIndex: task.MainIndex,
      index: task.Index,
      name: task.Name,
      nameType: task.NameType || 1,
      type: task.Type || 1,
      state: 0,
      beginDes: task.BeginDes || '',
      endDes: task.EndDes || '',
      actionDes: task.ActionDes || '',
      needObjType: task.NeedObjType || 0,
      needObjID: task.NeedObjID || 0,
      needObjValue: task.NeedObjValue || 0,
      // 奖励从 mission_gains.json 按 GainIndex 查找
      gainType: task.GetGainType || 0,
      gainIndex: task.GetGainIndex || 0,
      hasTaskItemNum: 0,
      hasCondition: 0,
    };
  }

  /**
   * 创建新用户任务（对齐C# CreateInitializeTask）
   * 初始化: MainID=1, MainIndex=1, Task[0]=第一章第一小节第一个任务ID, Task[1..9]=0
   */
  async createUserTask(walletAddress: string): Promise<void> {
    // 从 taskConfigs["1_1"] 获取第一章第一小节的所有任务ID，取第一个
    const chapter1_1 = taskConfigs['1_1'];
    const firstTaskId = chapter1_1?.Task?.[0] || 1;

    // C#: Task[] = [firstTaskId, 0, 0, ...]
    const taskIds = [firstTaskId, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await this.db.prepare(`
      INSERT INTO tasks (wallet_address, main_id, main_index, task_ids, task_states, task_progress)
      VALUES (?, 1, 1, ?, ?, ?)
    `).bind(
      walletAddress,
      JSON.stringify(taskIds),
      JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    ).run();
  }
}

export const taskService = {
  /**
   * 创建任务服务实例
   */
  create(db: D1Database) {
    return new TaskService(db);
  },
  
  /**
   * 获取当前任务列表
   */
  async getCurrentTasks(db: D1Database, walletAddress: string, cityId: number) {
    const service = new TaskService(db);
    return service.getCurrentTasks(walletAddress, cityId);
  },
  
  /**
   * 获取任务奖励
   */
  async gainTaskReward(db: D1Database, walletAddress: string, cityId: number, taskId: number) {
    const service = new TaskService(db);
    return service.gainTaskReward(walletAddress, cityId, taskId);
  },
  
  /**
   * 获取战斗任务
   */
  async getFitFightTask(db: D1Database, walletAddress: string, cityId: number, pos: number) {
    const service = new TaskService(db);
    return service.getFitFightTask(walletAddress, cityId, pos);
  },
  
  /**
   * 更新战斗任务
   */
  async updateFightTaskProgress(
    db: D1Database,
    walletAddress: string,
    cityId: number,
    taskId: number,
    win: boolean,
    userType: number
  ) {
    const service = new TaskService(db);
    return service.updateFightTaskProgress(walletAddress, cityId, taskId, win, userType);
  },
  
  /**
   * 初始化用户任务
   */
  async initUserTask(db: D1Database, walletAddress: string) {
    const service = new TaskService(db);
    return service.createUserTask(walletAddress);
  },

  /**
   * 根据类型获取任务
   */
  async getTasksByType(db: D1Database, walletAddress: string, cityId: number, subType: number) {
    const service = new TaskService(db);
    return service.getTasksByType(walletAddress, cityId, subType);
  },

  /**
   * 获取探索任务
   */
  async getFitSearchTask(db: D1Database, walletAddress: string, cityId: number, targetPos: number, targetType: number) {
    const service = new TaskService(db);
    return service.getFitSearchTask(walletAddress, cityId, targetPos, targetType);
  },

  /**
   * 更新探索任务进度
   */
  async updateSearchTaskProgress(db: D1Database, walletAddress: string, cityId: number, taskId: number, found: boolean) {
    const service = new TaskService(db);
    return service.updateSearchTaskProgress(walletAddress, cityId, taskId, found);
  },

  /**
   * 验证任务是否完成（静态方法，供路由层调用）
   */
  async verifyTaskComplete(walletAddress: string, cityId: number, taskId: number, db: D1Database): Promise<boolean> {
    const service = new TaskService(db);
    return service.checkTaskComplete(walletAddress, cityId, taskId);
  },

  /**
   * 获取任务进度（静态方法）
   */
  async getTaskProgress(walletAddress: string, cityId: number, taskId: number, db: D1Database) {
    const service = new TaskService(db);
    return service.getTaskProgress(walletAddress, cityId, taskId);
  },

  /**
   * 获取下一个任务ID（静态方法）
   */
  async getNextTaskId(mainId: number, mainIndex: number, currentIndex: number, db: D1Database): Promise<number | null> {
    const service = new TaskService(db);
    return service.getNextTaskId(mainId, mainIndex, currentIndex);
  },
};

export default taskService;
export { TaskService };
