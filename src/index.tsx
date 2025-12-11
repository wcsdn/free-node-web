/**
 * 应用入口
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, type Locale } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './features/web3/config';
import { ToastProvider } from '@/shared/components/Toast/ToastContext';
import { AppRouter } from './router';
import { useLanguage } from '@/shared/hooks/useLanguage';

// 配置 QueryClient 以支持持久化缓存
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 小时缓存
      staleTime: 1000 * 60 * 5, // 5 分钟内数据视为新鲜
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// RainbowKit 主题配置
const matrixTheme = darkTheme({
  accentColor: '#00ff00',
  accentColorForeground: '#000000',
  borderRadius: 'small',
  fontStack: 'system',
  overlayBlur: 'small',
});

// 带语言切换的 RainbowKit 包装
const RainbowKitWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const locale: Locale = language === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <RainbowKitProvider theme={matrixTheme} modalSize="compact" locale={locale}>
      {children}
    </RainbowKitProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWrapper>
            <AppRouter />
          </RainbowKitWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ToastProvider>
  </React.StrictMode>
);
