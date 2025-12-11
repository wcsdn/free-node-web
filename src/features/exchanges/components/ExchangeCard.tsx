/**
 * 交易所卡片组件
 */
import React from 'react';
import { Exchange } from '../data/exchanges';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface ExchangeCardProps {
  exchange: Exchange;
}

const ExchangeCard: React.FC<ExchangeCardProps> = ({ exchange }) => {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  const handleClick = () => {
    const url = exchange.affiliateUrl || exchange.officialUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 渲染星级评分
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="exchange-card" onClick={handleClick}>
      <div className="card-header">
        <div className="exchange-logo">
          <img 
            src={exchange.logo} 
            alt={exchange.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/exchanges/default.svg';
            }}
          />
        </div>
        <div className="exchange-name">
          <h3>{isZh ? exchange.nameCn : exchange.name}</h3>
          <div className="security-rating">
            {renderStars(exchange.securityRating)}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="fee-info">
          <div className="fee-item">
            <span className="fee-label">{isZh ? '现货' : 'Spot'}</span>
            <span className="fee-value">{exchange.spotFee}</span>
          </div>
          <div className="fee-item">
            <span className="fee-label">{isZh ? '合约' : 'Futures'}</span>
            <span className="fee-value">{exchange.futuresFee}</span>
          </div>
        </div>

        <div className="features">
          {(isZh ? exchange.featuresCn : exchange.features).map((feature, i) => (
            <span key={i} className="feature-tag">{feature}</span>
          ))}
        </div>

        <p className="description">
          {isZh ? exchange.descriptionCn : exchange.description}
        </p>
      </div>

      <div className="card-footer">
        <button className="register-btn">
          {isZh ? '立即注册' : 'Register Now'} →
        </button>
      </div>
    </div>
  );
};

export default ExchangeCard;
