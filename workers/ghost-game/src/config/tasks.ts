/**
 * Task Configurations - 任务配置
 * 从 C# 配置迁移，按主线ID和章节索引组织
 */

import tasksData from './tasks.json';

// 任务配置类型 - 对齐 C# TaskInfo 和 tasks.json 所有字段
export interface TaskConfig {
  ID: number;
  MainID: number;
  MainIndex: number;
  Index: number;
  Name: string;
  Type: number;
  NameType: number;
  BeginDes: string;
  EndDes: string;
  ActionDes: string;
  NeedObjType: number;
  NeedObjID: number;
  NeedObjValue: number;
  CostMoney?: number;
  CostFood?: number;
  CostMen?: number;
  CostGold?: number;
  CostInsignia?: number;
  Target?: number;
  TargetType?: number;
  OverFlag?: number;
  TaskItem?: string;
  TaskItemNum?: number;
  TaskItemCondition?: number;
  TaskItemProbability?: number;
  AppendItemIndex?: number;
  AppendItemProbability?: number;
  GetMoney?: number;
  GetFood?: number;
  GetMen?: number;
  GetGold?: number;
  GetItemIndex?: number;
  GetGainType?: number;
  GetGainIndex?: number;
  // Type=2 任务相关：交付物品目标
  ConditionTargetName?: string;
  ConditionCityID?: number;
}

export interface MainTaskConfig {
  ID: number;
  MainID: number;
  MainIndex: number;
  Task: number[];  // 子任务ID列表
}

// 转换tasks.json数组为按MainID_MainIndex索引的对象
function transformTasks(): Record<string, MainTaskConfig> {
  const tasks = (tasksData as any).Task || [];
  const mainTasks: Record<string, MainTaskConfig> = {};
  const taskMap: Record<number, TaskConfig> = {};
  
  // 首先创建任务ID到配置的映射
  for (const task of tasks) {
    taskMap[task.ID] = task;
  }
  
  // 按主线分组
  const mainTaskGroups: Record<string, TaskConfig[]> = {};
  for (const task of tasks) {
    const key = `${task.MainID}_${task.MainIndex}`;
    if (!mainTaskGroups[key]) {
      mainTaskGroups[key] = [];
    }
    mainTaskGroups[key].push(task);
  }
  
  // 创建主任务配置
  for (const [key, tasksList] of Object.entries(mainTaskGroups)) {
    mainTasks[key] = {
      ID: tasksList[0]?.MainID || parseInt(key.split('_')[0]),
      MainID: tasksList[0]?.MainID || parseInt(key.split('_')[0]),
      MainIndex: tasksList[0]?.MainIndex || parseInt(key.split('_')[1]),
      Task: tasksList.map(t => t.ID),
    };
  }
  
  return mainTasks;
}

export const taskConfigs: Record<string, MainTaskConfig> = transformTasks();

// 获取所有任务配置
export function getAllTasks(): TaskConfig[] {
  return (tasksData as any).Task || [];
}

// 根据任务ID获取任务配置
export function getTaskConfig(taskId: number): TaskConfig | undefined {
  return (tasksData as any).Task?.find((t: TaskConfig) => t.ID === taskId);
}

// 根据主线和章节获取任务配置
export function getMainTaskConfig(mainId: number, mainIndex: number): MainTaskConfig | undefined {
  return taskConfigs[`${mainId}_${mainIndex}`];
}

// 获取某主线的所有子任务
export function getChapterTasks(mainId: number, mainIndex: number): TaskConfig[] {
  const taskIds = taskConfigs[`${mainId}_${mainIndex}`]?.Task || [];
  return taskIds.map(id => getTaskConfig(id)).filter(Boolean) as TaskConfig[];
}

// 获取所有主线章节
export function getAllChapters(): { mainId: number; mainIndex: number; taskCount: number }[] {
  const chapters: { mainId: number; mainIndex: number; taskCount: number }[] = [];
  for (const key of Object.keys(taskConfigs)) {
    const [mainId, mainIndex] = key.split('_').map(Number);
    chapters.push({
      mainId,
      mainIndex,
      taskCount: taskConfigs[key].Task.length,
    });
  }
  return chapters;
}
