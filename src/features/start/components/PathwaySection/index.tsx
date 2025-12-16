/**
 * 模块C: 人群分流
 */

import React from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

interface PathwaySectionProps {
  onSelectPath?: (path: 'beginner' | 'onchain') => void;
}

const PathwaySection: React.FC<PathwaySectionProps> = ({ onSelectPath }) => {
  const { language } = useLanguage();

  return (
    <section className="pathway-section start-section">
      <h2 className="start-section-title">
        {language === 'zh' ? '🎯 你是哪类用户？' : '🎯 What type of user are you?'}
      </h2>
      <div className="pathway-grid">
        <div
          className="pathway-card start-card"
          onClick={() => onSelectPath?.('beginner')}
        >
          <div className="pathway-icon">💰</div>
          <div className="pathway-title">
            {language === 'zh' ? '我只想买币/现货新手' : 'I just want to buy crypto'}
          </div>
          <div className="pathway-desc">
            {language === 'zh'
              ? '推荐新手友好平台 + 一步步教程'
              : 'Beginner-friendly platforms + step-by-step guides'}
          </div>
          <div className="pathway-tag beginner">
            {language === 'zh' ? '推荐：Bybit / OKX' : 'Recommended: Bybit / OKX'}
          </div>
        </div>

        <div
          className="pathway-card start-card"
          onClick={() => onSelectPath?.('onchain')}
        >
          <div className="pathway-icon">⛓️</div>
          <div className="pathway-title">
            {language === 'zh' ? '我要上链/撸空投' : 'I want to go on-chain / farm airdrops'}
          </div>
          <div className="pathway-desc">
            {language === 'zh'
              ? '提币网络选择 + 跨链提醒 + 链上入口'
              : 'Withdrawal networks + cross-chain tips + on-chain entry'}
          </div>
          <div className="pathway-tag onchain">
            {language === 'zh' ? '推荐：OKX / Gate' : 'Recommended: OKX / Gate'}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PathwaySection;
