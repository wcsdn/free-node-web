/**
 * 养号统计组件
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

interface NurtureStatsProps {
  address?: string;
}

interface NurtureStatsData {
  accounts: {
    total: number;
    active: number;
    error: number;
    withToken: number;
  };
  today: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  recentLogs: Array<{
    from: string;
    to: string;
    subject: string;
    status: string;
    time: string;
  }>;
  nextScheduledRun: string;
  currentTime: string;
}

const API_BASE = import.meta.env.VITE_GHOST_MAIL_API || 'https://mail.free-node.xyz';

const NurtureStats: React.FC<NurtureStatsProps> = ({ address }) => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<NurtureStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isZh = language === 'zh';

  const fetchStats = async () => {
    if (!address) {
      setError(isZh ? '请先连接钱包' : 'Please connect wallet first');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/nurture/stats?address=${address}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'sent': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  if (loading && !stats) {
    return (
      <div className="nurture-stats">
        <div className="nurture-loading">
          {isZh ? '加载中...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nurture-stats">
        <div className="nurture-error">
          ❌ {error}
          <button onClick={fetchStats} className="retry-btn">
            {isZh ? '重试' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="nurture-stats">
      <div className="stats-section">
        <h3>📊 {isZh ? '账号统计' : 'Account Stats'}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.accounts.total}</span>
            <span className="stat-label">{isZh ? '总账号' : 'Total'}</span>
          </div>
          <div className="stat-card active">
            <span className="stat-value">{stats.accounts.active}</span>
            <span className="stat-label">{isZh ? '活跃' : 'Active'}</span>
          </div>
          <div className="stat-card error">
            <span className="stat-value">{stats.accounts.error}</span>
            <span className="stat-label">{isZh ? '异常' : 'Error'}</span>
          </div>
          <div className="stat-card token">
            <span className="stat-value">{stats.accounts.withToken}</span>
            <span className="stat-label">{isZh ? '有Token' : 'With Token'}</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>📧 {isZh ? '今日发送' : 'Today\'s Sends'}</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.today.total}</span>
            <span className="stat-label">{isZh ? '总计' : 'Total'}</span>
          </div>
          <div className="stat-card success">
            <span className="stat-value">{stats.today.sent}</span>
            <span className="stat-label">{isZh ? '成功' : 'Sent'}</span>
          </div>
          <div className="stat-card error">
            <span className="stat-value">{stats.today.failed}</span>
            <span className="stat-label">{isZh ? '失败' : 'Failed'}</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-value">{stats.today.pending}</span>
            <span className="stat-label">{isZh ? '待处理' : 'Pending'}</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>⏰ {isZh ? '定时任务' : 'Scheduled Task'}</h3>
        <div className="schedule-info">
          <p>{isZh ? '下次执行' : 'Next run'}: <strong>{formatTime(stats.nextScheduledRun)}</strong></p>
          <p className="schedule-note">{isZh ? '每 4 小时自动执行一次养号任务' : 'Runs every 4 hours automatically'}</p>
        </div>
      </div>

      <div className="stats-section">
        <h3>📜 {isZh ? '最近发送' : 'Recent Sends'}</h3>
        <div className="recent-logs">
          {stats.recentLogs.length === 0 ? (
            <p className="no-logs">{isZh ? '暂无记录' : 'No records yet'}</p>
          ) : (
            stats.recentLogs.map((log, index) => (
              <div key={index} className={`log-item ${log.status}`}>
                <span className="log-status">{getStatusEmoji(log.status)}</span>
                <span className="log-from" title={log.from}>{log.from.split('@')[0]}</span>
                <span className="log-arrow">→</span>
                <span className="log-to" title={log.to}>{log.to.split('@')[0]}</span>
                <span className="log-time">{formatTime(log.time)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={fetchStats} className="refresh-btn" disabled={loading}>
        🔄 {loading ? (isZh ? '刷新中...' : 'Refreshing...') : (isZh ? '刷新' : 'Refresh')}
      </button>
    </div>
  );
};

export default NurtureStats;
