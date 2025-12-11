/**
 * 数据源爬虫
 */

import { classifyNews, extractExchange, getCategoryType, NewsCategory } from './classifier';

export interface NewsItem {
  title: string;
  titleCn?: string;
  content?: string;
  url: string;
  source: string;
  category: NewsCategory;
  priority: number;
  exchange: string;
  type: string;
  matchedKeywords: string[];
  publishedAt?: number;
}

// 爬取 BlockBeats 快讯
export async function fetchBlockBeats(): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      'https://api.theblockbeats.news/v1/open-api/open-flash?size=50&page=1&type=push',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('BlockBeats API error:', response.status);
      return [];
    }

    const data = await response.json() as any;
    const articles = data?.data?.data || [];
    
    const items: NewsItem[] = [];
    
    for (const item of articles) {
      const title = item.title || '';
      const content = item.content || '';
      
      const result = classifyNews(title, content);
      
      if (result.shouldSave) {
        items.push({
          title,
          titleCn: title, // BlockBeats 本身是中文
          content: content.slice(0, 500),
          url: `https://www.theblockbeats.info/flash/${item.id}`,
          source: 'blockbeats',
          category: result.category,
          priority: result.priority,
          exchange: extractExchange(title + content),
          type: getCategoryType(result.category),
          matchedKeywords: result.matchedKeywords,
          publishedAt: item.add_time ? item.add_time * 1000 : Date.now(),
        });
      }
    }
    
    console.log(`BlockBeats: 爬取 ${articles.length} 条，匹配 ${items.length} 条`);
    return items;
  } catch (error) {
    console.error('BlockBeats fetch error:', error);
    return [];
  }
}

// 爬取 TechFlow 快讯
export async function fetchTechFlow(): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      'https://api.techflowpost.com/ashare/posts?page=1&per_page=50&post_type=news',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('TechFlow API error:', response.status);
      return [];
    }

    const data = await response.json() as any;
    const articles = data?.data || [];
    
    const items: NewsItem[] = [];
    
    for (const item of articles) {
      const title = item.title || '';
      const content = item.excerpt || '';
      
      const result = classifyNews(title, content);
      
      if (result.shouldSave) {
        items.push({
          title,
          titleCn: title,
          content: content.slice(0, 500),
          url: `https://www.techflowpost.com/article/detail_${item.id}.html`,
          source: 'techflow',
          category: result.category,
          priority: result.priority,
          exchange: extractExchange(title + content),
          type: getCategoryType(result.category),
          matchedKeywords: result.matchedKeywords,
          publishedAt: item.published_at ? new Date(item.published_at).getTime() : Date.now(),
        });
      }
    }
    
    console.log(`TechFlow: 爬取 ${articles.length} 条，匹配 ${items.length} 条`);
    return items;
  } catch (error) {
    console.error('TechFlow fetch error:', error);
    return [];
  }
}

// 爬取金色财经快讯
export async function fetchJinse(): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      'https://api.jinse.cn/noah/v2/lives?limit=50&reading=false&source=web&flag=down&id=0&category=0',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Jinse API error:', response.status);
      return [];
    }

    const data = await response.json() as any;
    const articles = data?.list || [];
    
    const items: NewsItem[] = [];
    
    for (const item of articles) {
      const liveData = item.lives || item;
      const title = liveData.content || '';
      
      const result = classifyNews(title, '');
      
      if (result.shouldSave) {
        items.push({
          title: title.slice(0, 200),
          titleCn: title.slice(0, 200),
          url: `https://www.jinse.cn/lives/${liveData.id}.html`,
          source: 'jinse',
          category: result.category,
          priority: result.priority,
          exchange: extractExchange(title),
          type: getCategoryType(result.category),
          matchedKeywords: result.matchedKeywords,
          publishedAt: liveData.created_at ? liveData.created_at * 1000 : Date.now(),
        });
      }
    }
    
    console.log(`Jinse: 爬取 ${articles.length} 条，匹配 ${items.length} 条`);
    return items;
  } catch (error) {
    console.error('Jinse fetch error:', error);
    return [];
  }
}

// 聚合爬取所有数据源
export async function crawlAllSources(): Promise<NewsItem[]> {
  console.log('开始爬取所有数据源...');
  
  // 并行爬取，带超时保护
  const results = await Promise.allSettled([
    fetchBlockBeats(),
    fetchTechFlow(),
    fetchJinse(),
  ]);
  
  const allItems: NewsItem[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }
  
  // 按 URL 去重
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(t => t.url === item.url)
  );
  
  // 按优先级排序
  uniqueItems.sort((a, b) => a.priority - b.priority);
  
  console.log(`总计爬取 ${allItems.length} 条，去重后 ${uniqueItems.length} 条`);
  
  return uniqueItems;
}
