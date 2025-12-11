/**
 * 新闻页面 - Web3 快讯 + HN 热榜
 * 支持分类筛选，未登录只显示 2 条
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { newsService } from '@/services/news';
import './styles.css';

interface Activity {
  id: string;
  exchange: string;
  title: string;
  title_cn: string | null;
  url: string;
  type: string;
  category?: string;
  priority?: number;
  source?: string;
  created_at: number;
}

interface HNNewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

type TabType = 'web3' | 'hn';
type CategoryType = 'all' | 'exchange_activity' | 'airdrop' | 'exchange_news' | 'project_update' | 'market_hot';

const API_BASE = 'https://core.free-node.xyz';

// 分类配置
const CATEGORY_CONFIG: Record<CategoryType, { label: string; labelCn: string; icon: string; color: string }> = {
  all: { label: 'All', labelCn: '全部', icon: '📋', color: '#00ff41' },
  exchange_activity: { label: 'Exchange', labelCn: '交易所活动', icon: '🔥', color: '#ff4444' },
  airdrop: { label: 'Airdrop', labelCn: '空投', icon: '🪂', color: '#aa44ff' },
  exchange_news: { label: 'CEX News', labelCn: '交易所', icon: '🏦', color: '#4488ff' },
  project_update: { label: 'Project', labelCn: '项目动态', icon: '🚀', color: '#44ff88' },
  market_hot: { label: 'Market', labelCn: '市场热点', icon: '📈', color: '#ffaa44' },
};

// 根据 type 或 category 获取分类
function getCategory(activity: Activity): CategoryType {
  if (activity.category && activity.category !== 'general') {
    return activity.category as CategoryType;
  }
  // 兼容旧数据
  if (activity.type === 'airdrop') return 'airdrop';
  if (activity.type === 'bonus') return 'exchange_activity';
  return 'exchange_news';
}

// 格式化时间
function formatTime(timestamp: number, isZh: boolean): string {
  // 如果时间戳小于 10^12，说明是秒级，需要转换为毫秒
  const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return isZh ? '刚刚' : 'Just now';
  if (minutes < 60) return isZh ? `${minutes}分钟前` : `${minutes}m ago`;
  if (hours < 24) return isZh ? `${hours}小时前` : `${hours}h ago`;
  if (days > 365) return isZh ? '很久以前' : 'Long ago';
  return isZh ? `${days}天前` : `${days}d ago`;
}

const NewsPage: React.FC = () => {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('web3');
  
  // Web3 快讯状态
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const hasFetchedActivitiesRef = useRef(false);
  
  // HN 新闻状态
  const [hnNews, setHnNews] = useState<HNNewsItem[]>([]);
  const [hnLoading, setHnLoading] = useState(false);
  const hasFetchedHNRef = useRef(false);

  // 获取 Web3 活动数据
  useEffect(() => {
    if (hasFetchedActivitiesRef.current) return;
    hasFetchedActivitiesRef.current = true;

    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/activities?limit=100`);
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.activities || []).sort((a: Activity, b: Activity) => {
            const priorityA = a.priority || 5;
            const priorityB = b.priority || 5;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return b.created_at - a.created_at;
          });
          setActivities(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // 获取 HN 新闻（切换到 HN Tab 时加载）
  useEffect(() => {
    if (activeTab !== 'hn' || hasFetchedHNRef.current) return;
    hasFetchedHNRef.current = true;

    const fetchHN = async () => {
      setHnLoading(true);
      try {
        const data = await newsService.getNews(0, 30);
        setHnNews(data.items || []);
      } catch (err) {
        console.error('Failed to fetch HN news:', err);
      } finally {
        setHnLoading(false);
      }
    };

    fetchHN();
  }, [activeTab]);

  // 筛选活动
  const filteredActivities = activities.filter(activity => {
    if (activeCategory === 'all') return true;
    return getCategory(activity) === activeCategory;
  });

  // 未登录只显示 2 条
  const displayActivities = isConnected ? filteredActivities : filteredActivities.slice(0, 2);

  const handleLoginClick = () => {
    openConnectModal?.();
  };

  const loading = activeTab === 'web3' ? activitiesLoading : hnLoading;

  return (
    <PageLayout title={isZh ? '> 信息终端' : '> INFO TERMINAL'}>
      <div className="news-container">
        {/* Tab 切换 */}
        <div className="news-tabs">
          <button
            className={`news-tab ${activeTab === 'web3' ? 'active' : ''}`}
            onClick={() => setActiveTab('web3')}
          >
            {isZh ? '🔥 Web3 快讯' : '🔥 Web3 News'}
          </button>
          <button
            className={`news-tab ${activeTab === 'hn' ? 'active' : ''}`}
            onClick={() => setActiveTab('hn')}
          >
            {isZh ? '📰 HN 热榜' : '📰 HN Top'}
          </button>
        </div>

        {/* Web3 快讯 Tab */}
        {activeTab === 'web3' && (
          <>
            {/* 分类筛选 */}
            <div className="news-categories">
          {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map(cat => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{ '--cat-color': config.color } as React.CSSProperties}
              >
                <span className="cat-icon">{config.icon}</span>
                <span className="cat-label">{isZh ? config.labelCn : config.label}</span>
              </button>
            );
          })}
        </div>

        {/* 新闻列表 */}
        <div className="news-list">
          {loading && (
            <div className="news-loading">
              <span className="loading-dot">●</span>
              {isZh ? '加载中...' : 'Loading...'}
            </div>
          )}

          {!loading && displayActivities.length === 0 && (
            <div className="news-empty">
              {isZh ? '暂无相关快讯' : 'No news yet'}
            </div>
          )}

          {!loading && displayActivities.map(activity => {
            const category = getCategory(activity);
            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.exchange_news;
            const source = activity.source || activity.exchange || 'unknown';

            return (
              <div
                key={activity.id}
                className="news-card"
                onClick={() => window.open(activity.url, '_blank')}
              >
                <div className="news-card-header">
                  <span 
                    className="news-tag"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.icon} {isZh ? config.labelCn : config.label}
                  </span>
                  {activity.priority === 1 && (
                    <span className="news-hot">HOT</span>
                  )}
                </div>
                <div className="news-card-title">
                  {isZh && activity.title_cn ? activity.title_cn : activity.title}
                </div>
                <div className="news-card-meta">
                  <span className="news-source">
                    {source.toUpperCase()}
                  </span>
                  <span className="news-time">
                    {formatTime(activity.created_at, isZh)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* 未登录提示 */}
          {!activitiesLoading && !isConnected && filteredActivities.length > 2 && (
            <div className="news-login-prompt">
              <div className="login-prompt-text">
                {isZh 
                  ? `还有 ${filteredActivities.length - 2} 条快讯，登录后查看全部`
                  : `${filteredActivities.length - 2} more news, login to view all`
                }
              </div>
              <button className="login-prompt-btn" onClick={handleLoginClick}>
                {isZh ? '🔓 连接钱包查看全部' : '🔓 Connect to View All'}
              </button>
            </div>
          )}
        </div>
          </>
        )}

        {/* HN 热榜 Tab */}
        {activeTab === 'hn' && (
          <div className="news-list hn-list">
            {hnLoading && (
              <div className="news-loading">
                <span className="loading-dot">●</span>
                {isZh ? '加载中...' : 'Loading...'}
              </div>
            )}

            {!hnLoading && hnNews.length === 0 && (
              <div className="news-empty">
                {isZh ? '暂无新闻' : 'No news yet'}
              </div>
            )}

            {!hnLoading && hnNews.map((item, index) => (
              <div
                key={index}
                className="hn-card"
                onClick={() => window.open(item.url, '_blank')}
              >
                <span className="hn-rank">{item.rank}</span>
                <div className="hn-content">
                  <div className="hn-title">{item.title}</div>
                  {item.titleCn && item.titleCn !== item.title && (
                    <div className="hn-title-cn">{item.titleCn}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default NewsPage;
