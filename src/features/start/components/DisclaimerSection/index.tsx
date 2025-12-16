/**
 * 模块I: 合规与免责声明
 */

import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

const DisclaimerSection: React.FC = () => {
  const { language } = useLanguage();

  return (
    <section className="disclaimer-section">
      <div className="disclaimer-content">
        {language === 'zh' ? (
          <>
            <p>
              <strong>⚠️ 免责声明</strong>
            </p>
            <p>
              本站内容仅用于信息整理与新手教育，不构成任何投资建议。加密资产交易风险极高，请自行判断并承担风险。
            </p>
            <p>
              交易所服务可用性、KYC 要求、活动与返佣规则可能因地区与时间变化，以平台官方页面为准。
            </p>
            <p>
              请警惕钓鱼链接与假客服；务必使用官方渠道下载 App，启用 2FA，并先进行小额测试。
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>⚠️ Disclaimer</strong>
            </p>
            <p>
              This site is for informational and educational purposes only, not investment advice. Crypto trading carries high risk; make your own decisions.
            </p>
            <p>
              Exchange availability, KYC requirements, promotions and referral rules may vary by region and time. Always check official platform pages.
            </p>
            <p>
              Beware of phishing links and fake support. Always download apps from official sources, enable 2FA, and test with small amounts first.
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default DisclaimerSection;
