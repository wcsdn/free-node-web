import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Free Node Web',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, polygon],
  ssr: false,
  // 添加这个配置来避免 MetaMask SDK 的问题
  multiInjectedProviderDiscovery: false,
});
