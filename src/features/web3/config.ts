import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon } from 'wagmi/chains';
import { createStorage } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'Free Node Web',
  projectId: '2d0b34f43158d2d790b6f53945e95391',
  chains: [mainnet, polygon],
  ssr: false,
  // 添加这个配置来避免 MetaMask SDK 的问题
  multiInjectedProviderDiscovery: false,
  // 启用持久化存储（使用 localStorage）
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
});
