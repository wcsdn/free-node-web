/**
 * UTM 参数工具
 * 统一规范：utm_source=free-node, utm_campaign=affiliate_v1
 */

export type UtmMedium =
  | 'start_hero'      // 首屏主按钮
  | 'start_table'     // 对比表卡片按钮
  | 'news_list'       // 新闻列表内插 CTA
  | 'news_detail'     // 新闻详情页 CTA
  | 'mail_success'    // 邮箱开通/支付成功页
  | 'oracle_footer'   // AI 页脚推荐
  | 'nav'             // 顶部导航入口
  | 'popup';          // 弹窗/新手引导

export type ExchangeId = 'okx' | 'bybit' | 'bitget' | 'gate';

/**
 * 生成交易所跳转 URL
 */
export function buildExchangeUrl(
  exchangeId: ExchangeId,
  medium: UtmMedium,
  content?: string
): string {
  const params = new URLSearchParams({
    utm_source: 'free-node',
    utm_medium: medium,
    utm_campaign: 'affiliate_v1',
    utm_content: content || `${exchangeId}_card`,
  });
  return `/go/${exchangeId}?${params.toString()}`;
}

/**
 * 生成 /start 页面链接（带来源追踪）
 */
export function buildStartUrl(medium: UtmMedium): string {
  const params = new URLSearchParams({
    utm_source: 'free-node',
    utm_medium: medium,
    utm_campaign: 'affiliate_v1',
  });
  return `/start?${params.toString()}`;
}
