/**
 * TaskPanel - 任务面板
 * 原则：移动端优先，简洁设计
 */
import React, { useState } from 'react';
import { GameCard, GameButton, GameModal } from '@/shared/components/game';

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

export const TaskPanel: React.FC<TaskPanelProps> = () => {
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

  const stats = {
    completed: tasks.filter(t => t.completed).length,
    total: tasks.length,
    progress: Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100),
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* 标题 */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-emerald-400 
                     tracking-wider uppercase">
        TASKS
      </h1>

      {/* 任务统计 */}
      <GameCard title="任务进度" className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">已完成</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-slate-400">{stats.total}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">总数</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-amber-400">{stats.progress}%</div>
            <div className="text-xs text-slate-500 uppercase mt-1">完成率</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </GameCard>

      {/* 任务列表 */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all duration-200
              ${task.completed 
                ? 'bg-slate-800/30 border-slate-700/50 opacity-75' 
                : 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/50'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* 状态图标 */}
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${task.completed 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-700 text-slate-500'
                }
              `}>
                {task.completed ? '✓' : '○'}
              </div>

              {/* 任务信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold truncate ${task.completed ? 'text-slate-400' : 'text-emerald-400'}`}>
                    {task.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 truncate">{task.desc}</p>
                
                {/* 进度 */}
                {task.total > 1 && !task.completed && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>进度</span>
                      <span>{task.progress}/{task.total}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500/50"
                        style={{ width: `${(task.progress / task.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 奖励 */}
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                  <span>🎁</span>
                  <span>{task.reward}</span>
                </div>
              </div>

              {/* 箭头 */}
              <div className="text-slate-600">›</div>
            </div>
          </div>
        ))}
      </div>

      {/* 详情弹窗 */}
      <GameModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || '任务详情'}
        size="small"
      >
        {selectedTask && (
          <div className="space-y-4">
            {/* 描述 */}
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-300">{selectedTask.desc}</p>
            </div>

            {/* 进度 */}
            {selectedTask.total > 1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">进度</span>
                  <span className="text-emerald-400">{selectedTask.progress}/{selectedTask.total}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500"
                    style={{ width: `${(selectedTask.progress / selectedTask.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* 奖励 */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
              <span className="text-amber-400">🎁 奖励: {selectedTask.reward}</span>
            </div>

            {/* 操作 */}
            {selectedTask.completed ? (
              <div className="text-center text-slate-500 text-sm">
                已完成
              </div>
            ) : (
              <GameButton fullWidth onClick={() => claimReward(selectedTask.id)}>
                领取奖励
              </GameButton>
            )}
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default TaskPanel;
