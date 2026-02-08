/**
 * TaskPanel - 新版任务面板
 * 赛博朋克风格
 */
import React, { useState } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';
import styles from './TaskPanel.module.css';

interface Task {
  id: number;
  title: string;
  desc: string;
  reward: string;
  progress: number;
  total: number;
  completed: boolean;
}

interface TaskPanelProps {
  walletAddress: string;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ walletAddress }) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: '每日登录', desc: '登录游戏', reward: '100金币', progress: 1, total: 1, completed: true },
    { id: 2, title: '副本挑战', desc: '完成1次副本', reward: '500银两', progress: 0, total: 1, completed: false },
    { id: 3, title: '收集资源', desc: '收集1000银两', reward: '200粮草', progress: 650, total: 1000, completed: false },
  ]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const claimReward = (taskId: number) => {
    alert('领取奖励成功！');
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.glitch} data-text="TASKS">TASKS</span>
      </h1>

      {/* 任务统计 */}
      <GameCard title="任务进度" className={styles.statsCard}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{tasks.filter(t => t.completed).length}</span>
            <span className={styles.statLabel}>已完成</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{tasks.length}</span>
            <span className={styles.statLabel}>总任务</span>
          </div>
        </div>
      </GameCard>

      {/* 任务列表 */}
      <div className={styles.taskList}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={[styles.taskItem, task.completed ? styles.completed : '']}
            onClick={() => setSelectedTask(task)}
          >
            <div className={styles.taskIcon}>
              {task.completed ? '✅' : '📋'}
            </div>
            <div className={styles.taskInfo}>
              <div className={styles.taskTitle}>{task.title}</div>
              <div className={styles.taskDesc}>{task.desc}</div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(task.progress / task.total) * 100}%` }}
                />
              </div>
              <div className={styles.taskReward}>🎁 {task.reward}</div>
            </div>
            {!task.completed && (
              <div className={styles.taskAction}>
                <GameButton size="small" variant="secondary">前往</GameButton>
              </div>
            )}
            {task.completed && (
              <div className={styles.taskAction}>
                <GameButton size="small" onClick={() => claimReward(task.id)}>领取</GameButton>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskPanel;
