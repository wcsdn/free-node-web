import React, { useState, useEffect, useRef } from 'react';

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
  const [currentLine, setCurrentLine] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  // 获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://news.free-node.xyz/api/news');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data: NewsData = await response.json();
        
        // 只取前10条
        const top10 = data.items.slice(0, 10);
        setNews(top10);
        setLoading(false);
      } catch (err) {
        console.error('获取新闻失败:', err);
        setError(err instanceof Error ? err.message : '获取新闻失败');
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 终端打字机效果
  useEffect(() => {
    if (loading || error || news.length === 0) return;

    const lines: string[] = [
      '> 正在连接 Hacker News 数据流...',
      '> 连接成功！',
      '> ================================',
      '> 🔥 HACKER NEWS 热榜 TOP 10',
      '> ================================',
      '',
    ];

    news.forEach((item) => {
      lines.push(`[${item.rank}] ${item.title}`);
      if (item.titleCn) {
        lines.push(`    译: ${item.titleCn}`);
      }
      lines.push(`    链接: ${item.url}`);
      lines.push('');
    });

    lines.push('> ================================');
    lines.push('> 数据加载完成');
    lines.push('> 按 Ctrl+C 退出...');

    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < lines.length) {
        setDisplayedLines((prev) => [...prev, lines[lineIndex]]);
        setCurrentLine(lineIndex);
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
        
        {!loading && !error && displayedLines.map((line, index) => (
          <div key={index} className="terminal-line">
            {line}
            {index === displayedLines.length - 1 && (
              <span className="cursor-blink">▋</span>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .news-terminal-container {
          width: 100%;
          max-width: 900px;
          margin: 20px auto;
          background: #0a0a0a;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 255, 0, 0.2);
          overflow: hidden;
          font-family: 'Courier New', 'Monaco', monospace;
        }

        .terminal-header {
          background: #1a1a1a;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #00ff00;
        }

        .terminal-buttons {
          display: flex;
          gap: 8px;
          margin-right: 15px;
        }

        .terminal-buttons span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .btn-close {
          background: #ff5f56;
        }

        .btn-minimize {
          background: #ffbd2e;
        }

        .btn-maximize {
          background: #27c93f;
        }

        .terminal-title {
          color: #00ff00;
          font-size: 14px;
          font-weight: bold;
        }

        .terminal-body {
          background: #000;
          color: #00ff00;
          padding: 20px;
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
        }

        .terminal-body::-webkit-scrollbar {
          width: 8px;
        }

        .terminal-body::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .terminal-body::-webkit-scrollbar-thumb {
          background: #00ff00;
          border-radius: 4px;
        }

        .terminal-line {
          margin-bottom: 4px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .terminal-loading,
        .terminal-error {
          color: #00ff00;
        }

        .terminal-error {
          color: #ff5555;
        }

        .cursor-blink {
          animation: blink 1s infinite;
          color: #00ff00;
          font-weight: bold;
        }

        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .news-terminal-container {
            margin: 10px;
            border-radius: 4px;
          }

          .terminal-body {
            padding: 15px;
            font-size: 12px;
            min-height: 300px;
          }

          .terminal-title {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default NewsTerminal;
