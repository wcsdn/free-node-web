/**
 * DailyPanel - 每日任务面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard, GameButton } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

export const DailyPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/api/daily`, {
      headers: getAuthHeaders(),
    }).then(res => res.json()).then(data => {
      if (data.success) setTasks(data.data?.tasks || []);
      setLoading(false);
    });
  }, []);

  const handleClaim = async (taskId: number) => {
    const res = await fetch(`${getApiBase()}/api/daily/claim`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ task_id: taskId }),
    });
    const data = await res.json();
    if (data.success) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    }
  };

  return (
    <GameCard title="每日任务">
      {loading ? <p>加载中...</p> : (
        <>
          {tasks.map(task => (
            <div key={task.id} style={{ marginBottom: 15, padding: 10, border: '1px solid #333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#00FF00' }}>{task.title}</span>
                <span>{task.current}/{task.target}</span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
                奖励: 经验 {task.reward?.exp} / 金币 {task.reward?.gold}
              </div>
              <div style={{ marginTop: 10 }}>
                {task.completed ? (
                  <span style={{ color: '#00FF00' }}>✓ 已完成</span>
                ) : (
                  <div style={{ width: '100%', height: 6, background: '#333' }}>
                    <div style={{ width: `${task.progress}%`, height: '100%', background: '#00FF00' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <GameButton onClick={onClose}>关闭</GameButton>
        </>
      )}
    </GameCard>
  );
};

export default DailyPanel;
