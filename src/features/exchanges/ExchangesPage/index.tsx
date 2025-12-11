/**
 * 交易所推荐页面
 */
import React, { useState } from 'react';
import PageLayout from '@/shared/layouts/PageLayout';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { exchanges } from '../data/exchanges';
import { ExchangeCard, ExchangeTable, ActivityList, VisitorCounter } from '../components';
import './styles.css';

type ViewMode = 'cards' | 'table';

const ExchangesPage: React.FC = () => {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  return (
    <PageLayout title={isZh ? '> 交易所推荐' : '> EXCHANGE GUIDE'}>
      <div className="exchanges-container">
        {/* 页面头部信息 */}
        <div className="exchanges-header">
          <div className="header-info">
            <p className="header-desc">
              {isZh 
                ? '🎯 目标用户：Web3 开发者、空投猎人、加密货币新手'
                : '🎯 For: Web3 Developers, Airdrop Hunters, Crypto Beginners'
              }
            </p>
            <VisitorCounter page="/exchanges" />
          </div>
          
          {/* 视图切换 */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              {isZh ? '卡片' : 'Cards'}
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              {isZh ? '表格' : 'Table'}
            </button>
          </div>
        </div>

        {/* 交易所列表 */}
        <div className="exchanges-content">
          {viewMode === 'cards' ? (
            <div className="exchange-cards">
              {exchanges.map((exchange) => (
                <ExchangeCard key={exchange.id} exchange={exchange} />
              ))}
            </div>
          ) : (
            <ExchangeTable exchanges={exchanges} />
          )}
        </div>

        {/* 活动列表 */}
        <ActivityList />

        {/* 风险提示 */}
        <div className="risk-warning">
          <p>
            {isZh 
              ? '⚠️ 风险提示：加密货币交易存在风险，请谨慎投资。本页面包含推广链接，通过链接注册可能为本站带来佣金收入。'
              : '⚠️ Risk Warning: Cryptocurrency trading involves risk. This page contains affiliate links that may earn commission for this site.'
            }
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default ExchangesPage;
