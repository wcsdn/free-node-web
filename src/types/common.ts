/**
 * 通用类型定义
 */

/**
 * 标准 API 响应格式
 */
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * 异步操作状态
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * 分页参数
 */
export interface PaginationParams {
  offset: number;
  limit: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
