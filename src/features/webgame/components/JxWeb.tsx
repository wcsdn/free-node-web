/**
 * JxWeb - 剑侠情缘 Web 版主界面 (简化版)
 * 原则：UI 逻辑最小化，调用 Hooks 获取数据
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ResourceBar, GameCard, GameButton } from '@/shared/components/game';
import { popupManager } from './PopupManager';
import { useCity } from '../hooks/useCity';
import { useChat } from '../hooks/useChat';
import { getApiBase, getAuthHeaders } from '../utils/api';
import styles from '../styles/jxweb.module.css';

interface JxWebProps {
  walletAddress?: string;
}

// 建筑图标映射
const getBuildingIcon = (configId: number, level: number): string => {
  const icons: Record<number, string> = {
    1: '🏛️', 2: '🏠', 3: '💰', 4: '🌾', 5: '⚔️',
    6: '🛡️', 7: '🏰', 8: '🎯', 9: '📦', 10: '🏥',
  };
  return icons[configId] || '🏗️';
};

const JxWeb: React.FC<JxWebProps> = ({ walletAddress: propWallet }) => {
  const walletAddress = propWallet || localStorage.getItem('wallet-address') || '';
  const [currentTime, setCurrentTime] = useState('');
  const [chatInput, setChatInput] = useState('');

  // 使用 Hooks 获取数据
  const { city, buildings, loading: cityLoading, collect } = useCity(1);
  const { messages, sendMessage } = useChat('global');

  // 时钟
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 建筑点击处理
  const handleBuildingClick = useCallback((buildingId: number) => {
    popupManager.show('building-detail', '建筑详情', (
      <div>
        <p>建筑 ID: {buildingId}</p>
        <GameButton onClick={() => popupManager.hide()}>关闭</GameButton>
      </div>
    ));
  }, []);

  // 发送聊天
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  // 加载状态
  if (cityLoading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 顶部时间 */}
      <div className={styles.topBar}>
        <span>{currentTime}</span>
        <span>钱包: {walletAddress.substring(0, 8)}...</span>
      </div>

      {/* 资源栏 */}
      {city && (
        <ResourceBar
          resources={[
            { type: 'money', value: city.money },
            { type: 'food', value: city.food },
            { type: 'population', value: city.population },
          ]}
          onCollect={collect}
        />
      )}

      {/* 主城市名称 */}
      {city && (
        <h1 className={styles.cityTitle}>
          {city.name}
          <span className={styles.level}>Lv.{city.level || 1}</span>
        </h1>
      )}

      {/* 建筑网格 */}
      <div className={styles.buildingGrid}>
        {buildings.map(b => (
          <div
            key={b.id}
            className={styles.building}
            onClick={() => handleBuildingClick(b.id)}
          >
            <span className={styles.buildingIcon}>{getBuildingIcon(b.configId, b.level)}</span>
            <span className={styles.buildingName}>{b.name || '建筑'}</span>
            <span className={styles.buildingLevel}>Lv.{b.level}</span>
          </div>
        ))}
      </div>

      {/* 底部菜单 */}
      <div className={styles.bottomMenu}>
        <GameButton onClick={popupManager.showBuildingBuild}>建造</GameButton>
        <GameButton onClick={popupManager.showMilitary}>军事</GameButton>
        <GameButton onClick={popupManager.showBattle}>战斗</GameButton>
        <GameButton onClick={popupManager.showHero}>武将</GameButton>
        <GameButton onClick={popupManager.showChat}>聊天</GameButton>
      </div>

      {/* 聊天面板 */}
      <div className={styles.chatPanel}>
        <div className={styles.chatMessages}>
          {messages.slice(-10).map(m => (
            <div key={m.id} className={styles.chatMessage}>
              <span className={styles.chatSender}>{m.sender}:</span>
              <span className={styles.chatContent}>{m.content}</span>
            </div>
          ))}
        </div>
        <input
          className={styles.chatInput}
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendChat()}
          placeholder="输入消息..."
        />
      </div>

      {/* 弹窗管理器 */}
      <PopupManager />
    </div>
  );
};

export default JxWeb;
