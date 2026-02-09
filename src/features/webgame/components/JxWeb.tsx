/**
 * JxWeb - 剑侠情缘 Web 版主界面
 * 原则：移动端优先，简洁设计
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ResourceBar, GameButton } from '@/shared/components/game';
import { popupManager, PopupManager } from './PopupManager';
import { useCity } from '../hooks/useCity';
import { useChat } from '../hooks/useChat';

interface JxWebProps {
  walletAddress?: string;
}

const getBuildingIcon = (configId: number, _level: number): string => {
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

  const { city, buildings, loading: cityLoading, collect } = useCity(1);
  const { messages, sendMessage } = useChat('global');

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBuildingClick = useCallback((buildingId: number) => {
    popupManager.show('building-detail', '建筑详情', (
      <div className="space-y-4">
        <p>建筑 ID: {buildingId}</p>
        <GameButton fullWidth onClick={() => popupManager.hide()}>关闭</GameButton>
      </div>
    ));
  }, []);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  if (cityLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-500">LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-sm text-slate-400 font-mono">{currentTime}</span>
        <span className="text-xs text-slate-500">
          {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '未连接'}
        </span>
      </div>

      {/* 资源栏 */}
      {city && (
        <div className="px-4 py-3">
          <ResourceBar
            resources={[
              { type: 'money', value: city.money },
              { type: 'food', value: city.food },
              { type: 'population', value: city.population },
            ]}
            onCollect={collect}
          />
        </div>
      )}

      {/* 主城市名称 */}
      {city && (
        <div className="px-4 py-2">
          <h1 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            {city.name}
            <span className="text-sm px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
              Lv.1
            </span>
          </h1>
        </div>
      )}

      {/* 建筑网格 */}
      <div className="flex-1 px-4 overflow-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 py-2">
          {buildings.map(b => (
            <button
              key={b.id}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all flex flex-col items-center gap-2"
              onClick={() => handleBuildingClick(b.id)}
            >
              <span className="text-3xl">{getBuildingIcon(b.configId, b.level)}</span>
              <span className="text-sm text-slate-300 truncate w-full text-center">{b.name || '建筑'}</span>
              <span className="text-xs text-emerald-400">Lv.{b.level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 聊天面板 */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="h-32 overflow-y-auto mb-2 space-y-1 scrollbar-thin">
          {messages.slice(-20).map(m => (
            <div key={m.id} className="text-sm">
              <span className="text-emerald-400 font-medium">{m.sender}:</span>
              <span className="text-slate-300 ml-2">{m.content}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendChat()}
            placeholder="输入消息..."
          />
          <button
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/30"
            onClick={handleSendChat}
          >
            发送
          </button>
        </div>
      </div>

      {/* 底部菜单 */}
      <div className="grid grid-cols-5 gap-2 p-3 border-t border-slate-700/50 bg-slate-800/50">
        <GameButton size="sm" onClick={popupManager.showBuildingBuild}>建造</GameButton>
        <GameButton size="sm" onClick={popupManager.showMilitary}>军事</GameButton>
        <GameButton size="sm" onClick={popupManager.showBattle}>战斗</GameButton>
        <GameButton size="sm" onClick={popupManager.showHero}>武将</GameButton>
        <GameButton size="sm" onClick={popupManager.showChat}>聊天</GameButton>
      </div>

      {/* 弹窗管理器 */}
      <PopupManager />
    </div>
  );
};

export default JxWeb;
