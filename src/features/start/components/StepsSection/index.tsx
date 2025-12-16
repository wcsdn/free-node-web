/**
 * 模块B: 三步流程
 */

import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

const StepsSection: React.FC = () => {
  const { language } = useLanguage();

  const steps = [
    {
      num: 1,
      title: language === 'zh' ? '选交易所' : 'Choose Exchange',
      desc: language === 'zh' ? '按用途选择适合你的平台' : 'Pick based on your needs',
      icon: '🏦',
    },
    {
      num: 2,
      title: language === 'zh' ? '完成安全设置' : 'Secure Your Account',
      desc: language === 'zh' ? '2FA / 防钓鱼码 / 提现白名单' : '2FA / Anti-phishing / Whitelist',
      icon: '🔐',
    },
    {
      num: 3,
      title: language === 'zh' ? '小额试运行' : 'Test with Small Amount',
      desc: language === 'zh' ? '买币 → 提币到钱包（可选）' : 'Buy → Withdraw to wallet (optional)',
      icon: '🧪',
    },
  ];

  return (
    <section className="steps-section start-section">
      <h2 className="start-section-title">
        {language === 'zh' ? '📋 三步开始' : '📋 3 Steps to Start'}
      </h2>
      <div className="steps-grid">
        {steps.map((step) => (
          <div key={step.num} className="step-card start-card">
            <div className="step-icon">{step.icon}</div>
            <div className="step-num">Step {step.num}</div>
            <div className="step-title">{step.title}</div>
            <div className="step-desc">{step.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StepsSection;
