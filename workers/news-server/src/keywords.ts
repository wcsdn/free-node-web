/**
 * 关键词库 - 用于新闻分类和匹配
 */

// 交易所关键词
export const EXCHANGE_KEYWORDS = [
  // 中心化交易所 - 英文
  'binance', 'okx', 'bybit', 'bitget', 'gate.io', 'gate', 'mexc', 'kucoin', 
  'htx', 'huobi', 'kraken', 'coinbase', 'crypto.com', 'bitfinex', 'gemini', 
  'bitstamp', 'upbit', 'bithumb',
  // 中心化交易所 - 中文
  '币安', '欧易', '芝麻开门', '火币', '库币',
  // DEX
  'uniswap', 'pancakeswap', 'sushiswap', 'curve', 'balancer',
  'dydx', 'gmx', 'vertex', 'hyperliquid', 'jupiter', 'raydium',
  'orca', 'trader joe', 'camelot',
  // 衍生品
  'deribit', 'perpetual', 'perp',
];

// 活动关键词
export const ACTIVITY_KEYWORDS = [
  // 空投相关
  '空投', 'airdrop', 'claim', '领取', '快照', 'snapshot',
  '白名单', 'whitelist', 'wl', 'allowlist',
  // 交易所活动
  '活动', '奖励', 'bonus', '大赛', 'competition', '福利',
  '注册', 'register', '开户',
  '交易赛', '瓜分', '奖金池', 'prize', 'pool',
  '返佣', '邀请', 'referral', 'invite', 'commission',
  // 上线相关
  '上线', 'listing', 'list', '首发', '首次',
  'launchpad', 'launchpool', 'kickstarter',
  'ido', 'ieo', 'ico', 'presale', '预售',
  // 费用相关
  '手续费', 'fee', '减免', '折扣', 'discount',
  '零手续费', 'zero fee',
  // 充提相关
  '充值', 'deposit', '提现', 'withdraw', '入金', '出金',
  // 新项目
  '新币', '新项目', '新上线', 'new listing',
  // 质押挖矿
  '质押', 'staking', 'stake', '挖矿', 'mining',
  '理财', 'earn', '年化', 'apy', 'apr',
];

// 热点关键词
export const HOT_KEYWORDS = [
  // 行情相关
  '暴涨', '暴跌', '突破', '新高', 'ath', '历史新高',
  '减半', 'halving', '牛市', '熊市', 'bull', 'bear',
  // 大事件
  '监管', 'regulation', 'sec', 'etf', '批准', 'approved',
  '清算', 'liquidation', '爆仓', '爆破',
  '黑客', 'hack', '攻击', 'exploit', '漏洞',
  // 项目动态
  '主网', 'mainnet', '测试网', 'testnet',
  '升级', 'upgrade', '硬分叉', 'fork',
  '融资', 'funding', '估值', 'valuation',
  // 热门叙事
  'layer2', 'l2', 'rollup', 'zk', 'op',
  'defi', 'nft', 'gamefi', 'socialfi',
  'meme', 'memecoin', 'ai', 'rwa', 'depin',
];

// 公链关键词
export const CHAIN_KEYWORDS = [
  // 主流链
  'bitcoin', 'btc', '比特币',
  'ethereum', 'eth', '以太坊',
  'solana', 'sol', 'bnb', 'bsc',
  // L2
  'arbitrum', 'arb', 'optimism', 'op',
  'base', 'zksync', 'starknet', 'linea',
  'polygon', 'matic', 'scroll', 'manta',
  // 其他链
  'avalanche', 'avax', 'fantom', 'ftm',
  'cosmos', 'atom', 'sui', 'aptos', 'apt',
  'ton', 'near', 'sei', 'injective', 'inj',
];
