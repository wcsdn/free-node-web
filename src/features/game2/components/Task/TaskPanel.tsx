/**
 * 任务面板组件
 * 
 * 功能：
 * - 显示任务列表（剧情任务、日常任务、合成任务、节日任务、资源兑换等）
 * - 任务详情查看
 * - 任务接受/提交/取消操作
 * - 任务进度展示
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { 
  TaskData, 
  TaskFilterType, 
  TaskType, 
  TaskState,
  TaskNameColor,
  DailyTaskListResponse,
  ComposeTaskData,
  FeastTaskData,
  ExchangeTaskData
} from '../../types';
import { TaskType as TaskTypeEnum, TaskState as TaskStateEnum, TaskNameColor as TaskNameColorEnum } from '../../types';
import { toast } from '../common/Toast';

// API 基础路径
const API_BASE = '/api/task';

// 任务类型名称映射
const TASK_TYPE_NAMES: Record<number, string> = {
  [TaskTypeEnum.Story]: '剧情任务',
  [TaskTypeEnum.Daily]: '日常任务',
  [TaskTypeEnum.Promotion]: '推广任务',
  [TaskTypeEnum.Compose]: '合成任务',
  [TaskTypeEnum.Master]: '名匠任务',
  [TaskTypeEnum.Festival]: '节日任务',
  [TaskTypeEnum.Exchange]: '资源兑换',
  [TaskTypeEnum.Collection]: '收集任务',
};

// 任务名称颜色样式映射
const TASK_COLOR_STYLES: Record<number, React.CSSProperties> = {
  [TaskNameColorEnum.Red]: { color: '#ef4444' },
  [TaskNameColorEnum.Blue]: { color: '#3b82f6' },
  [TaskNameColorEnum.Purple]: { color: '#a855f7' },
  [TaskNameColorEnum.Gold]: { color: '#ffd700' },
  [TaskNameColorEnum.Default]: { color: '#fff' },
};

// 任务状态显示
const TASK_STATE_TEXT: Record<number, { text: string; color: string }> = {
  [TaskStateEnum.InProgress]: { text: '进行中', color: '#facc15' },
  [TaskStateEnum.Completed]: { text: '可领取', color: '#4ade80' },
  [TaskStateEnum.Locked]: { text: '已领取', color: '#888' },
};

interface TaskPanelProps {
  cityId: number;
  onClose?: () => void;
}

interface TaskTabConfig {
  key: TaskFilterType;
  label: string;
  icon: string;
}

const TASK_TABS: TaskTabConfig[] = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'story', label: '剧情', icon: '📜' },
  { key: 'daily', label: '日常', icon: '📅' },
  { key: 'compose', label: '合成', icon: '⚒️' },
  { key: 'festival', label: '节日', icon: '🎉' },
  { key: 'exchange', label: '兑换', icon: '💱' },
  { key: 'other', label: '其他', icon: '📦' },
];

/**
 * 任务面板主组件
 */
