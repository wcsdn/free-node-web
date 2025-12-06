/**
 * 全局常量配置
 * 统一管理收款地址等配置
 */

// 收款地址（你的钱包地址）
export const TREASURY_ADDRESS = '0xb6a227d01b06be808aec2041694f85f43ba1b028' as const;

// 管理员地址（用于留言板等管理功能）
export const ADMIN_ADDRESS = TREASURY_ADDRESS;

// 支付金额
export const PAYMENT_AMOUNTS = {
  DONATION: '0.001',      // 捐赠金额
  GHOST_MAIL_VIP: '0.001', // Ghost Mail VIP 升级
} as const;

// API 端点
export const API_ENDPOINTS = {
  NEWS: 'https://news.free-node.xyz',
  GHOST_MAIL: 'https://ghost-mail-api.unlocks.workers.dev',
} as const;

// 域名配置
export const DOMAINS = {
  MAIN: 'free-node.xyz',
  NEWS: 'news.free-node.xyz',
  GHOST_MAIL: 'ghost-mail-api.free-node.xyz',
} as const;
