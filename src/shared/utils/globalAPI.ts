/**
 * 全局 API - 可在任何地方调用打开各种功能
 *
 * 使用示例:
 * import { openWallet } from '@/shared/utils/globalAPI';
 *
 * // 提示用户连接钱包
 * openWallet();
 */

/**
 * 提示用户连接钱包
 * 注意：实际的钱包连接由 RainbowKit 的 ConnectButton 处理
 * 这个函数只是在没有连接按钮的地方给用户提示
 */
export const openWallet = () => {
  console.warn('请点击页面上的 "Open Door" 按钮连接钱包');
  // 可以在这里添加 Toast 提示
};
