/**
 * 交易所对比表格组件
 */
import React from 'react';
import { Exchange } from '../data/exchanges';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface ExchangeTableProps {
  exchanges: Exchange[];
}

const ExchangeTable: React.FC<ExchangeTableProps> = ({ exchanges }) => {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  const handleRowClick = (exchange: Exchange) => {
    const url = exchange.affiliateUrl || exchange.officialUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 渲染星级
  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="exchange-table-wrapper">
      <table className="exchange-table">
        <thead>
          <tr>
            <th>{isZh ? '交易所' : 'Exchange'}</th>
            <th>{isZh ? '现货费率' : 'Spot Fee'}</th>
            <th>{isZh ? '合约费率' : 'Futures Fee'}</th>
            <th>{isZh ? '安全评级' : 'Security'}</th>
            <th>{isZh ? '适合人群' : 'Best For'}</th>
            <th>{isZh ? '操作' : 'Action'}</th>
          </tr>
        </thead>
        <tbody>
          {exchanges.map((exchange) => (
            <tr key={exchange.id} onClick={() => handleRowClick(exchange)}>
              <td className="exchange-cell">
                <img 
                  src={exchange.logo} 
                  alt={exchange.name}
                  className="table-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/exchanges/default.svg';
                  }}
                />
                <span>{isZh ? exchange.nameCn : exchange.name}</span>
              </td>
              <td className="fee-cell">{exchange.spotFee}</td>
              <td className="fee-cell">{exchange.futuresFee}</td>
              <td className="rating-cell">
                <span className="stars">{renderStars(exchange.securityRating)}</span>
              </td>
              <td className="suitable-cell">
                {(isZh ? exchange.suitableForCn : exchange.suitableFor).join(' / ')}
              </td>
              <td className="action-cell">
                <button className="table-btn">
                  {isZh ? '注册' : 'Sign Up'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExchangeTable;
