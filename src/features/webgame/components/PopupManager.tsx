/**
 * PopupManager - 弹窗管理器 (简化版)
 * 原则：只管理弹窗状态，具体面板使用子组件
 */
import React, { useState, useEffect } from 'react';
import { GameModal } from '@/shared/components/game';
import { BuildingBuildPanel } from './popups/BuildingBuildPanel';
import { CityUpgradePanel } from './popups/CityUpgradePanel';
import MilitaryPanel from './MilitaryPanel';
import BattlePanel from './BattlePanel';
import DungeonPanel from './DungeonPanel';
import DefensePanel from './DefensePanel';
import HeroPanel from './HeroPanel';
import ChatPanel from './ChatPanel';
import NotificationPanel from './NotificationPanel';
import DailyPanel from './DailyPanel';
import SigninPanel from './SigninPanel';
import HelpPanel from './HelpPanel';
import { getApiBase, getAuthHeaders } from '../utils/api';

interface PopupState {
  id: string;
  title: string;
  component: React.ReactNode;
}

// 弹窗管理器
export const popupManager = {
  currentPopup: null as PopupState | null,
  listeners: [] as ((popup: PopupState | null) => void)[],

  subscribe(listener: (p: PopupState | null) => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  },

  show(id: string, title: string, component: React.ReactNode) {
    this.currentPopup = { id, title, component };
    this.listeners.forEach(l => l(this.currentPopup));
  },

  hide() {
    this.currentPopup = null;
    this.listeners.forEach(l => l(null));
  },

  showBuildingBuild() { this.show('building-build', '建造建筑', <BuildingBuildPanel onClose={this.hide} />); },
  showCityUpgrade() { this.show('city-upgrade', '城市升级', <CityUpgradePanel onClose={this.hide} />); },
  showMilitary() { this.show('military', '军事', <MilitaryPanel onClose={this.hide} />); },
  showBattle() { this.show('battle', '战斗', <BattlePanel onClose={this.hide} />); },
  showDungeon() { this.show('dungeon', '副本', <DungeonPanel onClose={this.hide} />); },
  showDefense() { this.show('defense', '城防', <DefensePanel onClose={this.hide} />); },
  showHero() { this.show('hero', '武将', <HeroPanel onClose={this.hide} />); },
  showChat() { this.show('chat', '聊天', <ChatPanel onClose={this.hide} />); },
  showNotification() { this.show('notification', '消息', <NotificationPanel onClose={this.hide} />); },
  showDaily() { this.show('daily', '每日任务', <DailyPanel onClose={this.hide} />); },
  showSignin() { this.show('signin', '签到', <SigninPanel onClose={this.hide} />); },
  showHelp() { this.show('help', '帮助', <HelpPanel onClose={this.hide} />); },
};

// PopupManager 组件
export const PopupManager: React.FC = () => {
  const [popup, setPopup] = useState<PopupState | null>(null);

  useEffect(() => {
    const unsubscribe = popupManager.subscribe(setPopup);
    return unsubscribe;
  }, []);

  if (!popup) return null;

  return (
    <GameModal title={popup.title} onClose={popupManager.hide}>
      {popup.component}
    </GameModal>
  );
};

export default PopupManager;
