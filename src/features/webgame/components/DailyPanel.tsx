/**
 * 每日任务面板组件
 * 每日任务、活跃度奖励
 */
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/api';

interface DailyTask {
  config: {
    id: number;
    name: string;
    description: string;
    target: number;
    reward_exp: number;
    reward_gold: number;
    icon: string;
    type: string;
  };
  progress: number;
  status: number; // 0=进行中, 1=已完成, 2=已领取
  activity_points: number;
}

interface ActivityReward {
  points: number;
  reward_gold: number;
  reward_items: string;
}

const DailyPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [totalActivity, setTotalActivity] = useState(0);
  const [activityRewards, setActivityRewards] = useState<ActivityReward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'activity'>('tasks');

  useEffect(() => {
    fetchDailyData();
  }, []);

  const fetchDailyData = async () => {
    try {
      const res = await apiGet<{
        success: boolean;
        data: {
          tasks: DailyTask[];
          total_activity: number;
          activity_rewards: ActivityReward[];
        };
      }>('/api/daily/tasks');

      if (res.success) {
        setTasks(res.data.tasks || []);
        setTotalActivity(res.data.total_activity || 0);
        setActivityRewards(res.data.activity_rewards || []);

        // 获取活跃度奖励领取状态
        const statusRes = await apiGet<{
          success: boolean;
          data: { claimed_status: Record<number, boolean> };
        }>('/api/daily/activity-status');

        if (statusRes.success) {
          setClaimedRewards(statusRes.data.claimed_status || {});
        }
      }
    } catch (err) {
      console.error('Failed to fetch daily data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (taskId: number) => {
    setClaiming(taskId);
    setMessage(null);

    try {
      const res = await apiPost<{ success: boolean; data?: { reward: { exp: number; gold: number; items?: string } }; error?: string }>('/api/daily/claim', { task_id: taskId });

      if (res.success) {
        setMessage(`领取成功！获得 ${res.data?.reward?.exp || 0} 经验和 ${res.data?.reward?.gold || 0} 金币`);
        fetchDailyData();
      } else {
        setMessage(res.error || '领取失败');
      }
    } catch (err: any) {
      setMessage(err.message || '领取失败');
    }
  };

  const handleClaimActivityReward = async (points: number) => {
    setClaiming(points);
    setMessage(null);

    try {
      const res = await apiPost<{ success: boolean; data?: { reward: { gold: number; items?: string } }; error?: string }>('/api/daily/claim-activity', { points });

      if (res.success) {
        setMessage(`领取成功！获得 ${res.data?.reward?.gold || 0} 金币${res.data?.reward?.items ? ` + ${res.data?.reward?.items}` : ''}`);
        fetchDailyData();
      } else {
        setMessage(res.error || '领取失败');
      }
    } catch (err: any) {
      setMessage(err.message || '领取失败');
    } finally {
      setClaiming(null);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return '进行中';
      case 1: return '已完成';
      case 2: return '已领取';
      default: return '';
    }
  };

  const getStatusStyle = (status: number) => {
    switch (status) {
      case 0: return { bg: '#fff3e0', color: '#f57c00' };
      case 1: return { bg: '#e8f5e9', color: '#4caf50' };
      case 2: return { bg: '#e0e0e0', color: '#9e9e9e' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  const completedTasks = tasks.filter(t => t.status === 1).length;
  const allTasksCompleted = tasks.length > 0 && completedTasks === tasks.length;

  if (loading) {
    return (
      <div style={{ color: '#000', textAlign: 'center', padding: '40px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ color: '#000', minWidth: '420px', maxWidth: '500px' }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #ddd'
      }}>
        <h3 style={{ margin: 0 }}>每日任务</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>×</button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          background: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* 活跃度进度 */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px' }}>今日活跃度</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalActivity} <span style={{ fontSize: '12px' }}>/ 100</span></span>
        </div>
        {/* 星星显示 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {[10, 30, 50, 80, 100].map((points) => (
            <div
              key={points}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background: totalActivity >= points ? '#ffd700' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          已完成 {completedTasks}/{tasks.length} 个任务
        </div>
      </div>

      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'tasks' ? '#667eea' : '#f0f0f0',
            color: activeTab === 'tasks' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          任务列表
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'activity' ? '#667eea' : '#f0f0f0',
            color: activeTab === 'activity' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          活跃奖励
        </button>
      </div>

      {/* 任务列表 */}
      {activeTab === 'tasks' && (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无任务</div>
          ) : (
            tasks.map(task => {
              const style = getStatusStyle(task.status);
              const progressPercent = Math.min((task.progress / task.config.target) * 100, 100);

              return (
                <div
                  key={task.config.id}
                  style={{
                    padding: '12px',
                    marginBottom: '10px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{task.config.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{task.config.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{task.config.description}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: style.bg,
                      color: style.color
                    }}>
                      {getStatusText(task.status)}
                    </span>
                  </div>

                  {/* 进度条 */}
                  {task.status === 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#666' }}>进度</span>
                        <span style={{ color: '#666' }}>{task.progress}/{task.config.target}</span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: '#e0e0e0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #667eea, #764ba2)',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  )}

                  {/* 奖励信息 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid #eee'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <span style={{ color: '#f57c00', marginRight: '10px' }}>+{task.config.reward_exp} 经验</span>
                      <span style={{ color: '#4caf50' }}>+{task.config.reward_gold} 金币</span>
                    </div>

                    {task.status === 1 && (
                      <button
                        onClick={() => handleClaimTask(task.config.id)}
                        disabled={claiming === task.config.id}
                        style={{
                          padding: '6px 16px',
                          background: claiming === task.config.id ? '#ccc' : 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: claiming === task.config.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {claiming === task.config.id ? '领取中...' : '领取奖励'}
                      </button>
                    )}

                    {task.status === 2 && (
                      <span style={{ fontSize: '12px', color: '#999' }}>✓ 已领取</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 活跃度奖励 */}
      {activeTab === 'activity' && (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {activityRewards.map(reward => {
            const canClaim = totalActivity >= reward.points;
            const isClaimed = claimedRewards[reward.points];

            return (
              <div
                key={reward.points}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  marginBottom: '10px',
                  background: isClaimed ? '#f5f5f5' : (canClaim ? '#e8f5e9' : '#fff'),
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  opacity: isClaimed ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* 星星图标 */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: canClaim ? '#ffd700' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {isClaimed ? '✓' : '★'}
                  </div>

                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{reward.points} 活跃度</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {reward.reward_gold} 金币{reward.reward_items && ` + ${reward.reward_items}`}
                    </div>
                  </div>
                </div>

                {isClaimed ? (
                  <span style={{ fontSize: '12px', color: '#999' }}>已领取</span>
                ) : canClaim ? (
                  <button
                    onClick={() => handleClaimActivityReward(reward.points)}
                    disabled={claiming === reward.points}
                    style={{
                      padding: '6px 16px',
                      background: claiming === reward.points ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: claiming === reward.points ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {claiming === reward.points ? '领取中...' : '领取'}
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#999' }}>未达成</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DailyPanel;
