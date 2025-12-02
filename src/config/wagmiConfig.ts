import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Free Node Web',
  projectId: '2d0b34f43158d2d790b6f53945e95391',
  chains: [mainnet, polygon],
  ssr: false,
  // 添加这个配置来避免 MetaMask SDK 的问题
  multiInjectedProviderDiscovery: false,
});
