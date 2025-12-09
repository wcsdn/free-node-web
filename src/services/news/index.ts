/**
 * News API 服务
 */

import { APIClient } from '../api/client';
import { API_ENDPOINTS } from '@/config/constants';
import type { NewsData } from '@/types';

const newsAPI = new APIClient(API_ENDPOINTS.NEWS);

export const newsService = {
  /**
   * 获取新闻列表
   */
  async getNews(offset = 0, limit = 10): Promise<NewsData> {
    return newsAPI.get<NewsData>(`/api/news?offset=${offset}&limit=${limit}`);
  },
};
