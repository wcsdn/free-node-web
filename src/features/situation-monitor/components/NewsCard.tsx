/**
 * 新闻卡片组件
 */
import React from 'react';
import './NewsCard.css';

interface Article {
  id?: string;
  title: string;
  titleCn?: string;
  description?: string;
  url: string;
  source?: string;
  category?: string;
  priority?: number;
  location_name?: string;
  created_at?: number;
}

interface NewsCardProps {
  article: Article;
  isBookmarked: boolean;
  onBookmark: (url: string) => void;
  isZh: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, isBookmarked, onBookmark, isZh }) => {
  const timeAgo = (timestamp?: number) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isZh ? '刚刚' : 'Just now';
    if (minutes < 60) return isZh ? `${minutes}分钟前` : `${minutes}m ago`;
    if (hours < 24) return isZh ? `${hours}小时前` : `${hours}h ago`;
    if (days > 365) return isZh ? '很久以前' : 'Long ago';
    return isZh ? `${days}天前` : `${days}d ago`;
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return '#00ff00';
    const colors: Record<string, string> = {
      us_policy: '#ff4444',
      geopolitics: '#4488ff',
      conflict: '#ff6666',
      defense: '#44ff88',
      economy: '#ffaa00',
      market: '#44ffaa',
      exchange_activity: '#ff4444',
      airdrop: '#aa44ff',
      exchange_news: '#4488ff',
      project_update: '#44ff88',
      market_hot: '#ffaa00',
    };
    return colors[category] || '#00ff00';
  };

  const title = isZh && article.titleCn ? article.titleCn : article.title;

  return (
    <article className="news-card">
      <div className="news-card-header">
        <div className="news-card-meta">
          {article.category && (
            <span
              className="news-card-category"
              style={{ borderColor: getCategoryColor(article.category) }}
            >
              {article.category.toUpperCase()}
            </span>
          )}
          {article.source && <span className="news-card-source">{article.source}</span>}
          {article.location_name && (
            <span className="news-card-location">📍 {article.location_name}</span>
          )}
          {article.created_at && <span className="news-card-time">{timeAgo(article.created_at)}</span>}
        </div>
        <button
          className={`news-card-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={() => onBookmark(article.url)}
          title={isZh ? '保存' : 'Bookmark'}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>

      <h3 className="news-card-title">
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h3>

      {article.description && (
        <p className="news-card-description">{article.description}</p>
      )}

      <div className="news-card-footer">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-card-link"
        >
          {isZh ? '查看详情 →' : 'Read More →'}
        </a>
      </div>
    </article>
  );
};

export default NewsCard;
