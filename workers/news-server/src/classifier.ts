/**
 * 新闻分类器
 */

import { EXCHANGE_KEYWORDS, ACTIVITY_KEYWORDS, HOT_KEYWORDS, CHAIN_KEYWORDS } from './keywords';

// 新闻分类
export enum NewsCategory {
  EXCHANGE_ACTIVITY = 'exchange_activity',  // 交易所活动（最高优先）
  AIRDROP = 'airdrop',                       // 空投信息
  EXCHANGE_NEWS = 'exchange_news',           // 交易所新闻
  PROJECT_UPDATE = 'project_update',         // 项目动态
  MARKET_HOT = 'market_hot',                 // 市场热点
  GENERAL = 'general',                       // 一般新闻
}

// 分类结果
export interface ClassifyResult {
  shouldSave: boolean;
  category: NewsCategory;
  priority: number;        // 1-5，1最高
  matchedKeywords: string[];
}

// 分类样式配置
export const CATEGORY_STYLES = {
  exchange_activity: { label: '交易所活动', color: 'red', icon: '🔥' },
  airdrop: { label: '空投', color: 'purple', icon: '🪂' },
  exchange_news: { label: '交易所', color: 'blue', icon: '🏦' },
  project_update: { label: '项目动态', color: 'green', icon: '🚀' },
  market_hot: { label: '市场热点', color: 'orange', icon: '📈' },
  general: { label: '资讯', color: 'gray', icon: '📰' },
};

// 检测关键词匹配
function matchKeywords(text: string, keywords: string[]): string[] {
  const matched: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  }
  
  return matched;
}

// 分类函数
export function classifyNews(title: string, content: string = ''): ClassifyResult {
  const text = `${title} ${content}`.toLowerCase();
  
  // 检测各类关键词
  const exchangeMatches = matchKeywords(text, EXCHANGE_KEYWORDS);
  const activityMatches = matchKeywords(text, ACTIVITY_KEYWORDS);
  const hotMatches = matchKeywords(text, HOT_KEYWORDS);
  const chainMatches = matchKeywords(text, CHAIN_KEYWORDS);
  
  const hasExchange = exchangeMatches.length > 0;
  const hasActivity = activityMatches.length > 0;
  const hasHot = hotMatches.length > 0;
  const hasChain = chainMatches.length > 0;
  
  const allMatched = [...exchangeMatches, ...activityMatches, ...hotMatches, ...chainMatches];
  
  // 空投专项检测
  const airdropKeywords = ['空投', 'airdrop', 'claim', '白名单', 'whitelist', '领取'];
  const isAirdrop = airdropKeywords.some(k => text.includes(k));
  
  // 分类判断（按优先级）
  
  // 优先级1：交易所 + 活动
  if (hasExchange && hasActivity) {
    return {
      shouldSave: true,
      category: NewsCategory.EXCHANGE_ACTIVITY,
      priority: 1,
      matchedKeywords: allMatched,
    };
  }
  
  // 优先级2：空投相关
  if (isAirdrop) {
    return {
      shouldSave: true,
      category: NewsCategory.AIRDROP,
      priority: 2,
      matchedKeywords: allMatched,
    };
  }
  
  // 优先级3：交易所新闻
  if (hasExchange) {
    return {
      shouldSave: true,
      category: NewsCategory.EXCHANGE_NEWS,
      priority: 3,
      matchedKeywords: allMatched,
    };
  }
  
  // 优先级4：项目动态（链 + 活动词）
  if (hasChain && hasActivity) {
    return {
      shouldSave: true,
      category: NewsCategory.PROJECT_UPDATE,
      priority: 4,
      matchedKeywords: allMatched,
    };
  }
  
  // 优先级5：市场热点
  if (hasHot) {
    return {
      shouldSave: true,
      category: NewsCategory.MARKET_HOT,
      priority: 5,
      matchedKeywords: allMatched,
    };
  }
  
  // 不保存
  return {
    shouldSave: false,
    category: NewsCategory.GENERAL,
    priority: 99,
    matchedKeywords: allMatched,
  };
}

// 根据分类获取活动类型
export function getCategoryType(category: NewsCategory): string {
  switch (category) {
    case NewsCategory.EXCHANGE_ACTIVITY:
    case NewsCategory.AIRDROP:
      return 'airdrop';
    case NewsCategory.EXCHANGE_NEWS:
      return 'bonus';
    case NewsCategory.PROJECT_UPDATE:
      return 'competition';
    default:
      return 'other';
  }
}

// 从文本中提取交易所名称
export function extractExchange(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('binance') || lowerText.includes('币安')) return 'binance';
  if (lowerText.includes('okx') || lowerText.includes('欧易')) return 'okx';
  if (lowerText.includes('bybit')) return 'bybit';
  if (lowerText.includes('bitget')) return 'bitget';
  if (lowerText.includes('gate')) return 'gate';
  if (lowerText.includes('mexc')) return 'mexc';
  if (lowerText.includes('kucoin') || lowerText.includes('库币')) return 'kucoin';
  if (lowerText.includes('htx') || lowerText.includes('huobi') || lowerText.includes('火币')) return 'htx';
  if (lowerText.includes('coinbase')) return 'coinbase';
  
  return 'other';
}
