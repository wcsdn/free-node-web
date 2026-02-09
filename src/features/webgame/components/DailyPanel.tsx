/**
 * DailyPanel - 每日任务面板 (简化版)
 */
import React, { useState, useEffect } from 'react';
import { GameCard } from '@/shared/components/game';
import { getApiBase, getAuthHeaders } from '../utils/api';

interface DailyPanelProps {
  onClose?: () => void;
}

export const DailyPanel: React.FC<DailyPanelProps> = ({ onClose }) => {
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">每日任务</h2>
      <GameCard title="任务列表">
        {loading ? <p>加载中...</p> : (
          <div>
            {tasks.map(task => (
              <div key={task.id} style={{ marginBottom: 15, padding: 10, border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#00FF00' }}>{task.title}</span>
                  <span>{task.current}/{task.target}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>
                  奖励: 经验 {task.reward?.exp} / 金币 {task.reward?.gold}
                </div>
              </div>
            ))}
          </div>
        )}
      </GameCard>
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded">关闭</button>
    </div>
  );
};

export default DailyPanel;
