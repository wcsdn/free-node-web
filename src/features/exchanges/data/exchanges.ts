/**
 * 交易所数据配置
 */

export interface Exchange {
  id: string;
  name: string;
  nameCn: string;
  logo: string;
  affiliateUrl: string;        // 返佣链接（待填入）
  officialUrl: string;         // 官网链接
  spotFee: string;             // 现货手续费
  futuresFee: string;          // 合约手续费
  securityRating: number;      // 安全评级 1-5
  features: string[];          // 特色功能
  featuresCn: string[];        // 特色功能（中文）
  suitableFor: string[];       // 适合人群
  suitableForCn: string[];     // 适合人群（中文）
  description: string;         // 简介
  descriptionCn: string;       // 简介（中文）
}

export const exchanges: Exchange[] = [
  {
    id: 'binance',
    name: 'Binance',
    nameCn: '币安',
    logo: '/images/exchanges/binance.svg',
    affiliateUrl: '',  // 待填入
    officialUrl: 'https://www.binance.com',
    spotFee: '0.1%',
    futuresFee: '0.02% / 0.04%',
    securityRating: 5,
    features: ['Largest Volume', 'Most Coins', 'High Liquidity'],
    featuresCn: ['全球最大', '币种最全', '流动性好'],
    suitableFor: ['Beginners', 'Large Funds'],
    suitableForCn: ['新手', '大资金用户'],
    description: 'World\'s largest cryptocurrency exchange by trading volume',
    descriptionCn: '全球交易量第一的加密货币交易所',
  },
  {
    id: 'okx',
    name: 'OKX',
    nameCn: '欧易',
    logo: '/images/exchanges/okx.svg',
    affiliateUrl: '',  // 待填入
    officialUrl: 'https://www.okx.com',
    spotFee: '0.08%',
    futuresFee: '0.02% / 0.05%',
    securityRating: 5,
    features: ['Web3 Wallet', 'DEX Aggregator', 'Copy Trading'],
    featuresCn: ['Web3 钱包', 'DEX 聚合', '跟单交易'],
    suitableFor: ['Web3 Users', 'DeFi Players'],
    suitableForCn: ['Web3 用户', 'DeFi 玩家'],
    description: 'All-in-one trading platform with integrated Web3 wallet',
    descriptionCn: '集成 Web3 钱包的一站式交易平台',
  },
  {
    id: 'bybit',
    name: 'Bybit',
    nameCn: 'Bybit',
    logo: '/images/exchanges/bybit.svg',
    affiliateUrl: '',  // 待填入
    officialUrl: 'https://www.bybit.com',
    spotFee: '0.1%',
    futuresFee: '0.01% / 0.06%',
    securityRating: 4,
    features: ['Pro Derivatives', 'Copy Trading', 'Many Events'],
    featuresCn: ['合约专业', '跟单系统', '活动多'],
    suitableFor: ['Futures Traders', 'Airdrop Hunters'],
    suitableForCn: ['合约交易者', '空投猎人'],
    description: 'Exchange known for professional derivatives trading',
    descriptionCn: '以衍生品交易著称的交易所',
  },
  {
    id: 'bitget',
    name: 'Bitget',
    nameCn: 'Bitget',
    logo: '/images/exchanges/bitget.svg',
    affiliateUrl: '',  // 待填入
    officialUrl: 'https://www.bitget.com',
    spotFee: '0.1%',
    futuresFee: '0.02% / 0.06%',
    securityRating: 4,
    features: ['One-Click Copy', 'Strategy Trading', 'New Listings'],
    featuresCn: ['一键跟单', '策略交易', '新币多'],
    suitableFor: ['Copy Traders', 'New Coin Hunters'],
    suitableForCn: ['跟单用户', '新币猎人'],
    description: 'Leading exchange for copy trading',
    descriptionCn: '跟单交易领先的交易所',
  },
  {
    id: 'gate',
    name: 'Gate.io',
    nameCn: '芝麻开门',
    logo: '/images/exchanges/gate.svg',
    affiliateUrl: '',  // 待填入
    officialUrl: 'https://www.gate.io',
    spotFee: '0.2%',
    futuresFee: '0.015% / 0.05%',
    securityRating: 4,
    features: ['Most Altcoins', 'Fast Listings', 'Startup IEO'],
    featuresCn: ['小币种多', '上新快', 'Startup 打新'],
    suitableFor: ['Altcoin Players', 'IEO Hunters'],
    suitableForCn: ['山寨币玩家', '打新用户'],
    description: 'Fastest listing speed with most altcoins',
    descriptionCn: '上币速度最快，小币种最全',
  },
];

// 活动类型映射
export const activityTypes = {
  airdrop: { label: 'Airdrop', labelCn: '空投', color: '#00ff41' },
  bonus: { label: 'Bonus', labelCn: '奖励', color: '#ffcc00' },
  competition: { label: 'Competition', labelCn: '比赛', color: '#ff6600' },
  other: { label: 'Event', labelCn: '活动', color: '#00ccff' },
};
