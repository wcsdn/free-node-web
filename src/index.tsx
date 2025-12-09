/**
 * 应用入口
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './features/web3/config';
import { ToastProvider } from './shared/contexts/ToastContext';
import { ModalProvider } from './shared/contexts/ModalContext';
import { AppRouter } from './router';

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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <ModalProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: '#00ff00',
                accentColorForeground: '#000000',
                borderRadius: 'none',
                fontStack: 'system',
              })}
            >
              <AppRouter />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ModalProvider>
    </ToastProvider>
  </React.StrictMode>
);
