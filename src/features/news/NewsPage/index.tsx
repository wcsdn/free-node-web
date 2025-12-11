/**
 * 新闻页面 - 支持 HN 新闻 / 空投活动 切换
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { newsService } from '@/services/news';
import './styles.css';

interface NewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

interface Activity {
  id: string;
  exchange: string;
  title: string;
  title_cn: string | null;
  url: string;
  type: string;
  end_time: string | null;
  created_at: number;
}

type TabType = 'news' | 'activities';

const API_BASE = 'https://core.free-node.xyz';

const NewsPage: React.FC = () => {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  
  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('news');
  
  // 新闻状态
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [newsUrls, setNewsUrls] = useState<{ [key: number]: string }>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasFetchedNewsRef = useRef(false);
  
  // 活动状态
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const hasFetchedActivitiesRef = useRef(false);

  // 备用模拟数据
  const mockNews: NewsItem[] = useMemo(() => [
    { rank: 1, title: '去中心化节点网络架构设计与实现', url: 'https://free-node.xyz' },
    { rank: 2, title: 'Web3 基础设施的未来发展趋势', url: 'https://free-node.xyz' },
    { rank: 3, title: 'React 中实现 Matrix 风格终端界面', url: 'https://free-node.xyz' },
  ], []);

  // 获取新闻数据
  useEffect(() => {
    if (hasFetchedNewsRef.current) return;
    hasFetchedNewsRef.current = true;

    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        setError(null);
        const data = await newsService.getNews(0, 10);
        const top10 = data.items.slice(0, 10);
        setNews(top10);
        setCurrentOffset(10);
      } catch (err) {
        console.error('获取新闻失败，使用备用数据:', err);
        setNews(mockNews);
        setCurrentOffset(10);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, [mockNews]);

  // 获取活动数据
  useEffect(() => {
    if (activeTab !== 'activities' || hasFetchedActivitiesRef.current) return;
    hasFetchedActivitiesRef.current = true;

    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/activities?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, [activeTab]);

  // 加载更多新闻
  const loadMoreNews = async () => {
    if (loadingMore || noMoreData) return;

    try {
      setLoadingMore(true);
      const data = await newsService.getNews(currentOffset, 10);
      const nextBatch = data.items.slice(currentOffset, currentOffset + 10);

      if (nextBatch.length === 0) {
        setNoMoreData(true);
        setDisplayedLines(prev => [...prev, '', '> 已经到底了，没有更多新闻了']);
      } else {
        setCurrentOffset(prev => prev + nextBatch.length);

        const newLines: string[] = [];
        const newUrls: { [key: number]: string } = { ...newsUrls };
        let currentDisplayNum = displayNumber;

        nextBatch.forEach((item) => {
          const title = item.titleCn || item.title;
          const lineIndex = displayedLines.length + newLines.length;
          newLines.push(`${currentDisplayNum}. ${title}`);
          newUrls[lineIndex] = item.url;
          currentDisplayNum++;
        });

        setDisplayNumber(currentDisplayNum);
        setNewsUrls(newUrls);

        let lineIndex = 0;
        const interval = setInterval(() => {
          if (lineIndex < newLines.length) {
            setDisplayedLines(prev => [...prev, newLines[lineIndex]]);
            lineIndex++;
          } else {
            clearInterval(interval);
          }
        }, 100);
      }
    } catch (err) {
      console.error('加载更多新闻失败:', err);
      setNoMoreData(true);
      setDisplayedLines(prev => [...prev, '', '> 加载失败']);
    } finally {
      setLoadingMore(false);
    }
  };

  // 终端打字机效果
  useEffect(() => {
    if (newsLoading || error || news.length === 0) return;

    setDisplayedLines([]);
    setDisplayNumber(1);

    const lines: string[] = [
      '🔥 HACKER NEWS 热榜',
      '> 点击新闻标题可跳转查看详情',
      '',
    ];

    const urls: { [key: number]: string } = {};
    let currentDisplayNum = 1;

    news.forEach((item) => {
      const title = item.titleCn || item.title;
      const lineIndex = lines.length;
      lines.push(`${currentDisplayNum}. ${title}`);
      urls[lineIndex] = item.url;
      currentDisplayNum++;
    });

    setDisplayNumber(currentDisplayNum);
    setNewsUrls(urls);

    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < lines.length) {
        setDisplayedLines((prev) => [...prev, lines[lineIndex]]);
        lineIndex++;

        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [news, newsLoading, error]);

  // 活动类型配置
  const activityTypes: Record<string, { label: string; labelCn: string; color: string }> = {
    airdrop: { label: 'Airdrop', labelCn: '空投', color: '#00ff41' },
    bonus: { label: 'Bonus', labelCn: '奖励', color: '#ffcc00' },
    competition: { label: 'Competition', labelCn: '比赛', color: '#ff6600' },
    other: { label: 'Event', labelCn: '活动', color: '#00ccff' },
  };

  const getTypeInfo = (type: string) => activityTypes[type] || activityTypes.other;

  return (
    <PageLayout title={isZh ? '> 信息终端' : '> INFO TERMINAL'}>
      <div className="news-terminal-container">
        {/* Tab 切换 */}
        <div className="news-tabs">
          <button
            className={`news-tab ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            {isZh ? '📰 HN 热榜' : '📰 HN News'}
          </button>
          <button
            className={`news-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            {isZh ? '🎁 空投活动' : '🎁 Airdrops'}
          </button>
        </div>

        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn-close"></span>
            <span className="btn-minimize"></span>
            <span className="btn-maximize"></span>
          </div>
          <div className="terminal-title">
            {activeTab === 'news' ? 'root@hackernews:~$' : 'root@airdrops:~$'}
          </div>
        </div>

        <div className="terminal-body" ref={terminalRef}>
          {/* 新闻 Tab */}
          {activeTab === 'news' && (
            <>
              {newsLoading && (
                <div className="terminal-loading">
                  <span className="cursor-blink">▋</span> {isZh ? '正在加载数据...' : 'Loading...'}
                </div>
              )}

              {error && (
                <div className="terminal-error">
                  <div>&gt; ERROR: {error}</div>
                </div>
              )}

              {!newsLoading && !error && displayedLines.map((line, index) => {
                const isClickable = newsUrls[index];
                return (
                  <div
                    key={index}
                    className={`terminal-line ${isClickable ? 'clickable' : ''}`}
                    onClick={() => isClickable && window.open(newsUrls[index], '_blank')}
                  >
                    {line}
                    {index === displayedLines.length - 1 && !loadingMore && !noMoreData && (
                      <span className="cursor-blink">▋</span>
                    )}
                  </div>
                );
              })}

              {!newsLoading && !error && displayedLines.length > 0 && !noMoreData && (
                <div className="load-more-container">
                  <button
                    className="load-more-button"
                    onClick={loadMoreNews}
                    disabled={loadingMore}
                  >
                    {loadingMore ? '> 正在加载...' : '> [ 加载更多 ]'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 活动 Tab */}
          {activeTab === 'activities' && (
            <>
              {activitiesLoading && (
                <div className="terminal-loading">
                  <span className="cursor-blink">▋</span> {isZh ? '正在加载活动...' : 'Loading activities...'}
                </div>
              )}

              {!activitiesLoading && activities.length === 0 && (
                <div className="terminal-line">
                  {isZh ? '> 暂无活动数据，敬请期待' : '> No activities yet, stay tuned'}
                </div>
              )}

              {!activitiesLoading && activities.length > 0 && (
                <>
                  <div className="terminal-line">🎁 {isZh ? '交易所空投活动' : 'Exchange Airdrops'}</div>
                  <div className="terminal-line">&gt; {isZh ? '点击活动可跳转查看详情' : 'Click to view details'}</div>
                  <div className="terminal-line">&nbsp;</div>
                  {activities.map((activity, index) => {
                    const typeInfo = getTypeInfo(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="terminal-line clickable activity-line"
                        onClick={() => window.open(activity.url, '_blank')}
                      >
                        <span className="activity-index">{index + 1}.</span>
                        <span 
                          className="activity-type-tag"
                          style={{ backgroundColor: typeInfo.color }}
                        >
                          {isZh ? typeInfo.labelCn : typeInfo.label}
                        </span>
                        <span className="activity-exchange">[{activity.exchange.toUpperCase()}]</span>
                        <span className="activity-title">
                          {isZh && activity.title_cn ? activity.title_cn : activity.title}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default NewsPage;
