/**
 * 新闻功能类型定义
 */

export interface NewsItem {
  rank: number;
  title: string;
  titleCn?: string;
  url: string;
}

export interface NewsData {
  items: NewsItem[];
  timestamp: number;
  updateTime: string;
}

export interface NewsState {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  displayedLines: string[];
  newsUrls: { [key: number]: string };
  loadingMore: boolean;
  noMoreData: boolean;
  currentOffset: number;
  displayNumber: number;
}
