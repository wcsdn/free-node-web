/**
 * 模块D: 交易所对比表（核心转化模块）
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { exchanges, tagConfig } from '@/features/exchanges/data/exchanges';
import './styles.css';

const ExchangeTable: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleRegister = (goUrl: string) => {
    navigate(goUrl);
  };

  return (
    <section className="exchange-section start-section">
      <h2 className="start-section-title">
        {language === 'zh' ? '📊 交易所对比' : '📊 Exchange Comparison'}
      </h2>

      <div className="exchange-list">
        {exchanges.map((ex) => (
          <div key={ex.id} className="exchange-card start-card">
            {/* 顶部标签 */}
            <div
              className="exchange-tag"
              style={{
                backgroundColor: `${tagConfig[ex.tag].color}20`,
                color: tagConfig[ex.tag].color,
                borderColor: tagConfig[ex.tag].color,
              }}
            >
              {language === 'zh' ? tagConfig[ex.tag].label : tagConfig[ex.tag].labelEn}
            </div>

            {/* 名称 */}
            <div className="exchange-header">
              <div className="exchange-name">{ex.name}</div>
            </div>

            {/* 适合谁 */}
            <div className="exchange-best-for">
              {language === 'zh' ? ex.suitableForCn.join(' / ') : ex.suitableFor.join(' / ')}
            </div>

            {/* 新手说明 */}
            <div className="exchange-beginner-copy">
              {language === 'zh' ? ex.beginnerCopyCn : ex.beginnerCopy}
            </div>

            {/* 特色功能 */}
            <div className="exchange-features">
              {(language === 'zh' ? ex.featuresCn : ex.features).map((f, i) => (
                <span key={i} className="feature-tag">
                  {f}
                </span>
              ))}
            </div>

            {/* 费率和KYC */}
            <div className="exchange-notes">
              <div className="note">💰 {language === 'zh' ? `现货 ${ex.spotFee}` : `Spot ${ex.spotFee}`}</div>
              <div className="note">🔐 {language === 'zh' ? ex.kycNoteCn : ex.kycNote}</div>
              <div className="note">🌍 {language === 'zh' ? ex.regionsNoteCn : ex.regionsNote}</div>
            </div>

            {/* 风险提示 */}
            <div className="exchange-risk-note">
              ⚠️ {language === 'zh' ? ex.riskNoteCn : ex.riskNote}
            </div>

            {/* 开户按钮 */}
            <button className="exchange-cta start-cta-primary" onClick={() => handleRegister(ex.goUrl)}>
              {language === 'zh' ? '通过 FREE-NODE 开户' : 'Register via FREE-NODE'}
            </button>
            <div className="exchange-bonus">
              {language === 'zh' ? ex.bonusTextCn : ex.bonusText}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExchangeTable;