export const TaskPanel: React.FC<TaskPanelProps> = ({ cityId, onClose }) => {
  // 状态
  const [activeTab, setActiveTab] = useState<TaskFilterType>('all');
  const [taskList, setTaskList] = useState<TaskData[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // 获取任务列表
  const fetchTaskList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/list?city_id=${cityId}`);
      const result = await response.json();
      if (result.success) {
        setTaskList(result.data?.tasks || []);
      } else {
        setError(result.error || '获取任务列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Fetch task list error:', err);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  // 获取任务详情
  const fetchTaskDetail = useCallback(async (taskId: number) => {
    try {
      const response = await fetch(`${API_BASE}/list?city_id=${cityId}`);
      const result = await response.json();
      if (result.success && result.data?.tasks) {
        const task = result.data.tasks.find((t: TaskData) => t.ID === taskId);
        if (task) {
          setSelectedTask(task);
        }
      }
    } catch (err) {
      console.error('Fetch task detail error:', err);
    }
  }, [cityId]);

  // 接受任务
  const handleAcceptTask = async (taskId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, task_id: taskId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('接受任务成功！');
        await fetchTaskList();
        setSelectedTask(null);
      } else {
        toast.error(result.error || '接受任务失败');
        setError(result.error || '接受任务失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
      setError('网络错误，请稍后重试');
      console.error('Accept task error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 提交任务
  const handleSubmitTask = async (taskId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, task_id: taskId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('提交任务成功！');
        await fetchTaskList();
        setSelectedTask(null);
      } else {
        toast.error(result.error || '提交任务失败');
        setError(result.error || '提交任务失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
      setError('网络错误，请稍后重试');
      console.error('Submit task error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 取消任务
  const handleCancelTask = async (taskId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, task_id: taskId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('放弃任务成功！');
        await fetchTaskList();
        setSelectedTask(null);
      } else {
        toast.error(result.error || '取消任务失败');
        setError(result.error || '取消任务失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
      setError('网络错误，请稍后重试');
      console.error('Cancel task error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 领取任务奖励
  const handleClaimReward = async (taskId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, task_id: taskId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('领取奖励成功！');
        await fetchTaskList();
        setSelectedTask(null);
      } else {
        toast.error(result.error || '领取奖励失败');
        setError(result.error || '领取奖励失败');
      }
    } catch (err) {
      toast.error('网络错误，请稍后重试');
      setError('网络错误，请稍后重试');
      console.error('Claim reward error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchTaskList();
  }, [fetchTaskList]);

  // 筛选任务
  const filteredTasks = taskList.filter(task => {
    if (activeTab === 'all') return true;
    
    const taskTypeMap: Record<TaskFilterType, TaskType[]> = {
      'all': [],
      'story': [TaskTypeEnum.Story],
      'daily': [TaskTypeEnum.Daily, TaskTypeEnum.Collection],
      'compose': [TaskTypeEnum.Compose, TaskTypeEnum.Master],
      'festival': [TaskTypeEnum.Festival],
      'exchange': [TaskTypeEnum.Exchange],
      'other': [TaskTypeEnum.Promotion],
    };
    
    const targetTypes = taskTypeMap[activeTab];
    return targetTypes.includes(task.TaskType);
  });

  // 渲染任务颜色
  const getTaskColorStyle = (colorIndex: number): React.CSSProperties => {
    return TASK_COLOR_STYLES[colorIndex] || TASK_COLOR_STYLES[TaskNameColorEnum.Default];
  };

  // 渲染任务状态
  const getTaskStateInfo = (state: number) => {
    return TASK_STATE_TEXT[state] || TASK_STATE_TEXT[TaskStateEnum.Locked];
  };

  // 计算任务进度
  const getTaskProgress = (task: TaskData): { current: number; total: number; percentage: number } => {
    const current = task.hasCondition || task.hasTaskItemNum || 0;
    const total = task.ConditionValue || task.taskItemNum || task.ConditionTarget || 1;
    const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;
    return { current, total, percentage };
  };

  // 获取坐标显示
  const getPositionDisplay = (pos: number): string => {
    if (!pos || pos === 0) return '';
    const x = ((pos - 1) % 400) + 1;
    const y = Math.floor((pos - 1) / 400) + 1;
    return `(${x}, ${y})`;
  };

  return (
    <div className="task-panel">
      {/* 面板标题 */}
      <div className="task-header">
        <h2 className="task-title">📜 任务系统</h2>
        <div className="task-header-actions">
          <button className="task-refresh-btn" onClick={fetchTaskList} disabled={loading}>
            {loading ? '刷新中...' : '🔄 刷新'}
          </button>
          {onClose && (
            <button className="task-close-btn" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {/* 任务标签页 */}
      <div className="task-tabs">
        {TASK_TABS.map(tab => (
          <button
            key={tab.key}
            className={`task-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="task-tab-icon">{tab.icon}</span>
            <span className="task-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="task-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* 任务内容区域 */}
      <div className="task-content">
        {/* 左侧：任务列表 */}
        <div className="task-list-container">
          {loading && taskList.length === 0 ? (
            <div className="task-loading">
              <div className="task-loading-spinner"></div>
              <span>加载中...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="task-empty">
              <div className="task-empty-icon">📋</div>
              <div className="task-empty-text">暂无任务</div>
              <div className="task-empty-hint">
                {activeTab === 'all' ? '尝试刷新或切换任务类型' : '该分类下暂无任务'}
              </div>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map(task => {
                const stateInfo = getTaskStateInfo(task.State);
                const progress = getTaskProgress(task);
                return (
                  <div
                    key={`${task.ID}-${task.SubType}`}
                    className={`task-item ${selectedTask?.ID === task.ID ? 'selected' : ''} ${task.State === TaskStateEnum.Completed ? 'completed' : ''}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="task-item-header">
                      <span 
                        className="task-item-name"
                        style={getTaskColorStyle(task.NameColor)}
                      >
                        {task.Name}
                      </span>
                      <span 
                        className="task-item-state"
                        style={{ color: stateInfo.color }}
                      >
                        {stateInfo.text}
                      </span>
                    </div>
                    <div className="task-item-type">
                      {TASK_TYPE_NAMES[task.TaskType] || '未知任务'}
                    </div>
                    {task.State === TaskStateEnum.InProgress && progress.total > 0 && (
                      <div className="task-item-progress">
                        <div className="task-progress-bar">
                          <div 
                            className="task-progress-fill"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <span className="task-progress-text">
                          {progress.current}/{progress.total}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧：任务详情 */}
        <div className="task-detail-container">
          {selectedTask ? (
            <div className="task-detail">
              {/* 任务详情头部 */}
              <div className="task-detail-header">
                <h3 
                  className="task-detail-name"
                  style={getTaskColorStyle(selectedTask.NameColor)}
                >
                  {selectedTask.Name}
                </h3>
                <div className="task-detail-meta">
                  <span className="task-detail-type">
                    {TASK_TYPE_NAMES[selectedTask.TaskType] || '未知任务'}
                  </span>
                  <span 
                    className="task-detail-state"
                    style={{ color: getTaskStateInfo(selectedTask.State).color }}
                  >
                    {getTaskStateInfo(selectedTask.State).text}
                  </span>
                </div>
              </div>

              {/* 任务描述 */}
              <div className="task-detail-section">
                <div className="task-detail-label">📋 任务描述</div>
                <div className="task-detail-content">
                  {selectedTask.Description || '暂无描述'}
                </div>
              </div>

              {/* 任务目标 */}
              <div className="task-detail-section">
                <div className="task-detail-label">🎯 任务目标</div>
                <div className="task-detail-content">
                  {selectedTask.ConditonTargetName && (
                    <div className="task-target-item">
                      {selectedTask.ConditonTargetName}
                      {getPositionDisplay(selectedTask.ConditonTargetPos) && (
                        <span className="task-target-pos">
                          {getPositionDisplay(selectedTask.ConditonTargetPos)}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedTask.ActionDes && (
                    <div className="task-target-action">
                      {selectedTask.ActionDes}
                    </div>
                  )}
                </div>
              </div>

              {/* 任务进度 */}
              {selectedTask.State === TaskStateEnum.InProgress && (
                <div className="task-detail-section">
                  <div className="task-detail-label">📊 任务进度</div>
                  <div className="task-detail-content">
                    {(() => {
                      const progress = getTaskProgress(selectedTask);
                      return (
                        <div className="task-progress-container">
                          <div className="task-progress-bar-large">
                            <div 
                              className="task-progress-fill"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <div className="task-progress-info">
                            <span>当前进度：{progress.current}</span>
                            <span>目标：{progress.total}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 任务奖励 */}
              <div className="task-detail-section">
                <div className="task-detail-label">🎁 任务奖励</div>
                <div className="task-detail-content">
                  <div className="task-reward-list">
                    {selectedTask.GainValue > 0 && (
                      <div className="task-reward-item">
                        <span className="task-reward-icon">💰</span>
                        <span className="task-reward-name">
                          {selectedTask.GainType === 1 ? '金币' : '资源'}
                        </span>
                        <span className="task-reward-value">+{selectedTask.GainValue}</span>
                      </div>
                    )}
                    {selectedTask.GainType === 2 && (
                      <div className="task-reward-item">
                        <span className="task-reward-icon">🌾</span>
                        <span className="task-reward-name">粮食</span>
                        <span className="task-reward-value">+{selectedTask.GainValue}</span>
                      </div>
                    )}
                    {selectedTask.GainType === 3 && (
                      <div className="task-reward-item">
                        <span className="task-reward-icon">🪵</span>
                        <span className="task-reward-name">木材</span>
                        <span className="task-reward-value">+{selectedTask.GainValue}</span>
                      </div>
                    )}
                    {selectedTask.GainType === 4 && (
                      <div className="task-reward-item">
                        <span className="task-reward-icon">🪨</span>
                        <span className="task-reward-name">石料</span>
                        <span className="task-reward-value">+{selectedTask.GainValue}</span>
                      </div>
                    )}
                    {selectedTask.GainType === 5 && (
                      <div className="task-reward-item">
                        <span className="task-reward-icon">⚙️</span>
                        <span className="task-reward-name">铁矿</span>
                        <span className="task-reward-value">+{selectedTask.GainValue}</span>
                      </div>
                    )}
                    {selectedTask.GainType === 6 && selectedTask.GainIndex > 0 && (
                      <div className="task-reward-item">
                        <span className="task-reward-icon">📦</span>
                        <span className="task-reward-name">物品 #{selectedTask.GainIndex}</span>
                        <span className="task-reward-value">×1</span>
                      </div>
                    )}
                    {selectedTask.GainValue === 0 && selectedTask.GainType === 0 && (
                      <div className="task-reward-item">
                        <span className="task-reward-text">暂无奖励</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 任务操作按钮 */}
              <div className="task-detail-actions">
                {selectedTask.State === TaskStateEnum.Locked && (
                  <button
                    className="task-action-btn accept"
                    onClick={() => handleAcceptTask(selectedTask.ID)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '处理中...' : '📥 接受任务'}
                  </button>
                )}
                {selectedTask.State === TaskStateEnum.Completed && (
                  <button
                    className="task-action-btn submit"
                    onClick={() => handleClaimReward(selectedTask.ID)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '处理中...' : '🎁 领取奖励'}
                  </button>
                )}
                {selectedTask.State === TaskStateEnum.InProgress && (
                  <button
                    className="task-action-btn cancel"
                    onClick={() => handleCancelTask(selectedTask.ID)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '处理中...' : '❌ 放弃任务'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="task-detail-empty">
              <div className="task-detail-empty-icon">📜</div>
              <div className="task-detail-empty-text">选择一个任务查看详情</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskPanel;
