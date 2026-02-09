/**
 * 任务面板组件
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, memo } from 'react';
import { getApiBase, getAuthHeaders } from '../utils/api';
import { GameButton } from '@/shared/components/game';

const TASK_TYPES = {
  1: { name: '主线', color: '#9D080D' },
  2: { name: '日常', color: '#35c235' },
  3: { name: '成就', color: '#f99608' },
};

// TaskConfig removed - interface not used

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
  status: number;
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
  error?: string;
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400">📋 任务系统</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className="mx-4 mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm border border-emerald-500/30">
            {message}
          </div>
        )}

        {/* 等级信息 */}
        <div className="px-4 py-2 text-sm text-slate-500 border-b border-slate-700">
          当前等级: <span className="text-emerald-400 font-bold">Lv.{userLevel}</span>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-slate-700">
          {(['main', 'daily'] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'main' ? '主线任务' : '日常任务'}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : currentTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              暂无任务
            </div>
          ) : (
            <div className="space-y-3">
              {currentTasks.map((task) => {
                const typeInfo = TASK_TYPES[task.type as keyof typeof TASK_TYPES] || { name: '未知', color: '#666' };
                return (
                  <div
                    key={task.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-emerald-400">{task.name}</span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}
                      >
                        {typeInfo.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{task.desc}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>目标: {task.progress}/{task.target}</span>
                      <span>奖励: {task.reward_exp}经验 {task.reward_gold}金币</span>
                    </div>
                    <div className="flex gap-2">
                      {task.status === 0 && task.can_accept && (
                        <GameButton size="sm" onClick={() => handleAccept(task.id)}>
                          接受任务
                        </GameButton>
                      )}
                      {task.status === 1 && task.progress >= task.target && (
                        <GameButton size="sm" variant="emerald" onClick={() => handleSubmit(task.id)}>
                          完成任务
                        </GameButton>
                      )}
                      {task.status === 1 && task.progress < task.target && (
                        <span className="px-3 py-1.5 bg-slate-700 text-slate-500 rounded text-sm">
                          进行中
                        </span>
                      )}
                      {task.status === 2 && (
                        <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded text-sm">
                          已完成
                        </span>
                      )}
                      {!task.can_accept && task.status === 0 && (
                        <span className="px-3 py-1.5 bg-slate-700 text-slate-500 rounded text-sm">
                          需 Lv.{task.req_level}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TaskPanel.displayName = 'TaskPanel';

export default TaskPanel;
