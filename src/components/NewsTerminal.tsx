import React, { useState, useEffect, useRef } from 'react';
import './NewsTerminal.css';

interface NewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

interface NewsData {
  items: NewsItem[];
  timestamp: number;
  updateTime: string;
}

const NewsTerminal: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [newsUrls, setNewsUrls] = useState<{ [key: number]: string }>({});
  const terminalRef = useRef<HTMLDivElement>(null);

  // 备用模拟数据（使用 useMemo 避免重复创建）
  const mockNews: NewsItem[] = React.useMemo(() => [
    { rank: 1, title: '去中心化节点网络架构设计与实现', url: 'https://free-node.xyz' },
    { rank: 2, title: 'Web3 基础设施的未来发展趋势', url: 'https://free-node.xyz' },
    { rank: 3, title: 'React 中实现 Matrix 风格终端界面', url: 'https://free-node.xyz' },
    { rank: 4, title: 'TypeScript 2025 年最佳实践指南', url: 'https://free-node.xyz' },
    { rank: 5, title: 'Cloudflare Pages 自动化部署完整教程', url: 'https://free-node.xyz' },
    { rank: 6, title: 'Canvas API 性能优化技巧与实战', url: 'https://free-node.xyz' },
    { rank: 7, title: '使用 React Hooks 构建实时应用', url: 'https://free-node.xyz' },
    { rank: 8, title: 'CSS 动画和过渡效果深度解析', url: 'https://free-node.xyz' },
    { rank: 9, title: '现代 JavaScript 开发工作流最佳实践', url: 'https://free-node.xyz' },
    { rank: 10, title: '团队协作中的 Git 使用技巧', url: 'https://free-node.xyz' },
  ], []);

  // 获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://news.free-node.xyz/api/news', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data: NewsData = await response.json();
        
        // 只取前10条
        const top10 = data.items.slice(0, 10);
        setNews(top10);
        setLoading(false);
      } catch (err) {
        console.error('获取新闻失败，使用备用数据:', err);
        // 使用备用数据
        setNews(mockNews);
        setError(null); // 不显示错误，直接使用备用数据
        setLoading(false);
      }
    };

    fetchNews();
  }, [mockNews]);

  // 终端打字机效果
  useEffect(() => {
    if (loading || error || news.length === 0) return;

    const lines: string[] = [
      '> 正在连接 Hacker News 数据流...',
      '> 连接成功',
      '',
      '🔥 HACKER NEWS 热榜 TOP 10',
      '> 点击新闻标题可跳转查看详情',
      '',
    ];

    const urls: { [key: number]: string } = {};
    
    news.forEach((item) => {
      const title = item.titleCn || item.title;
      // 根据排名添加不同的热度表情（只显示前5名）
      let prefix = '';
      if (item.rank === 1) prefix = '🔥 ';
      else if (item.rank === 2) prefix = '⚡ ';
      else if (item.rank === 3) prefix = '💎 ';
      else if (item.rank === 4) prefix = '⭐ ';
      else if (item.rank === 5) prefix = '✨ ';
      
      const lineIndex = lines.length;
      lines.push(`${prefix}${item.rank}. ${title}`);
      urls[lineIndex] = item.url;
    });

    lines.push('');
    lines.push('> 数据加载完成');
    
    setNewsUrls(urls);

    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < lines.length) {
        setDisplayedLines((prev) => [...prev, lines[lineIndex]]);
        lineIndex++;
        
        // 自动滚动到底部
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 100); // 每100ms显示一行

    return () => clearInterval(interval);
  }, [news, loading, error]);

  return (
    <div className="news-terminal-container">
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="btn-close"></span>
          <span className="btn-minimize"></span>
          <span className="btn-maximize"></span>
        </div>
        <div className="terminal-title">root@hackernews:~$</div>
      </div>
      
      <div className="terminal-body" ref={terminalRef}>
        {loading && (
          <div className="terminal-loading">
            <span className="cursor-blink">▋</span> 正在加载数据...
          </div>
        )}
        
        {error && (
          <div className="terminal-error">
            <div>&gt; ERROR: {error}</div>
            <div>&gt; 请检查网络连接或稍后重试</div>
            <div>&gt; 按 F5 刷新页面</div>
          </div>
        )}
        
        {!loading && !error && displayedLines.map((line, index) => {
          const isClickable = newsUrls[index];
          return (
            <div 
              key={index} 
              className={`terminal-line ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && window.open(newsUrls[index], '_blank')}
            >
              {line}
              {index === displayedLines.length - 1 && (
                <span className="cursor-blink">▋</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewsTerminal;
