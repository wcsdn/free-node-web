/**
 * 访问量统计组件
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';

const API_BASE = 'https://core.free-node.xyz';

interface VisitorCounterProps {
  page?: string;
}

const VisitorCounter: React.FC<VisitorCounterProps> = ({ page = '/exchanges' }) => {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [monthlyViews, setMonthlyViews] = useState<number | null>(null);

  useEffect(() => {
    let recorded = false;

    // 记录访问（只执行一次）
    const recordView = async () => {
      if (recorded) return;
      recorded = true;
      try {
        await fetch(`${API_BASE}/api/stats/pageviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page }),
        });
      } catch (err) {
        console.error('Failed to record page view:', err);
      }
    };

    // 获取统计
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats/pageviews?page=${page}&days=30`);
        if (res.ok) {
          const data = await res.json();
          setMonthlyViews(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch page views:', err);
      }
    };

    recordView();
    fetchStats();
  }, [page]);

  const formatNumber = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}w`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="visitor-counter">
      <span className="visitor-icon">👁️</span>
      <span className="visitor-text">
        {isZh ? '本月访问：' : 'Monthly Views: '}
        <span className="visitor-count">
          {monthlyViews !== null ? formatNumber(monthlyViews) : '...'}
        </span>
      </span>
    </div>
  );
};

export default VisitorCounter;
