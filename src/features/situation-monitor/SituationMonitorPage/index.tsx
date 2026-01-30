/**
 * 态势监控页面 - 全球热点事件
 */
import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { CategoryTabs, SearchBox, QuickFilters, NewsCard } from '../components';
import GlobeComponent from '../components/Globe';
import './styles.css';

interface Article {
  id?: string;
  title: string;
  titleCn?: string; // 改为 titleCn 以匹配后端的 title_cn
  description?: string;
  url: string;
  source?: string;
  category?: string;
  priority?: number;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  created_at?: number;
}

interface Location {
  name: string;
  lat: number;
  lng: number;
  count: number;
  titles: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'All', labelCn: '全部', icon: '📋' },
  { id: '美国政策监控', label: 'US Policy', labelCn: '美国政策监控', icon: '🇺🇸' },
  { id: '地缘政治', label: 'Geopolitics', labelCn: '地缘政治', icon: '🌍' },
  { id: '冲突地区', label: 'Conflicts', labelCn: '冲突地区', icon: '⚔️' },
  { id: '国防与情报', label: 'Defense', labelCn: '国防与情报', icon: '🛡️' },
  { id: '经济战', label: 'Economic', labelCn: '经济战', icon: '💰' },
  { id: '印度', label: 'India', labelCn: '印度', icon: '🇮🇳' },
  { id: '市场', label: 'Market', labelCn: '市场', icon: '📈' },
  { id: '网络与科技', label: 'Cyber', labelCn: '网络与科技', icon: '🔒' },
];

const QUICK_FILTERS = [
  'trump', 'biden', 'china', 'russia', 'ukraine', 'taiwan', 'iran', 'israel', 'india', 'nato'
];

// API 地址：开发环境使用本地，生产环境使用线上
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8787' 
  : 'https://news.free-node.xyz';

const SituationMonitorPage: React.FC = () => {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const { playClick } = useSoundEffect();

  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 加载书签
  useEffect(() => {
    const saved = localStorage.getItem('situation-monitor-bookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  // 定义加载函数
  const loadArticles = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      params.append('limit', '50');

      const response = await fetch(`${API_BASE}/api/situation-monitor/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.data || data.items || [];
        const mappedItems = items.map((item: any) => ({
          ...item,
          titleCn: item.title_cn || item.titleCn,
        }));
        setArticles(mappedItems);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearchTerm]);

  const loadLocations = React.useCallback(async () => {
    try {
      console.log('Loading globe locations from:', `${API_BASE}/api/situation-monitor/globe-data`);
      const response = await fetch(`${API_BASE}/api/situation-monitor/globe-data`);
      console.log('Globe data response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Globe data received:', data);
        const items = Array.isArray(data) ? data : data.data || data.locations || [];
        console.log('Processed globe locations:', items.length, 'items');
        setLocations(items);
      } else {
        console.error('Failed to fetch globe data, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      setLocations([]);
    }
  }, []);

  // 加载文章（根据分类和搜索词）
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // 加载地点数据（只在初始化时加载一次）
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleCategoryChange = (categoryId: string) => {
    playClick();
    setActiveCategory(categoryId);
    listRef.current?.scrollTo(0, 0);
  };

  const handleQuickFilter = (keyword: string) => {
    playClick();
    setSearchTerm(keyword);
    listRef.current?.scrollTo(0, 0);
  };

  const handleBookmark = (url: string) => {
    const updated = bookmarks.includes(url)
      ? bookmarks.filter(b => b !== url)
      : [...bookmarks, url];
    setBookmarks(updated);
    localStorage.setItem('situation-monitor-bookmarks', JSON.stringify(updated));
  };

  return (
    <PageLayout title={isZh ? '> 幽灵情报站' : '> GHOST INTEL'}>
      <div className="situation-monitor">
        {/* 侧边栏 */}
        <aside className="sm-sidebar">
          {/* 3D 地球 */}
          <div className="sm-section">
            <h3 className="sm-section-title">{isZh ? '🕸️ 全球动态' : '🕸️ Global'}</h3>
            <GlobeComponent locations={locations} isZh={isZh} />
          </div>

          {/* 快速筛选 - 移到地球下面 */}
          <div className="sm-section">
            <h3 className="sm-section-title">{isZh ? '⚡ 快速筛选' : '⚡ Quick'}</h3>
            <QuickFilters keywords={QUICK_FILTERS} onFilter={handleQuickFilter} isZh={isZh} />
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="sm-main">
          {/* 搜索和筛选 */}
          <div className="sm-controls">
            <SearchBox value={searchTerm} onChange={setSearchTerm} isZh={isZh} />
            <div className="sm-bookmark-count">
              ★ {bookmarks.length}
            </div>
          </div>

          {/* 分类标签 */}
          <CategoryTabs
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            isZh={isZh}
          />

          {/* 文章列表 */}
          <div className="sm-articles" ref={listRef}>
            {loading ? (
              <div className="sm-loading">{isZh ? '加载中...' : 'Loading...'}</div>
            ) : articles.length === 0 ? (
              <div className="sm-empty">{isZh ? '暂无文章' : 'No articles'}</div>
            ) : (
              articles.map((article, idx) => (
                <NewsCard
                  key={article.url || idx}
                  article={article}
                  isBookmarked={bookmarks.includes(article.url)}
                  onBookmark={handleBookmark}
                  isZh={isZh}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </PageLayout>
  );
};

export default SituationMonitorPage;
