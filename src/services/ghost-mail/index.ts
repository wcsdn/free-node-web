/**
 * Ghost Mail API 服务
 */

import { APIClient } from '../api/client';
import { API_ENDPOINTS } from '@/config/constants';
import type { UserStatus } from '@/types';

const ghostMailAPI = new APIClient(API_ENDPOINTS.GHOST_MAIL);

export const ghostMailService = {
  /**
   * 获取用户状态
   */
  async getStatus(address: string): Promise<{ success: boolean; data: UserStatus }> {
    return ghostMailAPI.get(`/api/status?address=${address}`);
  },
};
