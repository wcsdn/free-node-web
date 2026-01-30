/**
 * 环境配置管理
 * 统一管理所有环境变量
 */

export const env = {
  // 环境标识
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // WalletConnect 配置
  walletConnect: {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2d0b34f43158d2d790b6f53945e95391',
  },
  
  // API 端点配置
  api: {
    news: import.meta.env.VITE_NEWS_API || 'https://news.free-node.xyz',
    ghostMail: import.meta.env.VITE_GHOST_MAIL_API || 'https://mail.free-node.xyz',
  },
  
  // 钱包地址配置
  treasury: {
    address: (import.meta.env.VITE_TREASURY_ADDRESS || '0xb6a227d01b06be808aec2041694f85f43ba1b028') as `0x${string}`,
  },
  
  // 功能开关
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },
} as const;

// 环境变量类型定义
declare global {
  interface ImportMetaEnv {
    readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
    readonly VITE_NEWS_API?: string;
    readonly VITE_GHOST_MAIL_API?: string;
    readonly VITE_TREASURY_ADDRESS?: string;
    readonly VITE_ENABLE_ANALYTICS?: string;
    readonly VITE_ENABLE_DEBUG?: string;
    readonly VITE_TURNSTILE_SITE_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
