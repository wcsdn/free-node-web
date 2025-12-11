/**
 * News Server - Web3 新闻聚合服务
 * 
 * 功能：
 * - 爬取 BlockBeats、TechFlow、金色财经等数据源
 * - 智能分类：交易所活动、空投、市场热点等
 * - 推送到 ghost-core 存储
 * - 提供 HN 热榜 API
 */

import { crawlAllSources, NewsItem } from './crawlers';
import { CATEGORY_STYLES, NewsCategory } from './classifier';

interface Env {
  NEWS_CACHE: KVNamespace;
  GHOST_CORE_API?: string;
  ADMIN_KEY?: string;
}

interface CachedData {
  items: HNNewsItem[];
  timestamp: number;
  updateTime: string;
}

interface HNNewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

// ============================================
// 推送到 ghost-core
// ============================================

async function pushToGhostCore(items: NewsItem[], env: Env): Promise<number> {
  const apiBase = env.GHOST_CORE_API || 'https://core.free-node.xyz';
  const adminKey = env.ADMIN_KEY || '';
  
  if (!adminKey) {
    console.error('ADMIN_KEY not configured');
    return 0;
  }

  let pushed = 0;
  
  for (const item of items) {
    try {
      const response = await fetch(`${apiBase}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          exchange: item.exchange,
          title: item.title,
          title_cn: item.titleCn,
          url: item.url,
          type: item.type,
          category: item.category,
          priority: item.priority,
          source: item.source,
          matched_keywords: JSON.stringify(item.matchedKeywords),
        }),
      });

      if (response.ok) {
        pushed++;
        console.log(`✓ ${item.title.slice(0, 50)}...`);
      } else {
        const text = await response.text();
        // URL 重复不算错误
        if (!text.includes('duplicate') && !text.includes('UNIQUE')) {
          console.error(`✗ ${item.title.slice(0, 30)}: ${text}`);
        }
      }
    } catch (error) {
      console.error(`Error pushing: ${item.title.slice(0, 30)}`, error);
    }
  }

  return pushed;
}

// ============================================
// 定时任务
// ============================================

async function crawlAndPush(env: Env): Promise<{ total: number; pushed: number }> {
  const items = await crawlAllSources();
  const pushed = await pushToGhostCore(items, env);
  
  return { total: items.length, pushed };
}

// ============================================
// HN 热榜相关（保留原有功能）
// ============================================

async function fetchHackerNews(): Promise<HNNewsItem[]> {
  try {
    const response = await fetch('https://news.ycombinator.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InfoHunterBot/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return await parseHackerNews(html);
  } catch (error) {
    console.error('Fetch error:', error);
    return getMockData();
  }
}

async function parseHackerNews(html: string): Promise<HNNewsItem[]> {
  const items: HNNewsItem[] = [];
  const titleRegex = /<span class="titleline"><a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  
  let match;
  let rank = 0;
  
  while ((match = titleRegex.exec(html)) && rank < 30) {
    rank++;
    let url = match[1];
    const title = match[2].trim();
    
    if (url.startsWith('item?')) {
      url = `https://news.ycombinator.com/${url}`;
    }
    
    const titleCn = await translateWithGoogle(title);
    items.push({ rank, title, titleCn, url });
  }
  
  return items.length > 0 ? items : getMockData();
}

async function translateWithGoogle(text: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    
    if (response.ok) {
      const data = await response.json() as any;
      if (data?.[0]?.[0]?.[0]) {
        return data[0][0][0];
      }
    }
  } catch (error) {
    console.error('翻译失败:', error);
  }
  return translateLocal(text);
}

function translateLocal(title: string): string {
  if (title.toLowerCase().startsWith('show hn:')) return '展示项目：' + title.substring(8).trim();
  if (title.toLowerCase().startsWith('ask hn:')) return '求助提问：' + title.substring(7).trim();
  if (title.toLowerCase().startsWith('tell hn:')) return '经验分享：' + title.substring(8).trim();
  
  const lower = title.toLowerCase();
  if (lower.includes('ai') || lower.includes('ml')) return '🤖 ' + title;
  if (lower.includes('security') || lower.includes('hack')) return '🔒 ' + title;
  if (title.includes('?')) return '❓ ' + title;
  
  return '📰 ' + title;
}

function getMockData(): HNNewsItem[] {
  return [
    { rank: 1, title: 'Show HN: My awesome project', titleCn: '展示项目：我的超棒项目', url: 'https://example.com/1' },
    { rank: 2, title: 'Ask HN: How to learn programming?', titleCn: '求助提问：如何学习编程？', url: 'https://example.com/2' },
  ];
}

// ============================================
// Worker 入口
// ============================================

export default {
  // 定时任务
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered:', event.cron);
    
    try {
      const result = await crawlAndPush(env);
      console.log(`爬取完成: ${result.total} 条，推送 ${result.pushed} 条`);
    } catch (error) {
      console.error('Cron error:', error);
    }
  },

  // HTTP 请求
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 手动触发爬虫
      if (url.pathname === '/api/crawl' || url.pathname === '/api/crawl-activities') {
        const result = await crawlAndPush(env);
        return Response.json({
          success: true,
          message: '爬取完成',
          data: result,
        }, { headers: corsHeaders });
      }
      
      // 获取分类样式配置
      if (url.pathname === '/api/categories') {
        return Response.json({
          success: true,
          data: CATEGORY_STYLES,
        }, { headers: corsHeaders });
      }

      // HN 热榜 API
      if (url.pathname === '/api/news') {
        const cached = await env.NEWS_CACHE.get('latest_news', 'json') as CachedData | null;
        
        if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
          return Response.json(cached, { headers: corsHeaders });
        }
        
        const items = await fetchHackerNews();
        const cachedData: CachedData = {
          items,
          timestamp: Date.now(),
          updateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        };
        
        env.NEWS_CACHE.put('latest_news', JSON.stringify(cachedData));
        return Response.json(cachedData, { headers: corsHeaders });
      }
      
      // 强制刷新 HN
      if (url.pathname === '/api/refresh') {
        const items = await fetchHackerNews();
        const cachedData: CachedData = {
          items,
          timestamp: Date.now(),
          updateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        };
        
        await env.NEWS_CACHE.put('latest_news', JSON.stringify(cachedData));
        return Response.json({ success: true, data: cachedData }, { headers: corsHeaders });
      }

      // 主页
      if (url.pathname === '/') {
        return new Response(renderHomePage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return Response.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
  },
};

function renderHomePage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Node News Server</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #00ff00; }
    a { color: #0066cc; }
    .api { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0; }
    code { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🚀 Free Node News Server</h1>
  <p>Web3 新闻聚合服务</p>
  
  <h2>API 接口</h2>
  <div class="api">
    <p><strong>GET</strong> <code>/api/news</code> - HN 热榜</p>
    <p><strong>GET</strong> <code>/api/crawl</code> - 手动触发爬虫</p>
    <p><strong>GET</strong> <code>/api/categories</code> - 分类配置</p>
    <p><strong>GET</strong> <code>/api/refresh</code> - 强制刷新 HN</p>
  </div>
  
  <h2>数据源</h2>
  <ul>
    <li>BlockBeats 律动</li>
    <li>TechFlow 深潮</li>
    <li>金色财经</li>
  </ul>
  
  <p>定时任务：每小时整点自动爬取</p>
</body>
</html>`;
}
