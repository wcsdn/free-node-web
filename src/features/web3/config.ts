import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon } from 'wagmi/chains';
import { createStorage } from 'wagmi';
import { env } from '@/config/env';

export const config = getDefaultConfig({
  appName: 'Free Node Web',
  projectId: env.walletConnect.projectId,
  chains: [mainnet, polygon],
  ssr: false,
  // 添加这个配置来避免 MetaMask SDK 的问题
  multiInjectedProviderDiscovery: false,
  // 启用持久化存储（使用 localStorage）
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
});
