/**
 * 交易所数据配置
 */

export interface Exchange {
  id: string;
  name: string;
  nameCn: string;
  logo: string;
  affiliateUrl: string;
  officialUrl: string;
  spotFee: string;
  futuresFee: string;
  securityRating: number;
  features: string[];
  featuresCn: string[];
  suitableFor: string[];
  suitableForCn: string[];
  description: string;
  descriptionCn: string;
  // 新增扩展字段（/start 页面用）
  beginnerCopy: string;
  beginnerCopyCn: string;
  riskNote: string;
  riskNoteCn: string;
  bonusText: string;
  bonusTextCn: string;
  goUrl: string;
  regionsNote: string;
  regionsNoteCn: string;
  kycNote: string;
  kycNoteCn: string;
  tag: 'beginner' | 'advanced' | 'newcoin' | 'highrisk';
}

export const exchanges: Exchange[] = [
  {
    id: 'okx',
    name: 'OKX',
    nameCn: '欧易',
    logo: '/images/exchanges/okx.svg',
    affiliateUrl: 'https://www.okx.com/join/FREENODE',
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
    // 新增字段
    beginnerCopy: 'If you\'re a beginner wanting to buy your first crypto and potentially withdraw to on-chain later, OKX offers a complete path: from buying to withdrawing to Web3 usage. Enable 2FA/anti-phishing code first, then practice with a small "buy→withdraw" test.',
    beginnerCopyCn: '如果你是纯新手，想先买到第一笔币、同时未来可能要提币上链，OKX 的路径相对完整：从买币到提币到 Web3 使用都比较顺。建议注册后第一件事先开 2FA/防钓鱼码，并用小额完成一次"买→提"的演练。',
    riskNote: 'Not investment advice; platform services, KYC and promotions subject to official rules. Always test withdrawals with small amounts first.',
    riskNoteCn: '不构成投资建议；平台服务、KYC 与活动规则以官方为准。提币务必先小额测试并确认网络。',
    bonusText: 'Register via our link for possible fee rebates/new user rewards (per platform rules)',
    bonusTextCn: '通过本站链接注册，可能获得手续费返还/新客奖励（以平台规则为准）',
    goUrl: '/go/okx?utm_source=free-node&utm_medium=start_table&utm_campaign=affiliate_v1&utm_content=okx_card',
    regionsNote: 'Availability varies by region',
    regionsNoteCn: '可用性因地区而异',
    kycNote: 'KYC may be required, varies by region',
    kycNoteCn: '可能需要身份验证，因地区而异',
    tag: 'beginner',
  },
  {
    id: 'bybit',
    name: 'Bybit',
    nameCn: 'Bybit',
    logo: '/images/exchanges/bybit.svg',
    affiliateUrl: 'https://www.bybit.com/invite?ref=FREENODE',
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
    // 新增字段
    beginnerCopy: 'Bybit\'s events and trading features suit users who want more activities or prefer trading. Beginners should start with spot, avoid high-leverage derivatives; master account security, withdrawal networks, limit orders/stop-loss basics first.',
    beginnerCopyCn: 'Bybit 的活动运营和交易功能对"想多看活动/更偏交易"的用户比较友好。新手建议先从现货开始，不要一上来就碰高杠杆合约；先把账户安全、提币网络选择、限价单/止损这些基础练熟。',
    riskNote: 'Derivatives and leverage carry extremely high risk and may cause rapid losses; complete basic learning and risk assessment first.',
    riskNoteCn: '合约与杠杆风险极高，可能导致快速亏损；请先完成基础学习与风险评估。',
    bonusText: 'Register via our link for possible fee discounts/event eligibility (per platform rules)',
    bonusTextCn: '通过本站链接注册，可能获得手续费优惠/活动资格（以平台规则为准）',
    goUrl: '/go/bybit?utm_source=free-node&utm_medium=start_table&utm_campaign=affiliate_v1&utm_content=bybit_card',
    regionsNote: 'Availability varies by region',
    regionsNoteCn: '可用性因地区而异',
    kycNote: 'KYC may be required, varies by region',
    kycNoteCn: '可能需要身份验证，因地区而异',
    tag: 'advanced',
  },
  {
    id: 'bitget',
    name: 'Bitget',
    nameCn: 'Bitget',
    logo: '/images/exchanges/bitget.svg',
    affiliateUrl: 'https://www.bitget.com/referral/register?ref=FREENODE',
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
    // 新增字段
    beginnerCopy: 'Bitget\'s selling points are copy trading and events, appealing to those who want hands-off market participation. Treat copy trading as a learning tool, not guaranteed profit: control position size, use only affordable-to-lose funds, enable 2FA and withdrawal whitelist.',
    beginnerCopyCn: 'Bitget 常见卖点是跟单和活动，对"想省心但又想参与市场"的用户有吸引力。建议把跟单当作学习工具而不是稳赚工具：控制仓位、只用可承受亏损的资金，并优先开启 2FA 和提现白名单（如支持）。',
    riskNote: 'Copy trading/derivatives/volatile assets all carry high risk; beware of "guaranteed returns" promises and unofficial support.',
    riskNoteCn: '跟单/合约/高波动资产风险都很高；谨防"高收益承诺"和非官方客服。',
    bonusText: 'Register via our link for possible rebates/new user task rewards (per platform rules)',
    bonusTextCn: '通过本站链接注册，可能获得返佣/新人任务奖励（以平台规则为准）',
    goUrl: '/go/bitget?utm_source=free-node&utm_medium=start_table&utm_campaign=affiliate_v1&utm_content=bitget_card',
    regionsNote: 'Availability varies by region',
    regionsNoteCn: '可用性因地区而异',
    kycNote: 'KYC may be required, varies by region',
    kycNoteCn: '可能需要身份验证，因地区而异',
    tag: 'beginner',
  },
  {
    id: 'gate',
    name: 'Gate.io',
    nameCn: '芝麻开门',
    logo: '/images/exchanges/gate.svg',
    affiliateUrl: 'https://www.gate.io/signup?ref=FREENODE',
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
    // 新增字段
    beginnerCopy: 'If you prefer "many new coins, fast listings", Gate often meets the need for "finding new opportunities". But new coins mean higher risk: information asymmetry, high volatility, varying project quality. Don\'t go heavy on new coins; use small amounts, batch orders, set stop-loss, verify info via official announcements only.',
    beginnerCopyCn: '如果你偏好"新币多、上新快"，Gate 往往能满足"想找新机会"的需求。但新币也意味着更高风险：信息不对称、波动大、项目质量参差。新手不建议重仓冲新币，先用小额、分批、设置止损并坚持只用官方公告校验信息。',
    riskNote: 'New coins and small-cap assets carry extremely high risk with potential for extreme volatility and liquidity issues; always test with small amounts first.',
    riskNoteCn: '新币与小市值资产风险极高，可能出现暴涨暴跌与流动性风险；请务必先小额测试。',
    bonusText: 'Register via our link for possible fee discounts/rebates (per platform rules)',
    bonusTextCn: '通过本站链接注册，可能获得手续费优惠/返佣（以平台规则为准）',
    goUrl: '/go/gate?utm_source=free-node&utm_medium=start_table&utm_campaign=affiliate_v1&utm_content=gate_card',
    regionsNote: 'Availability varies by region',
    regionsNoteCn: '可用性因地区而异',
    kycNote: 'KYC may be required, varies by region',
    kycNoteCn: '可能需要身份验证，因地区而异',
    tag: 'highrisk',
  },
];

// 标签配置
export const tagConfig = {
  beginner: { label: '新手友好', labelEn: 'Beginner', color: '#00ff41' },
  advanced: { label: '进阶用户', labelEn: 'Advanced', color: '#00ccff' },
  newcoin: { label: '新币多', labelEn: 'New Coins', color: '#ffcc00' },
  highrisk: { label: '高风险', labelEn: 'High Risk', color: '#ff4444' },
};

// 活动类型映射
export const activityTypes = {
  airdrop: { label: 'Airdrop', labelCn: '空投', color: '#00ff41' },
  bonus: { label: 'Bonus', labelCn: '奖励', color: '#ffcc00' },
  competition: { label: 'Competition', labelCn: '比赛', color: '#ff6600' },
  other: { label: 'Event', labelCn: '活动', color: '#00ccff' },
};
