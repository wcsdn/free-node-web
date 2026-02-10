import React, { useState, useEffect } from 'react';
import gufengStyles from '../../styles/gufeng.module.css';

import gameApi from '../../services/gameApi';
import styles from './DailyPanel.module.css';

interface DailyPanelProps {
  onClose: () => void;
}

interface DailyTask {
  id: number;
  title: string;
  description: string;
  progress: number;
  target?: number;
  reward?: { exp: number; gold: number };
  status: 'completed' | 'in_progress' | 'locked';
}

interface DailyData {
  date: string;
  tasks: DailyTask[];
  stats: {
    total: number;
    completed: number;
    claimed: number;
    totalExp: number;
  };
}

export const DailyPanel: React.FC<DailyPanelProps> = ({ onClose }) => {
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyData();
  }, []);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      const res = await gameApi.getDailyTasks();
      if (res.success && res.data) {
        setDailyData(res.data as DailyData);
      }
    } catch (error) {
      console.error('加载每日任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (taskId: number) => {
    try {
      const res = await gameApi.claimDailyReward(taskId);
      if (res.success) {
        alert('领取成功！');
        loadDailyData();
      } else {
        alert(res.error || '领取失败');
      }
    } catch (error) {
      alert('领取失败，请稍后重试');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'locked': return '未解锁';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return gufengStyles.completed;
      case 'in_progress': return gufengStyles.inProgress;
      case 'locked': return gufengStyles.locked;
      default: return '';
    }
  };

  return (
    <div className={gufengStyles.overlay}>
      <div className={gufengStyles.panel}>
        <div className={gufengStyles.header}>
          <h2>📅 每日任务</h2>
          <button className={gufengStyles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className={gufengStyles.loading}>加载中...</div>
        ) : (
          <>
            {/* 统计信息 */}
            <div className={gufengStyles.stats}>
              <div className={gufengStyles.statItem}>
                <span className={gufengStyles.statValue}>{dailyData?.stats.completed || 0}/{dailyData?.stats.total || 0}</span>
                <span className={gufengStyles.statLabel}>完成</span>
              </div>
              <div className={gufengStyles.statItem}>
                <span className={gufengStyles.statValue}>{dailyData?.stats.claimed || 0}</span>
                <span className={gufengStyles.statLabel}>已领取</span>
              </div>
              <div className={gufengStyles.statItem}>
                <span className={gufengStyles.statValue}>+{dailyData?.stats.totalExp || 0}</span>
                <span className={gufengStyles.statLabel}>可获经验</span>
              </div>
            </div>

            {/* 任务列表 */}
            <div className={gufengStyles.taskList}>
              {dailyData?.tasks?.map((task) => (
                <div key={task.id} className={`${gufengStyles.taskItem} ${getStatusClass(task.status)}`}>
                  <div className={gufengStyles.taskInfo}>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    {task.status === 'in_progress' && (
                      <div className={gufengStyles.progressBar}>
                        <div 
                          className={gufengStyles.progressFill} 
                          style={{ width: `${(task.progress / (task.target || 1)) * 100}%` }}
                        />
                        <span className={gufengStyles.progressText}>
                          {task.progress}/{task.target || 100}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={gufengStyles.taskReward}>
                    <span>奖励: {task.reward?.exp || 0} 经验</span>
                    {task.status === 'completed' && !dailyData.date && (
                      <button 
                        className={gufengStyles.claimBtn}
                        onClick={() => handleClaim(task.id)}
                      >
                        领取
                      </button>
                    )}
                    <span className={`${gufengStyles.status} ${getStatusClass(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                </div>
              ))}
              {(!dailyData?.tasks || dailyData.tasks.length === 0) && (
                <div className={gufengStyles.empty}>今日暂无任务</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyPanel;
