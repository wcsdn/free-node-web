/**
 * 模块H: FAQ
 */

import React, { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

interface FAQItem {
  q: string;
  q_en: string;
  a: string;
  a_en: string;
}

const FAQSection: React.FC = () => {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      q: 'KYC 是什么？要不要做？',
      q_en: 'What is KYC? Do I need it?',
      a: 'KYC（Know Your Customer）是身份验证。大多数交易所需要 KYC 才能使用全部功能。具体要求因平台和地区而异。',
      a_en: 'KYC (Know Your Customer) is identity verification. Most exchanges require KYC for full features. Requirements vary by platform and region.',
    },
    {
      q: '国内手机号能不能注册？',
      q_en: 'Can I register with my local phone number?',
      a: '以平台与地区政策为准。部分平台支持，部分可能需要邮箱注册。建议查看平台官方说明。',
      a_en: 'Depends on platform and regional policies. Some support it, some may require email. Check official platform guidelines.',
    },
    {
      q: '为什么建议先小额？',
      q_en: 'Why start with a small amount?',
      a: '小额测试可以帮你熟悉流程，避免因操作失误造成大额损失。特别是提币时，选错网络可能导致资产丢失。',
      a_en: 'Small tests help you learn the process and avoid costly mistakes. Especially for withdrawals, wrong network may cause asset loss.',
    },
    {
      q: '返佣怎么生效？多久到账？',
      q_en: 'How does referral rebate work?',
      a: '以平台规则为准。通常需要通过推荐链接注册并完成一定交易量。到账时间因平台而异，可能是实时或定期结算。',
      a_en: 'Per platform rules. Usually requires registration via referral link and certain trading volume. Settlement time varies by platform.',
    },
  ];

  return (
    <section className="faq-section start-section">
      <h2 className="start-section-title">
        {language === 'zh' ? '❓ 常见问题' : '❓ FAQ'}
      </h2>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${openIndex === index ? 'open' : ''}`}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="faq-question">
              <span>{language === 'zh' ? faq.q : faq.q_en}</span>
              <span className="faq-toggle">{openIndex === index ? '−' : '+'}</span>
            </div>
            {openIndex === index && (
              <div className="faq-answer">{language === 'zh' ? faq.a : faq.a_en}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
