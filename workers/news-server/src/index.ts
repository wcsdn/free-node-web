interface NewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

interface Env {
  NEWS_CACHE: KVNamespace;
  GHOST_CORE_API?: string;
  ADMIN_KEY?: string;
}

interface CachedData {
  items: NewsItem[];
  timestamp: number;
  updateTime: string;
}

// ============================================
// 交易所活动爬虫
// ============================================

interface ActivityItem {
  exchange: string;
  title: string;
  titleCn?: string;
  url: string;
  type: 'airdrop' | 'bonus' | 'competition' | 'other';
}

// 交易所关键词
const EXCHANGE_KEYWORDS = ['binance', 'okx', 'bybit', 'bitget', 'gate', '币安', '欧易'];
const ACTIVITY_KEYWORDS = ['空投', 'airdrop', '活动', '奖励', 'bonus', '大赛', 'competition', '福利', '注册'];

// 爬取 BlockBeats 快讯
async function fetchBlockBeats(): Promise<ActivityItem[]> {
  try {
    const response = await fetch('https://api.theblockbeats.news/v1/open-api/open-flash?size=50&page=1&type=push', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('BlockBeats API error:', response.status);
      return [];
    }

    const data = await response.json() as any;
    const articles = data?.data?.data || [];
    
    return articles
      .filter((item: any) => {
        const content = (item.title + ' ' + item.content).toLowerCase();
        const hasExchange = EXCHANGE_KEYWORDS.some(k => content.includes(k.toLowerCase()));
        const hasActivity = ACTIVITY_KEYWORDS.some(k => content.includes(k.toLowerCase()));
        return hasExchange && hasActivity;
      })
      .map((item: any) => {
        const content = (item.title + ' ' + item.content).toLowerCase();
        let exchange = 'other';
        if (content.includes('binance') || content.includes('币安')) exchange = 'binance';
        else if (content.includes('okx') || content.includes('欧易')) exchange = 'okx';
        else if (content.includes('bybit')) exchange = 'bybit';
        else if (content.includes('bitget')) exchange = 'bitget';
        else if (content.includes('gate')) exchange = 'gate';

        let type: ActivityItem['type'] = 'other';
        if (content.includes('空投') || content.includes('airdrop')) type = 'airdrop';
        else if (content.includes('奖励') || content.includes('bonus')) type = 'bonus';
        else if (content.includes('大赛') || content.includes('competition')) type = 'competition';

        return {
          exchange,
          title: item.title,
          titleCn: item.title, // BlockBeats 本身是中文
          url: `https://www.theblockbeats.info/flash/${item.id}`,
          type,
        };
      })
      .slice(0, 10); // 最多取 10 条
  } catch (error) {
    console.error('BlockBeats fetch error:', error);
    return [];
  }
}

// 爬取 TechFlow 快讯
async function fetchTechFlow(): Promise<ActivityItem[]> {
  try {
    const response = await fetch('https://api.techflowpost.com/ashare/posts?page=1&per_page=30&post_type=news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('TechFlow API error:', response.status);
      return [];
    }

    const data = await response.json() as any;
    const articles = data?.data || [];
    
    return articles
      .filter((item: any) => {
        const content = (item.title + ' ' + (item.excerpt || '')).toLowerCase();
        const hasExchange = EXCHANGE_KEYWORDS.some(k => content.includes(k.toLowerCase()));
        const hasActivity = ACTIVITY_KEYWORDS.some(k => content.includes(k.toLowerCase()));
        return hasExchange && hasActivity;
      })
      .map((item: any) => {
        const content = (item.title + ' ' + (item.excerpt || '')).toLowerCase();
        let exchange = 'other';
        if (content.includes('binance') || content.includes('币安')) exchange = 'binance';
        else if (content.includes('okx') || content.includes('欧易')) exchange = 'okx';
        else if (content.includes('bybit')) exchange = 'bybit';
        else if (content.includes('bitget')) exchange = 'bitget';
        else if (content.includes('gate')) exchange = 'gate';

        let type: ActivityItem['type'] = 'other';
        if (content.includes('空投') || content.includes('airdrop')) type = 'airdrop';
        else if (content.includes('奖励') || content.includes('bonus')) type = 'bonus';
        else if (content.includes('大赛') || content.includes('competition')) type = 'competition';

        return {
          exchange,
          title: item.title,
          titleCn: item.title,
          url: `https://www.techflowpost.com/article/detail_${item.id}.html`,
          type,
        };
      })
      .slice(0, 10);
  } catch (error) {
    console.error('TechFlow fetch error:', error);
    return [];
  }
}

