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

interface PopupState {
  id: string;
  title: string;
  component: React.ReactNode;
}

// Type for components with optional onClose
type OptionalOnCloseProps = { onClose?: () => void };

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
  showMilitary() { this.show('military', '军事', <MilitaryPanel />); },
  showBattle() { this.show('battle', '战斗', <BattlePanel />); },
  showDungeon() { this.show('dungeon', '副本', <DungeonPanel />); },
  showDefense() { this.show('defense', '城防', <DefensePanel />); },
  showHero() { this.show('hero', '武将', <HeroPanel />); },
  showChat() { this.show('chat', '聊天', <ChatPanel />); },
  showNotification() { 
    const el = React.createElement(NotificationPanel, { onClose: () => {} });
    this.show('notification', '消息', el as React.ReactElement<OptionalOnCloseProps>); 
  },
  showDaily() { 
    const el = React.createElement(DailyPanel, { onClose: () => {} });
    this.show('daily', '每日任务', el as React.ReactElement<OptionalOnCloseProps>); 
  },
  showSignin() { 
    const el = React.createElement(SigninPanel, { onClose: () => {} });
    this.show('signin', '签到', el as React.ReactElement<OptionalOnCloseProps>); 
  },
  showHelp() { 
    const el = React.createElement(HelpPanel, { onClose: () => {} });
    this.show('help', '帮助', el as React.ReactElement<OptionalOnCloseProps>); 
  },
};

export const PopupManager: React.FC = () => {
  const [popup, setPopup] = useState<PopupState | null>(null);

  useEffect(() => {
    const unsubscribe = popupManager.subscribe(setPopup);
    return unsubscribe;
  }, []);

  if (!popup) return null;

  return (
    <GameModal isOpen={true} title={popup.title} onClose={popupManager.hide}>
      {popup.component}
    </GameModal>
  );
};

export default PopupManager;
