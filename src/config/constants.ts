/**
 * 全局常量配置
 * 统一管理收款地址等配置
 */

import { env } from './env';

// 收款地址（从环境变量读取）
export const TREASURY_ADDRESS = env.treasury.address;

// 管理员地址（用于留言板等管理功能）
export const ADMIN_ADDRESS = TREASURY_ADDRESS;

// 支付金额
export const PAYMENT_AMOUNTS = {
  DONATION: '0.001',      // 捐赠金额
  GHOST_MAIL_VIP: '0.001', // Ghost Mail VIP 升级
} as const;

// API 端点（从环境变量读取）
export const API_ENDPOINTS = {
  NEWS: env.api.news,
  GHOST_MAIL: env.api.ghostMail,
} as const;

// 域名配置
export const DOMAINS = {
  MAIN: 'free-node.xyz',
  NEWS: 'news.free-node.xyz',
  GHOST_MAIL: 'ghost-mail-api.free-node.xyz',
} as const;