// 推送活动到 ghost-core
async function pushActivitiesToCore(activities: ActivityItem[], env: Env): Promise<number> {
  const apiBase = env.GHOST_CORE_API || 'https://core.free-node.xyz';
  const adminKey = env.ADMIN_KEY || '';
  
  if (!adminKey) {
    console.error('ADMIN_KEY not configured');
    return 0;
  }

  let pushed = 0;
  for (const activity of activities) {
    try {
      const response = await fetch(`${apiBase}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          exchange: activity.exchange,
          title: activity.title,
          title_cn: activity.titleCn,
          url: activity.url,
          type: activity.type,
        }),
      });

      if (response.ok) {
        pushed++;
        console.log(`Pushed activity: ${activity.title}`);
      } else {
        console.error(`Failed to push: ${activity.title}`, await response.text());
      }
    } catch (error) {
      console.error(`Error pushing activity: ${activity.title}`, error);
    }
  }

  return pushed;
}

// 定时任务：爬取并推送活动
async function crawlAndPushActivities(env: Env): Promise<{ blockbeats: number; techflow: number; pushed: number }> {
  console.log('Starting activity crawl...');
  
  // 并行爬取
  const [blockbeatsItems, techflowItems] = await Promise.all([
    fetchBlockBeats(),
    fetchTechFlow(),
  ]);

  console.log(`BlockBeats: ${blockbeatsItems.length}, TechFlow: ${techflowItems.length}`);

  // 合并去重（按 URL）
  const allItems = [...blockbeatsItems, ...techflowItems];
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(t => t.url === item.url)
  );

  // 推送到 ghost-core
  const pushed = await pushActivitiesToCore(uniqueItems, env);

  return {
    blockbeats: blockbeatsItems.length,
    techflow: techflowItems.length,
    pushed,
  };
}

export default {
  // 定时任务入口
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered:', event.cron);
    const result = await crawlAndPushActivities(env);
    console.log('Crawl result:', result);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 测试数据
      if (url.pathname === '/test') {
        const items = getMockData();
        return Response.json(items, { headers: corsHeaders });
      }
      
      // 从 KV 读取缓存数据
      if (url.pathname === '/api/cache') {
        const cached = await env.NEWS_CACHE.get('latest_news', 'json') as CachedData | null;
        if (cached) {
          return Response.json(cached, { headers: corsHeaders });
        }
        return Response.json({ error: 'No cached data' }, { status: 404, headers: corsHeaders });
      }
      
      // 手动触发活动爬虫
      if (url.pathname === '/api/crawl-activities') {
        const result = await crawlAndPushActivities(env);
        return Response.json({
          success: true,
          message: '活动爬取完成',
          data: result
        }, { headers: corsHeaders });
      }

      // 强制刷新并存入 KV
      if (url.pathname === '/api/refresh') {
        const items = await fetchHackerNews();
        const cachedData: CachedData = {
          items,
          timestamp: Date.now(),
          updateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        };
        
        // 存入 KV，永久保存
        await env.NEWS_CACHE.put('latest_news', JSON.stringify(cachedData));
        
        return Response.json({
          success: true,
          message: '数据已更新到 KV',
          data: cachedData
        }, { headers: corsHeaders });
      }
      
      // API 接口：优先从 KV 读取，如果没有或过期则抓取
      if (url.pathname === '/api/news') {
        // 先尝试从 KV 读取
        const cached = await env.NEWS_CACHE.get('latest_news', 'json') as CachedData | null;
        
        // 如果有缓存且未过期（30分钟内），直接返回
        if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
          return Response.json(cached, { headers: corsHeaders });
        }
        
        // 否则重新抓取并更新 KV
        const items = await fetchHackerNews();
        const cachedData: CachedData = {
          items,
          timestamp: Date.now(),
          updateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        };
        
        // 异步更新 KV，不阻塞响应
        env.NEWS_CACHE.put('latest_news', JSON.stringify(cachedData));
        
        return Response.json(cachedData, { headers: corsHeaders });
      }
      
      // 主页：优先从 KV 读取
      if (url.pathname === '/') {
        let items: NewsItem[];
        let updateTime = '';
        
        // 先尝试从 KV 读取
        const cached = await env.NEWS_CACHE.get('latest_news', 'json') as CachedData | null;
        
        if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
          // 使用缓存数据
          items = cached.items;
          updateTime = cached.updateTime;
        } else {
          // 重新抓取
          items = await fetchHackerNews();
          updateTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
          
          // 异步更新 KV
          const cachedData: CachedData = {
            items,
            timestamp: Date.now(),
            updateTime
          };
          env.NEWS_CACHE.put('latest_news', JSON.stringify(cachedData));
        }
        
        const html = renderHTML(items, updateTime);
        return new Response(html, {
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders 
          }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return Response.json(
        { error: 'Failed to fetch news' }, 
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

async function fetchHackerNews(): Promise<NewsItem[]> {
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

async function parseHackerNews(html: string): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
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
    
    // 使用 Google Translate API 翻译
    const titleCn = await translateWithGoogle(title);
    items.push({ rank, title, titleCn, url });
  }
  
  return items.length > 0 ? items : getMockData();
}

async function translateWithGoogle(text: string): Promise<string> {
  try {
    // 使用 Google Translate 的免费 API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = data[0][0][0];
        console.log(`翻译成功: "${text}" -> "${translated}"`);
        return translated;
      }
    }
  } catch (error) {
    console.error('Google翻译失败:', error);
  }
  
  // 降级到本地翻译
  return translateLocal(text);
}

function translateLocal(title: string): string {
  // HN 特殊格式
  if (title.toLowerCase().startsWith('show hn:')) {
    return '展示项目：' + title.substring(8).trim();
  }
  if (title.toLowerCase().startsWith('ask hn:')) {
    return '求助提问：' + title.substring(7).trim();
  }
  if (title.toLowerCase().startsWith('tell hn:')) {
    return '经验分享：' + title.substring(8).trim();
  }
  if (title.toLowerCase().startsWith('launch hn:')) {
    return '产品发布：' + title.substring(10).trim();
  }
  
  // 类型标识
  const lower = title.toLowerCase();
  if (lower.includes('ai') || lower.includes('ml')) return '🤖 ' + title;
  if (lower.includes('security') || lower.includes('hack')) return '🔒 ' + title;
  if (title.includes('?')) return '❓ ' + title;
  if (lower.includes('new ') || lower.includes('release')) return '🆕 ' + title;
  if (lower.includes('startup') || lower.includes('funding')) return '💰 ' + title;
  
  return '📰 ' + title;
}

function getMockData(): NewsItem[] {
  return [
    { rank: 1, title: 'Show HN: My awesome project', titleCn: '展示项目：我的超棒项目', url: 'https://example.com/1' },
    { rank: 2, title: 'Ask HN: How to learn programming?', titleCn: '求助提问：如何学习编程？', url: 'https://example.com/2' },
    { rank: 3, title: 'New JavaScript framework', titleCn: '新的 JavaScript 框架', url: 'https://example.com/3' },
    { rank: 4, title: 'AI breakthrough', titleCn: 'AI 突破', url: 'https://example.com/4' },
    { rank: 5, title: 'Security issue found', titleCn: '发现安全问题', url: 'https://example.com/5' },
  ];
}

function renderHTML(items: NewsItem[], updateTime: string = ''): string {
  const rows = items.map(item => 
    `<tr>
      <td class="rank">${item.rank}</td>
      <td class="title">
        <a href="${item.url}" target="_blank">${item.title}</a>
        ${item.titleCn ? `<div class="title-cn">${item.titleCn}</div>` : ''}
      </td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hacker News 热榜前30</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; 
      max-width: 1000px; 
      margin: 0 auto; 
      padding: 20px; 
      background: #f6f6ef;
      line-height: 1.6;
    }
    h1 { 
      color: #ff6600; 
      text-align: center;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    th, td { 
      padding: 15px; 
      text-align: left; 
      border-bottom: 1px solid #eee; 
    }
    th { 
      background: #ff6600; 
      color: white;
      font-weight: 600;
    }
    .rank {
      width: 50px;
      text-align: center;
      font-weight: bold;
      color: #666;
      font-size: 16px;
    }
    .title a { 
      color: #000; 
      text-decoration: none; 
      font-weight: 500;
      display: block;
      margin-bottom: 5px;
      font-size: 15px;
    }
    .title a:hover { 
      color: #ff6600;
      text-decoration: underline;
    }
    .title-cn {
      color: #666;
      font-size: 14px;
      font-style: italic;
      margin-top: 5px;
    }
    .footer { 
      margin-top: 30px; 
      text-align: center;
      color: #666; 
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .footer p {
      margin: 8px 0;
    }
    .footer a {
      color: #ff6600;
      text-decoration: none;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    tr:hover {
      background: #f9f9f9;
    }
    tr:last-child td {
      border-bottom: none;
    }
    @media (max-width: 768px) {
      body { padding: 10px; }
      h1 { font-size: 24px; }
      th, td { padding: 10px; }
      .title a { font-size: 14px; }
      .title-cn { font-size: 13px; }
    }
  </style>
</head>
<body>
  <h1>🔥 Hacker News 热榜前30</h1>
  <div class="subtitle">实时更新 · 中英双语</div>
  
  <table>
    <thead>
      <tr><th>#</th><th>标题</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  
  <div class="footer">
    <p>📊 数据来源：<a href="https://news.ycombinator.com" target="_blank">Hacker News</a></p>
    <p>🌐 访问地址：<a href="https://news.free-node.xyz">news.free-node.xyz</a></p>
    <p>🔗 API 接口：<a href="/api/news">/api/news</a> | <a href="/api/cache">缓存数据</a> | <a href="/api/refresh">强制刷新</a></p>
    ${updateTime ? `<p>⏰ 更新时间：${updateTime}</p>` : '<p>⏰ 数据缓存30分钟</p>'}
  </div>
</body>
</html>`;
}