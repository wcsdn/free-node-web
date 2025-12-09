/**
 * 拉新任务配置
 * 可以随时修改链接，无需重新发版
 */

export interface ReferralTask {
  id: string;
  title: string;
  titleZh: string;
  url: string;
  icon: string;
  reward: string;
  rewardZh: string;
  description?: string;
  descriptionZh?: string;
}

export const referralTasks: ReferralTask[] = [
  {
    id: 'task_vultr',
    title: 'Deploy a Server (Get $100 Credit)',
    titleZh: '部署服务器（获得 $100 额度）',
    url: 'https://www.vultr.com/?ref=YOUR_CODE', // 替换为你的返佣链接
    icon: '🖥️',
    reward: 'VIP Status',
    rewardZh: 'VIP 权限',
    description: 'Sign up for Vultr and get $100 credit',
    descriptionZh: '注册 Vultr 并获得 $100 额度',
  },
  {
    id: 'task_okx',
    title: 'Register OKX Account',
    titleZh: '注册 OKX 账户',
    url: 'https://okx.com/join/YOUR_CODE', // 替换为你的返佣链接
    icon: '₿',
    reward: 'VIP Status',
    rewardZh: 'VIP 权限',
    description: 'Register and complete KYC on OKX',
    descriptionZh: '注册并完成 OKX 的 KYC 认证',
  },
  {
    id: 'task_binance',
    title: 'Register Binance Account',
    titleZh: '注册币安账户',
    url: 'https://accounts.binance.com/register?ref=YOUR_CODE', // 替换为你的返佣链接
    icon: '🔶',
    reward: 'VIP Status',
    rewardZh: 'VIP 权限',
    description: 'Register and trade on Binance',
    descriptionZh: '注册并在币安进行交易',
  },
  {
    id: 'task_digitalocean',
    title: 'Deploy on DigitalOcean ($200 Credit)',
    titleZh: '在 DigitalOcean 部署（$200 额度）',
    url: 'https://m.do.co/c/YOUR_CODE', // 替换为你的返佣链接
    icon: '🌊',
    reward: 'VIP Status',
    rewardZh: 'VIP 权限',
    description: 'Sign up and get $200 credit for 60 days',
    descriptionZh: '注册并获得 60 天 $200 额度',
  },
  {
    id: 'task_cloudflare',
    title: 'Deploy on Cloudflare Pages',
    titleZh: '在 Cloudflare Pages 部署',
    url: 'https://pages.cloudflare.com/', // 可以是你的教程链接
    icon: '☁️',
    reward: 'VIP Status',
    rewardZh: 'VIP 权限',
    description: 'Deploy your first project on Cloudflare',
    descriptionZh: '在 Cloudflare 部署你的第一个项目',
  },
];

/**
 * 验证任务完成（简化版）
 * 实际项目中可以通过 API 回调验证
 */
export function verifyTaskCompletion(taskId: string, userAddress: string): boolean {
  // TODO: 实现实际的验证逻辑
  // 例如：检查用户是否通过你的链接注册
  // 可以通过合作平台的 API 或 Webhook 验证
  
  // 目前简化处理：用户点击链接后手动验证
  return true;
}
