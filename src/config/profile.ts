// 个人信息配置
export const profileConfig = {
  // 项目档案
  projects: [
    {
      id: 1,
      title: 'Free Node Web',
      description: 'Cyberpunk-style personal homepage with Web3 integration',
      tags: ['React', 'TypeScript', 'Web3', 'Cloudflare'],
      github: 'https://github.com/wcsdn/free-node-web',
      demo: 'https://free-node-web.pages.dev',
      status: 'active',
    },
    {
      id: 2,
      title: 'DApp Template',
      description: 'Decentralized application template with smart contracts',
      tags: ['Solidity', 'Hardhat', 'Ethers.js', 'React'],
      github: 'https://github.com/yourusername/dapp-template',
      demo: '',
      status: 'wip',
    },
  ],

  // 技能树
  skills: {
    frontend: 85,
    backend: 70,
    blockchain: 75,
    devops: 65,
    design: 60,
    security: 70,
  },

  // 时间轴
  timeline: [
    {
      year: 2013,
      title: 'System Initialized',
      description: 'Started coding journey',
      type: 'milestone',
    },
    {
      year: 2020,
      title: 'Protocol Upgrade',
      description: 'Learned Web3 & Blockchain',
      type: 'upgrade',
    },
    {
      year: 2025,
      title: 'Current Mission',
      description: 'Building decentralized applications',
      type: 'current',
    },
  ],
};
