/**
 * XP 等级计算工具
 */

// XP 等级阈值 (与后端保持一致)
export const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

/**
 * 计算当前等级进度
 * @param xp 当前总 XP
 * @param level 当前等级
 * @returns { current: 当前总XP, next: 下一级门槛, percent: 进度百分比 }
 */
export function getXpProgress(xp: number, level: number): { 
  current: number; 
  next: number; 
  percent: number;
} {
  const nextThreshold = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];
  
  if (level >= XP_LEVELS.length) {
    return { current: xp, next: nextThreshold, percent: 100 }; // 满级
  }
  
  // 显示总 XP / 下一级门槛，进度条也按这个比例
  const percent = Math.min(100, Math.floor((xp / nextThreshold) * 100));
  
  return { current: xp, next: nextThreshold, percent };
}
