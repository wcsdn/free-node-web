/**
 * 交易所活动列表组件
 */
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { activityTypes } from '../data/exchanges';

interface Activity {
  id: string;
  exchange: string;
  title: string;
  title_cn: string | null;
  url: string;
  type: string;
  end_time: string | null;
}

const API_BASE = 'https://core.free-node.xyz';

const ActivityList: React.FC = () => {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let fetched = false;

    const fetchActivities = async () => {
      if (fetched) return;
      fetched = true;
      try {
        const res = await fetch(`${API_BASE}/api/activities?limit=10`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getTypeInfo = (type: string) => {
    return activityTypes[type as keyof typeof activityTypes] || activityTypes.other;
  };

  const formatEndTime = (endTime: string | null) => {
    if (!endTime) return null;
    const date = new Date(endTime);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return isZh ? '已结束' : 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return isZh ? `${days}天后截止` : `${days}d left`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return isZh ? `${hours}小时后截止` : `${hours}h left`;
  };

  if (loading) {
    return (
      <div className="activity-list">
        <h3 className="section-title">
          {isZh ? '🎁 最新活动' : '🎁 Latest Events'}
        </h3>
        <div className="activity-loading">
          <span className="cursor-blink">▋</span> {isZh ? '加载中...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-list">
        <h3 className="section-title">
          {isZh ? '🎁 最新活动' : '🎁 Latest Events'}
        </h3>
        <div className="activity-empty">
          {isZh ? '暂无活动，敬请期待' : 'No events yet, stay tuned'}
        </div>
      </div>
    );
  }

  return (
    <div className="activity-list">
      <h3 className="section-title">
        {isZh ? '🎁 最新活动' : '🎁 Latest Events'}
      </h3>
      <div className="activities">
        {activities.map((activity) => {
          const typeInfo = getTypeInfo(activity.type);
          const endTimeText = formatEndTime(activity.end_time);
          
          return (
            <div 
              key={activity.id} 
              className="activity-item"
              onClick={() => handleClick(activity.url)}
            >
              <span 
                className="activity-type" 
                style={{ backgroundColor: typeInfo.color }}
              >
                {isZh ? typeInfo.labelCn : typeInfo.label}
              </span>
              <span className="activity-exchange">[{activity.exchange.toUpperCase()}]</span>
              <span className="activity-title">
                {isZh && activity.title_cn ? activity.title_cn : activity.title}
              </span>
              {endTimeText && (
                <span className="activity-deadline">{endTimeText}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityList;
