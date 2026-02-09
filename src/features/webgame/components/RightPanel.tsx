/**
 * RightPanel - 右侧面板 (简化版)
 */
import React from 'react';
import { GameButton } from '@/shared/components/game';
import { popupManager } from './PopupManager';

export const RightPanel: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      right: 20,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <GameButton onClick={popupManager.showDaily}>📋 任务</GameButton>
      <GameButton onClick={popupManager.showSignin}>📅 签到</GameButton>
      <GameButton onClick={popupManager.showHelp}>❓ 帮助</GameButton>
      <GameButton onClick={popupManager.showNotification}>📬 消息</GameButton>
    </div>
  );
};

export default RightPanel;
