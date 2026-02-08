/**
 * Game UI 预览页面
 * 路径: /jxweb-preview
 * 展示所有新重构的赛博朋克风格组件
 */
import React, { useState } from 'react';
import {
  GameButton, GameCard, GameModal, GameInput, ResourceBar,
  CityView, HeroPanel, BuildingPanel, ShopPanel,
  MilitaryPanel, BattlePanel, ChatPanel, MailPanel,
  RankingPanel, TaskPanel, DungeonPanel, DefensePanel
} from '@/features/webgame/components';

const TestWallet = '0x1234567890abcdef1234567890abcdef12345678';

const GameUIPreview: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('city');

  const tabs = [
    { id: 'city', name: '主城', icon: '🏰' },
    { id: 'hero', name: '武将', icon: '⚔️' },
    { id: 'building', name: '建筑', icon: '🏗️' },
    { id: 'shop', name: '商城', icon: '🛒' },
    { id: 'military', name: '军事', icon: '🎖️' },
    { id: 'battle', name: '战斗', icon: '⚔️' },
    { id: 'chat', name: '聊天', icon: '💬' },
    { id: 'mail', name: '邮件', icon: '📧' },
    { id: 'rank', name: '排行', icon: '🏆' },
    { id: 'task', name: '任务', icon: '📋' },
    { id: 'dungeon', name: '副本', icon: '🏰' },
    { id: 'defense', name: '城防', icon: '🛡️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'city': return <CityView walletAddress={TestWallet} />;
      case 'hero': return <HeroPanel walletAddress={TestWallet} />;
      case 'building': return <BuildingPanel walletAddress={TestWallet} />;
      case 'shop': return <ShopPanel walletAddress={TestWallet} />;
      case 'military': return <MilitaryPanel walletAddress={TestWallet} />;
      case 'battle': return <BattlePanel walletAddress={TestWallet} />;
      case 'chat': return <ChatPanel walletAddress={TestWallet} />;
      case 'mail': return <MailPanel walletAddress={TestWallet} />;
      case 'rank': return <RankingPanel walletAddress={TestWallet} />;
      case 'task': return <TaskPanel walletAddress={TestWallet} />;
      case 'dungeon': return <DungeonPanel walletAddress={TestWallet} />;
      case 'defense': return <DefensePanel walletAddress={TestWallet} />;
      default: return <CityView walletAddress={TestWallet} />;
    }
  };

  return (
    <div style={{ 
      background: '#000', 
      minHeight: '100vh',
      padding: '80px 20px 20px'
    }}>
      {/* 顶部导航 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
        padding: '10px 20px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        zIndex: 1000,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'rgba(0, 255, 0, 0.2)' : 'transparent',
              border: `1px solid ${activeTab === tab.id ? '#00FF00' : 'rgba(0, 255, 0, 0.3)'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#00FF00',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ marginRight: '5px' }}>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* 页面标题 */}
      <h1 style={{
        textAlign: 'center',
        fontFamily: "'Courier New', monospace",
        fontSize: '24px',
        color: '#00FF00',
        textTransform: 'uppercase',
        letterSpacing: '4px',
        marginBottom: '30px',
        textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
      }}>
        Game UI Preview - {tabs.find(t => t.id === activeTab)?.name}
      </h1>

      {/* 组件预览 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </div>

      {/* 模态框示例 */}
      <GameModal isOpen={showModal} onClose={() => setShowModal(false)} title="组件预览">
        <p style={{ 
          fontFamily: "'Courier New', monospace", 
          color: '#00FF00',
          lineHeight: '2',
        }}>
          这是一个赛博朋克风格的模态框示例。
          所有新组件都采用统一的设计语言。
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <GameButton onClick={() => setShowModal(false)}>确认</GameButton>
          <GameButton variant="secondary" onClick={() => setShowModal(false)}>取消</GameButton>
        </div>
      </GameModal>

      {/* 打开模态框按钮 */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <GameButton onClick={() => setShowModal(true)}>
          打开模态框示例
        </GameButton>
      </div>
    </div>
  );
};

export default GameUIPreview;
