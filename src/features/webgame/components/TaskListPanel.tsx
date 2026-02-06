/**
 * 任务面板组件
 * 任务列表、接受任务、提交任务
 */
import React, { useState, useEffect, memo } from 'react';
import styles from '../styles/TaskPanel.module.css';
import { getApiBase, getAuthHeaders } from '../utils/api';

// 任务类型
const TASK_TYPES = {
  1: { name: '主线', color: '#9D080D' },
  2: { name: '日常', color: '#35c235' },
  3: { name: '成就', color: '#f99608' },
};

interface TaskConfig {
  id: number;
  name: string;
  type: number;
  desc: string;
  target: number;
  reward_exp: number;
  reward_gold: number;
  req_level: number;
}

interface Task {
  id: number;
  config_id: number;
  name: string;
  type: number;
  desc: string;
  target: number;
  reward_exp: number;
  reward_gold: number;
  req_level: number;
  status: number; // 0=未接, 1=进行中, 2=已完成
  progress: number;
  can_accept: boolean;
}

interface TaskListResponse {
  success: boolean;
  data: {
    main: Task[];
    daily: Task[];
    level: number;
  };
  error?: string;  // ✅ 添加 error 属性
}

interface TaskPanelProps {
  onClose: () => void;
}

const TaskPanel: React.FC<TaskPanelProps> = memo(({ onClose }) => {
  const [tasks, setTasks] = useState<{ main: Task[]; daily: Task[] }>({ main: [], daily: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'main' | 'daily'>('main');
  const [message, setMessage] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState(1);

  const fetchTasks = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/task/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data: TaskListResponse = await res.json();
      
      if (data.success) {
        setTasks({ main: data.data.main || [], daily: data.data.daily || [] });
        setUserLevel(data.data.level || 1);
      } else {
        setMessage(data.error || '加载任务失败');
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setMessage('加载任务失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAccept = async (taskId: number) => {
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/task/accept`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('接受任务成功！');
        fetchTasks();
      } else {
        setMessage(data.error || '接受失败');
      }
    } catch (err) {
      setMessage('接受失败');
    }
  };

  const handleSubmit = async (taskId: number) => {
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/task/submit`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage(`提交成功！获得 ${data.data?.rewards?.exp || 0} 经验，${data.data?.rewards?.gold || 0} 金币`);
        fetchTasks();
      } else {
        setMessage(data.error || '提交失败');
      }
    } catch (err) {
      setMessage('提交失败');
    }
  };

  const currentTasks = activeTab === 'main' ? tasks.main : tasks.daily;
  // const tabName = activeTab === 'main' ? '主线任务' : '日常任务'; // 未使用变量注释掉

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📋 任务系统</h2>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {/* 等级信息 */}
      <div className={styles.levelInfo}>
        当前等级: Lv.{userLevel}
      </div>

      {/* Tab 切换 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'main' ? styles.active : ''}`}
          onClick={() => setActiveTab('main')}
        >
          主线任务
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'daily' ? styles.active : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          日常任务
        </button>
      </div>

      {/* 任务列表 */}
      <div className={styles.taskList}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : currentTasks.length === 0 ? (
          <div className={styles.empty}>暂无任务</div>
        ) : (
          currentTasks.map(task => (
            <div key={task.id} className={`${styles.taskCard} ${styles[`type${task.type}`]}`}>
              <div className={styles.taskHeader}>
                <span className={styles.taskName}>{task.name}</span>
                <span 
                  className={styles.taskType}
                  style={{ color: TASK_TYPES[task.type as keyof typeof TASK_TYPES]?.color || '#666' }}
                >
                  {TASK_TYPES[task.type as keyof typeof TASK_TYPES]?.name || '未知'}
                </span>
              </div>
              
              <div className={styles.taskDesc}>{task.desc}</div>
              
              <div className={styles.taskInfo}>
                <span>目标: {task.progress}/{task.target}</span>
                <span>奖励: {task.reward_exp}经验 {task.reward_gold}金币</span>
              </div>

              <div className={styles.taskActions}>
                {task.status === 0 && task.can_accept && (
                  <button 
                    className={styles.acceptBtn}
                    onClick={() => handleAccept(task.id)}
                  >
                    接受任务
                  </button>
                )}
                {task.status === 1 && task.progress >= task.target && (
                  <button 
                    className={styles.submitBtn}
                    onClick={() => handleSubmit(task.id)}
                  >
                    完成任务
                  </button>
                )}
                {task.status === 1 && task.progress < task.target && (
                  <span className={styles.pendingBtn}>进行中</span>
                )}
                {task.status === 2 && (
                  <span className={styles.completedBtn}>已完成</span>
                )}
                {!task.can_accept && task.status === 0 && (
                  <span className={styles.lockedBtn}>需 Lv.{task.req_level}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

TaskPanel.displayName = 'TaskPanel';

export default TaskPanel;
