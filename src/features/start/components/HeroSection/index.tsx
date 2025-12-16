/**
 * 模块A: Hero 首屏
 */

import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

interface HeroSectionProps {
  onScrollTo: (id: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onScrollTo }) => {
  const { language } = useLanguage();

  return (
    <section className="hero-section">
      <h1 className="hero-title">
        {language === 'zh'
          ? '新手第一步：选对交易所 + 做好安全设置'
          : 'Step One: Choose the Right Exchange & Secure Your Account'}
      </h1>
      <p className="hero-subtitle">
        {language === 'zh'
          ? '我们用清单帮你少踩坑；通过本站开户链接可能获得手续费返还/注册奖励（以平台规则为准）'
          : 'We help you avoid common pitfalls; signup via our links may earn fee rebates/bonuses (per platform rules)'}
      </p>

      <div className="hero-cta-group">
        <button className="start-cta-primary" onClick={() => onScrollTo('exchange-table')}>
          {language === 'zh' ? '📊 对比后开始注册' : '📊 Compare & Register'}
        </button>
        <button className="start-cta-secondary" onClick={() => onScrollTo('checklist')}>
          {language === 'zh' ? '🔒 先看新手安全清单' : '🔒 Security Checklist First'}
        </button>
      </div>

      <p className="hero-disclaimer">
        {language === 'zh'
          ? '⚠️ 不提供投资建议；请确认你所在地区合规可用'
          : '⚠️ Not investment advice; verify availability in your region'}
      </p>
    </section>
  );
};

export default HeroSection;
