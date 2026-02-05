/**
 * 签到面板组件
 * 每日签到、累积奖励、补签功能
 */
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/api';

interface SigninInfo {
  has_signed_today: boolean;
  consecutive_days: number;
  total_signin_days: number;
  recent_7_days: { date: string; signed: boolean }[];
  base_reward: number;
  next_consecutive_reward: {
    days: number;
    bonus_gold: number;
    bonus_items: string;
  } | null;
  today_reward: { gold: number };
}

interface SigninRecord {
  id: number;
  signin_date: string;
  consecutive_days: number;
  reward_gold: number;
  reward_items: string;
}

const SigninPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [signinInfo, setSigninInfo] = useState<SigninInfo | null>(null);
  const [records, setRecords] = useState<SigninRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'records'>('calendar');

  useEffect(() => {
    fetchSigninInfo();
    fetchRecords();
  }, []);

  const fetchSigninInfo = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: SigninInfo }>('/api/signin/info');
      if (res.success) {
        setSigninInfo(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch signin info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: { records: SigninRecord[] } }>('/api/signin/records?limit=10');
      if (res.success) {
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    }
  };

  const handleSignin = async () => {
    if (signing || signinInfo?.has_signed_today) return;
    
    setSigning(true);
    setMessage(null);
    
    try {
      const res = await apiPost<{ success: boolean; data: any; error?: string }>('/api/signin/signin');
      if (res.success) {
        setMessage(`签到成功！获得 ${res.data.reward.gold} 金币！${res.data.reward.items ? ` + ${res.data.reward.items}` : ''}`);
        fetchSigninInfo();
        fetchRecords();
      } else {
        setMessage(res.error || '签到失败');
      }
    } catch (err: any) {
      setMessage(err.message || '签到失败');
    } finally {
      setSigning(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getWeekday = (dateStr: string) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const date = new Date(dateStr);
    return weekdays[date.getDay()];
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  if (loading) {
    return (
      <div style={{ color: '#000', textAlign: 'center', padding: '40px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ color: '#000', minWidth: '400px', maxWidth: '500px' }}>
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #ddd'
      }}>
        <h3 style={{ margin: 0 }}>每日签到</h3>
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

      {/* 签到统计 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          padding: '12px', 
          background: '#e3f2fd', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
            {signinInfo?.consecutive_days || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>连续签到</div>
        </div>
        <div style={{ 
          padding: '12px', 
          background: '#fff3e0', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
            {signinInfo?.total_signin_days || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>累计签到</div>
        </div>
        <div style={{ 
          padding: '12px', 
          background: '#e8f5e9', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#388e3c' }}>
            {signinInfo?.today_reward?.gold || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>今日奖励</div>
        </div>
      </div>

      {/* 签到按钮 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleSignin}
          disabled={signing || signinInfo?.has_signed_today}
          style={{
            padding: '15px 50px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: signinInfo?.has_signed_today ? '#ccc' : 'linear-gradient(135deg, #4CAF50, #8BC34A)',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            cursor: signinInfo?.has_signed_today ? 'not-allowed' : 'pointer',
            boxShadow: signinInfo?.has_signed_today ? 'none' : '0 4px 15px rgba(76, 175, 80, 0.4)',
            transition: 'all 0.3s'
          }}
        >
          {signing ? '签到中...' : signinInfo?.has_signed_today ? '✓ 今日已签到' : '立即签到'}
        </button>
      </div>

      {/* 连续签到奖励提示 */}
      {signinInfo?.next_consecutive_reward && !signinInfo.has_signed_today && (
        <div style={{ 
          marginBottom: '20px',
          padding: '12px',
          background: 'linear-gradient(135deg, #fff9c4, #fff59d)',
          borderRadius: '8px',
          border: '1px solid #ffd54f'
        }}>
          <div style={{ fontSize: '13px', color: '#f57c00', fontWeight: 'bold', marginBottom: '5px' }}>
            再签到 {signinInfo.next_consecutive_reward.days} 天可获得：
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            +{signinInfo.next_consecutive_reward.bonus_gold} 金币 + {signinInfo.next_consecutive_reward.bonus_items}
          </div>
        </div>
      )}

      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'calendar' ? '#1976d2' : '#f0f0f0',
            color: activeTab === 'calendar' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          签到日历
        </button>
        <button
          onClick={() => setActiveTab('records')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'records' ? '#1976d2' : '#f0f0f0',
            color: activeTab === 'records' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          签到记录
        </button>
      </div>

      {/* 日历视图 */}
      {activeTab === 'calendar' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>近7天签到记录</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {signinInfo?.recent_7_days.map((day, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 4px',
                  background: day.signed ? '#e8f5e9' : '#f5f5f5',
                  borderRadius: '6px',
                  textAlign: 'center',
                  border: day.signed ? '1px solid #4CAF50' : '1px solid #ddd',
                  opacity: isToday(day.date) ? 1 : 0.7
                }}
              >
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
                  {getWeekday(day.date)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: day.signed ? '#4CAF50' : '#999' }}>
                  {formatDate(day.date)}
                </div>
                <div style={{ 
                  marginTop: '4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: day.signed ? '#4CAF50' : '#ddd',
                  margin: '4px auto 0'
                }}>
                  {day.signed && (
                    <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 签到记录 */}
      {activeTab === 'records' && (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无签到记录</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {records.map(record => (
                <li key={record.id} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{formatDate(record.signin_date)}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      连续 {record.consecutive_days} 天
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f57c00', fontWeight: 'bold' }}>+{record.reward_gold} 金币</div>
                    {record.reward_items && (
                      <div style={{ fontSize: '12px', color: '#9c27b0' }}>{record.reward_items}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SigninPanel;
