/**
 * 签到面板
 * 
 * 功能：
 * - 显示本月签到日历
 * - 今日签到按钮
 * - 连续签到奖励展示
 * - 签到记录
 */
import React, { useState, useEffect, useCallback } from 'react';
import { getSigninInfo, doSignin, type SigninInfo } from '../../services/gameApi';

// 奖励图标映射
const REWARD_ICONS: Record<number, string> = {
  1001: '⚔️',
  1002: '🛡️',
  8001: '🏆',
};

interface SigninPanelProps {
  onRefresh?: () => void;
}

export const SigninPanel: React.FC<SigninPanelProps> = ({ onRefresh }) => {
  const [signinInfo, setSigninInfo] = useState<SigninInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载签到信息
  const loadSigninInfo = useCallback(async () => {
    setLoading(true);
    const result = await getSigninInfo();
    if (result.success && result.data) {
      setSigninInfo(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSigninInfo();
  }, [loadSigninInfo]);

  // 执行签到
  const handleSignin = async () => {
    if (!signinInfo?.canSignin) return;
    setSubmitting(true);
    setMessage(null);
    const result = await doSignin();
    if (result.success && result.data) {
      const data = result.data;
      setMessage({ type: 'success', text: data.message || '签到成功！' });
      // 重新加载签到信息
      await loadSigninInfo();
      onRefresh?.();
    } else {
      setMessage({ type: 'error', text: result.error || '签到失败' });
    }
    setSubmitting(false);
  };

  // 获取本月天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 获取本月第一天的星期
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // 渲染日历
  const renderCalendar = () => {
    if (!signinInfo) return null;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    // 已签到的日期（根据连续签到天数推算）
    const signedDays: number[] = [];
    if (signinInfo.consecutiveDays > 0) {
      for (let i = 0; i < signinInfo.consecutiveDays; i++) {
        const day = ((signinInfo.consecutiveDays - 1 - i) % 7) + 1;
        if (!signedDays.includes(day)) signedDays.push(day);
      }
    }
    // 如果今天已签到，加入今天
    if (signinInfo.isToday) {
      const todayDay = today.getDate();
      if (!signedDays.includes(todayDay)) signedDays.push(todayDay);
    }

    const cells: React.ReactNode[] = [];
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="signin-calendar-empty" />);
    }
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate();
      const isSigned = signedDays.includes(day);
      const isFuture = day > today.getDate();
      const reward = signinInfo.weekReward[(day - 1) % 7];

      cells.push(
        <div
          key={`day-${day}`}
          className={`signin-calendar-day ${isToday ? 'today' : ''} ${isSigned ? 'signed' : ''} ${isFuture ? 'future' : ''}`}
          title={reward ? `奖励: ${reward.gold}金币` : ''}
        >
          <span className="signin-day-number">{day}</span>
          {isSigned && <span className="signin-check">✓</span>}
          {isToday && !isSigned && <span className="signin-today-dot">●</span>}
        </div>
      );
    }

    return (
      <div className="signin-calendar">
        <div className="signin-calendar-header">
          {weekDays.map((d, i) => (
            <div key={i} className="signin-weekday">{d}</div>
          ))}
        </div>
        <div className="signin-calendar-grid">
          {cells}
        </div>
      </div>
    );
  };

  // 渲染本周奖励
  const renderWeekRewards = () => {
    if (!signinInfo) return null;
    return (
      <div className="signin-week-rewards">
        <div className="signin-section-title">📅 本周奖励</div>
        <div className="signin-reward-list">
          {signinInfo.weekReward.map((reward, idx) => (
            <div
              key={idx}
              className={`signin-reward-item ${signinInfo.consecutiveDays % 7 === reward.day ? 'current' : ''} ${signinInfo.consecutiveDays % 7 > reward.day ? 'claimed' : ''}`}
            >
              <div className="signin-reward-day">第{reward.day}天</div>
              <div className="signin-reward-gold">💰 {reward.gold}</div>
              <div className="signin-reward-items">
                {reward.items.map((item, i) => (
                  <span key={i} title={`物品ID: ${item.itemId}`}>
                    {REWARD_ICONS[item.itemId] || '📦'} x{item.count}
                  </span>
                ))}
              </div>
              {signinInfo.consecutiveDays % 7 >= reward.day && reward.day > 0 && (
                <div className="signin-reward-claimed">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="signin-panel">
        <div className="signin-loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="signin-panel">
      <div className="signin-header">
        <h2 className="signin-title">📝 每日签到</h2>
        <div className="signin-stats">
          <span className="signin-consecutive">
            🔥 连续签到 <strong>{signinInfo?.consecutiveDays || 0}</strong> 天
          </span>
        </div>
      </div>

      {/* 签到按钮 */}
      <div className="signin-action-area">
        {message && (
          <div className={`signin-message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="signin-today-reward">
          <div className="signin-today-label">今日奖励</div>
          <div className="signin-today-value">
            💰 {signinInfo?.todayReward?.gold || 0} 金币
            {signinInfo?.todayReward?.items?.map((item, i) => (
              <span key={i} className="signin-today-item">
                {REWARD_ICONS[item.itemId] || '📦'} x{item.count}
              </span>
            ))}
          </div>
        </div>

        <button
          className={`signin-btn ${signinInfo?.canSignin ? 'can-signin' : 'already-signed'}`}
          onClick={handleSignin}
          disabled={!signinInfo?.canSignin || submitting}
        >
          {submitting ? '签到中...' : signinInfo?.isToday ? '今日已签到 ✓' : '立即签到 🎁'}
        </button>
      </div>

      {/* 日历 */}
      {renderCalendar()}

      {/* 周奖励 */}
      {renderWeekRewards()}

      <style>{`
        .signin-panel {
          padding: 15px;
          color: #e2e8f0;
        }
        .signin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .signin-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #f1f5f9;
        }
        .signin-consecutive {
          font-size: 14px;
          color: #94a3b8;
        }
        .signin-consecutive strong {
          color: #f97316;
          font-size: 16px;
        }
        .signin-action-area {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
          border: 1px solid #334155;
        }
        .signin-message {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .signin-message.success {
          background: #052e16;
          color: #4ade80;
          border: 1px solid #166534;
        }
        .signin-message.error {
          background: #450a0a;
          color: #ef4444;
          border: 1px solid #991b1b;
        }
        .signin-today-reward {
          margin-bottom: 15px;
        }
        .signin-today-label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 5px;
        }
        .signin-today-value {
          font-size: 20px;
          font-weight: 600;
          color: #ffd700;
        }
        .signin-today-item {
          margin-left: 10px;
          font-size: 14px;
        }
        .signin-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .signin-btn.can-signin {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: #fff;
        }
        .signin-btn.can-signin:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
        }
        .signin-btn.already-signed, .signin-btn:disabled {
          background: #334155;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .signin-loading {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }
        .signin-calendar {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 20px;
          border: 1px solid #334155;
        }
        .signin-calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 10px;
        }
        .signin-weekday {
          text-align: center;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        .signin-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .signin-calendar-empty {
          height: 36px;
        }
        .signin-calendar-day {
          height: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 13px;
          position: relative;
          background: #1e293b;
          color: #94a3b8;
        }
        .signin-calendar-day.today {
          border: 2px solid #3b82f6;
          color: #fff;
        }
        .signin-calendar-day.signed {
          background: #052e16;
          color: #4ade80;
          border: 1px solid #166534;
        }
        .signin-calendar-day.future {
          opacity: 0.4;
        }
        .signin-check {
          position: absolute;
          top: 2px;
          right: 4px;
          font-size: 10px;
          color: #4ade80;
        }
        .signin-today-dot {
          position: absolute;
          bottom: 2px;
          font-size: 6px;
          color: #3b82f6;
        }
        .signin-day-number {
          font-weight: 500;
        }
        .signin-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 12px;
        }
        .signin-week-rewards {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 15px;
          border: 1px solid #334155;
        }
        .signin-reward-list {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .signin-reward-item {
          background: #0f172a;
          border-radius: 8px;
          padding: 8px 4px;
          text-align: center;
          font-size: 11px;
          border: 1px solid #334155;
          position: relative;
        }
        .signin-reward-item.current {
          border-color: #f97316;
          background: #451a03;
        }
        .signin-reward-item.claimed {
          opacity: 0.6;
        }
        .signin-reward-day {
          color: #64748b;
          margin-bottom: 4px;
          font-size: 10px;
        }
        .signin-reward-gold {
          color: #ffd700;
          font-weight: 600;
          font-size: 12px;
        }
        .signin-reward-items {
          margin-top: 2px;
          font-size: 12px;
        }
        .signin-reward-claimed {
          position: absolute;
          top: 2px;
          right: 2px;
          color: #4ade80;
          font-size: 10px;
        }

        /* ==================== 签到面板移动端适配 ==================== */
        @media (max-width: 768px) {
          .signin-panel {
            padding: 12px 8px;
          }

          .signin-header {
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 14px;
          }

          .signin-title {
            font-size: 16px;
          }

          .signin-consecutive {
            font-size: 12px;
          }

          .signin-action-area {
            padding: 14px 12px;
            margin-bottom: 14px;
            border-radius: 10px;
          }

          .signin-today-value {
            font-size: 18px;
          }

          .signin-btn {
            min-height: 48px;
            font-size: 15px;
            padding: 12px;
          }

          .signin-calendar {
            padding: 10px 8px;
            margin-bottom: 14px;
            border-radius: 10px;
          }

          .signin-calendar-day {
            height: 32px;
            font-size: 12px;
          }

          .signin-calendar-empty {
            height: 32px;
          }

          .signin-weekday {
            font-size: 11px;
          }

          .signin-section-title {
            font-size: 13px;
            margin-bottom: 10px;
          }

          .signin-week-rewards {
            padding: 12px 10px;
            border-radius: 10px;
          }

          .signin-reward-list {
            gap: 4px;
          }

          .signin-reward-item {
            padding: 6px 3px;
            font-size: 10px;
          }

          .signin-reward-day {
            font-size: 9px;
          }

          .signin-reward-gold {
            font-size: 11px;
          }
        }

        @media (max-width: 400px) {
          .signin-calendar-grid {
            gap: 2px;
          }

          .signin-calendar-day {
            height: 28px;
            font-size: 11px;
          }

          .signin-calendar-empty {
            height: 28px;
          }

          .signin-reward-list {
            grid-template-columns: repeat(7, 1fr);
            gap: 3px;
          }

          .signin-reward-item {
            padding: 5px 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default SigninPanel;
