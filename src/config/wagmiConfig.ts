import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Free Node Web',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, polygon],
  ssr: false,
});
