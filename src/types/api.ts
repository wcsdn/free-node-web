/**
 * API 相关类型定义
 */

/**
 * 新闻条目
 */
export interface NewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

/**
 * 新闻数据响应
 */
export interface NewsData {
  items: NewsItem[];
  timestamp: number;
  updateTime: string;
}

// UserStatus 从 ghost-mail.ts 导出，这里不再重复定义

/**
 * 留言板条目
 */
export interface GuestbookEntry {
  id: string;
  address: string;
  message: string;
  signature: string;
  timestamp: number;
  avatar: string;
  replyTo?: string;
}

/**
 * API 请求选项
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}
