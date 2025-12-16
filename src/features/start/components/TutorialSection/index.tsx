/**
 * 模块F: 教程区（Tab切换）
 */

import React, { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import './styles.css';

type TabKey = 'buy' | 'withdraw' | 'terms';

const TutorialSection: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('buy');

  const tabs: { key: TabKey; label: string; label_en: string }[] = [
    { key: 'buy', label: '如何买到第一笔币', label_en: 'How to Buy First Crypto' },
    { key: 'withdraw', label: '如何提币到钱包', label_en: 'How to Withdraw' },
    { key: 'terms', label: '常见术语', label_en: 'Common Terms' },
  ];

  const scrollToExchange = () => {
    document.getElementById('exchange-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="tutorial-section start-section">
      <h2 className="start-section-title">
        {language === 'zh' ? '📚 新手教程' : '📚 Tutorials'}
      </h2>

      <div className="tutorial-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tutorial-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {language === 'zh' ? tab.label : tab.label_en}
          </button>
        ))}
      </div>

      <div className="tutorial-content">
        {activeTab === 'buy' && (
          <div className="tutorial-panel">
            <h3>{language === 'zh' ? '💰 购买第一笔 USDT/ETH' : '💰 Buy Your First USDT/ETH'}</h3>
            <ol>
              <li>{language === 'zh' ? '完成交易所注册和 KYC（如需要）' : 'Complete registration and KYC (if required)'}</li>
              <li>{language === 'zh' ? '进入"买币"或"C2C/P2P"页面' : 'Go to "Buy Crypto" or "P2P" page'}</li>
              <li>{language === 'zh' ? '选择支付方式（银行卡/支付宝等）' : 'Choose payment method'}</li>
              <li>{language === 'zh' ? '输入金额，确认汇率' : 'Enter amount, confirm rate'}</li>
              <li>{language === 'zh' ? '完成支付，等待到账' : 'Complete payment, wait for arrival'}</li>
            </ol>
            <div className="tutorial-tip">
              💡 {language === 'zh' ? '建议先小额测试，熟悉流程' : 'Start with a small amount to learn the process'}
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="tutorial-panel">
            <h3>{language === 'zh' ? '⛓️ 提币到钱包（链上玩家必看）' : '⛓️ Withdraw to Wallet'}</h3>
            <ol>
              <li>{language === 'zh' ? '确认钱包地址和网络（如 ETH/Arbitrum/BSC）' : 'Confirm wallet address and network'}</li>
              <li>{language === 'zh' ? '在交易所选择"提币"' : 'Select "Withdraw" on exchange'}</li>
              <li>{language === 'zh' ? '粘贴地址，选择正确的网络' : 'Paste address, choose correct network'}</li>
              <li>{language === 'zh' ? '输入金额，确认手续费' : 'Enter amount, confirm fee'}</li>
              <li>{language === 'zh' ? '完成 2FA 验证，提交' : 'Complete 2FA, submit'}</li>
            </ol>
            <div className="tutorial-warning">
              ⚠️ {language === 'zh' ? '选错网络资产可能丢失！务必先小额测试' : 'Wrong network may cause loss! Always test with small amount first'}
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="tutorial-panel">
            <h3>{language === 'zh' ? '📖 常见术语' : '📖 Common Terms'}</h3>
            <div className="terms-grid">
              {[
                { term: 'USDT', desc: '稳定币，1:1锚定美元', desc_en: 'Stablecoin pegged to USD' },
                { term: 'ETH', desc: '以太坊原生代币', desc_en: 'Ethereum native token' },
                { term: 'Gas', desc: '链上交易手续费', desc_en: 'On-chain transaction fee' },
                { term: 'KYC', desc: '身份验证', desc_en: 'Identity verification' },
                { term: '2FA', desc: '双重认证', desc_en: 'Two-factor authentication' },
                { term: '现货', desc: '直接买卖币', desc_en: 'Spot trading' },
                { term: '合约', desc: '杠杆衍生品（高风险）', desc_en: 'Derivatives (high risk)' },
                { term: '钱包', desc: '存储私钥的工具', desc_en: 'Tool to store private keys' },
              ].map((item, i) => (
                <div key={i} className="term-item">
                  <span className="term-name">{item.term}</span>
                  <span className="term-desc">{language === 'zh' ? item.desc : item.desc_en}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="start-cta-secondary" onClick={scrollToExchange}>
          {language === 'zh' ? '↑ 回到对比表/开户链接' : '↑ Back to Comparison'}
        </button>
      </div>
    </section>
  );
};

export default TutorialSection;
