/**
 * 任务面板组件
 */
import React, { useEffect, useState } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import { gameApi, Task } from '../../services/gameApi';
import styles from '../../styles/jxMain.module.css';

interface TaskPanelProps {
  walletAddress: string;
  onClose: () => void;
}

// 扩展 Task 接口以包含额外的显示字段
interface TaskDisplay extends Task {
  can_accept?: boolean;
  reward_exp?: number;
  reward_gold?: number;
  req_level?: number;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ onClose }) => {
  const [mainTasks, setMainTasks] = useState<TaskDisplay[]>([]);
  const [dailyTasks, setDailyTasks] = useState<TaskDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await gameApi.getTaskList();
      if (res.success) {
        const tasks = (res.data || []) as TaskDisplay[];
        setMainTasks(tasks);
        setDailyTasks(tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
    setLoading(false);
  };

  const handleAccept = async (taskId: number) => {
    try {
      const res = await gameApi.acceptTask(taskId);
      if (res.success) {
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to accept task:', err);
    }
  };

  const handleSubmit = async (taskId: number, heroIds: number[] = []) => {
    try {
      const res = await gameApi.submitTask(taskId, heroIds);
      if (res.success) {
        loadTasks();
      }
    } catch (err) {
      console.error('Failed to submit task:', err);
    }
  };

  return (
    <div className={gufengStyles.panel}>
      <div className={gufengStyles.header}>
        <h2>任务列表</h2>
        <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
      </div>

      {loading ? (
        <div className={gufengStyles.loading}>加载中...</div>
      ) : (
        <div className={gufengStyles.content}>
          {/* 主线任务 */}
          <div className={gufengStyles.section}>
            <h3>主线任务</h3>
            {mainTasks.filter(t => t.task_type === 0).length === 0 ? (
              <div className={gufengStyles.empty}>暂无主线任务</div>
            ) : (
              mainTasks.filter(t => t.task_type === 0).map(task => (
                <div key={task.id} className={gufengStyles.taskCard}>
                  <div className={gufengStyles.taskHeader}>
                    <span className={gufengStyles.taskName}>{task.name}</span>
                    <span className={`${gufengStyles.taskStatus} ${task.status === 2 ? gufengStyles.completed : task.status === 1 ? gufengStyles.ongoing : ''}`}>
                      {task.status === 2 ? '已完成' : task.status === 1 ? '进行中' : '未接取'}
                    </span>
                  </div>
                  <div className={gufengStyles.taskDesc}>{task.description}</div>
                  <div className={gufengStyles.taskProgress}>
                    进度: {task.progress}/{task.target}
                    <div className={gufengStyles.progressBar}>
                      <div className={gufengStyles.progressFill} style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }} />
                    </div>
                  </div>
                  <div className={gufengStyles.taskReward}>
                    奖励: <span className={gufengStyles.exp}>+{task.reward_exp || 0}经验</span> <span className={gufengStyles.gold}>+{task.reward_gold || 0}金币</span>
                  </div>
                  <div className={gufengStyles.taskActions}>
                    {task.status === 0 && (
                      <button onClick={() => handleAccept(task.id)}>接取任务</button>
                    )}
                    {task.status === 1 && (
                      <button onClick={() => handleSubmit(task.id)}>提交任务</button>
                    )}
                    {task.status === 2 && (
                      <button disabled>已完成</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 日常任务 */}
          <div className={gufengStyles.section}>
            <h3>日常任务</h3>
            {dailyTasks.filter(t => t.task_type === 1).length === 0 ? (
              <div className={gufengStyles.empty}>暂无日常任务</div>
            ) : (
              dailyTasks.filter(t => t.task_type === 1).map(task => (
                <div key={task.id} className={gufengStyles.taskCard}>
                  <div className={gufengStyles.taskHeader}>
                    <span className={gufengStyles.taskName}>{task.name}</span>
                    <span className={`${gufengStyles.taskStatus} ${task.status === 2 ? gufengStyles.completed : task.status === 1 ? gufengStyles.ongoing : ''}`}>
                      {task.status === 2 ? '已完成' : task.status === 1 ? '进行中' : '未接取'}
                    </span>
                  </div>
                  <div className={gufengStyles.taskDesc}>{task.description}</div>
                  <div className={gufengStyles.taskProgress}>
                    进度: {task.progress}/{task.target}
                    <div className={gufengStyles.progressBar}>
                      <div className={gufengStyles.progressFill} style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }} />
                    </div>
                  </div>
                  <div className={gufengStyles.taskReward}>
                    奖励: <span className={gufengStyles.exp}>+{task.reward_exp || 0}经验</span> <span className={gufengStyles.gold}>+{task.reward_gold || 0}金币</span>
                  </div>
                  <div className={gufengStyles.taskActions}>
                    {task.status === 0 && (
                      <button onClick={() => handleAccept(task.id)}>接取任务</button>
                    )}
                    {task.status === 1 && (
                      <button onClick={() => handleSubmit(task.id)}>提交任务</button>
                    )}
                    {task.status === 2 && (
                      <button disabled>已完成</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

TaskPanel.displayName = 'TaskPanel';

export default TaskPanel;
