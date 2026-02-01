/**
 * WebGame 策略游戏主入口
 */

import React, { memo, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWebGameStore } from './stores/useWebGameStore';
import { useGameLogic } from './hooks/useGameLogic';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { useToast } from '@/shared/components/Toast/ToastContext';
import PageLayout from '@/shared/layouts/PageLayout';
import GameCanvas from './components/GameCanvas';
import GameControl from './components/GameControl';
import styles from './styles/game.module.css';

const WebGame: React.FC = memo(() => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { isAuthenticated, isSigning, authenticate } = useWalletAuth();
  const { language } = useLanguage();
  const { playClick, playSuccess, playError } = useSoundEffect();
  const { showError, showSuccess } = useToast();
  
  const { 
    gameStatus, 
    error,
    startGame,
    moveUnit,
    selectUnit,
    selectedUnit,
    units,
    setError,
  } = useWebGameStore();
  
  const { loadGame } = useGameLogic();

  // 一次性提取所有翻译文本
  const i18n = {
    title: language === 'en' ? 'Strategy Game' : '策略游戏',
    subtitle: language === 'en' ? 'STRATEGY GAME' : '策略游戏',
    desc1: language === 'en' ? '> Cyberpunk strategy game' : '> 赛博朋克策略游戏',
    desc2: language === 'en' ? '> Wallet signature required' : '> 需要钱包签名认证',
    desc3: language === 'en' ? '> Deploy units, defeat enemies' : '> 部署单位，击败敌人',
    connectWallet: language === 'en' ? 'Connect Wallet' : '连接钱包',
    signing: language === 'en' ? 'Signing...' : '签名中...',
    signToStart: language === 'en' ? 'Sign to Start' : '签名开始',
    startGame: language === 'en' ? 'Start Game' : '开始游戏',
    signFailed: language === 'en' ? 'Signature failed, cannot start game' : '签名失败，无法开始游戏',
    gameLoaded: language === 'en' ? 'Game progress loaded' : '已加载游戏进度',
    victory: language === 'en' ? '🎉 Victory!' : '🎉 胜利！',
    defeat: language === 'en' ? '💀 Defeat!' : '💀 失败！',
  };

  // 显示错误提示
  useEffect(() => {
    if (error) {
      showError(error);
      playError();
      // 3秒后清除错误
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, showError, playError, setError]);

  // 游戏状态变化提示
  useEffect(() => {
    if (gameStatus === 'victory') {
      showSuccess(i18n.victory);
      playSuccess();
    } else if (gameStatus === 'defeat') {
      showError(i18n.defeat);
      playError();
    }
  }, [gameStatus, showSuccess, showError, playSuccess, playError, i18n.victory, i18n.defeat]);

  // 处理开始游戏
  const handleStartGame = useCallback(async () => {
    // 检查钱包连接
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    // 检查钱包认证
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) {
        showError(i18n.signFailed);
        return;
      }
    }

    // 尝试加载游戏进度
    const savedGame = await loadGame();
    if (savedGame) {
      // TODO: 恢复游戏进度
      showSuccess(i18n.gameLoaded);
    }

    startGame();
    playClick();
  }, [isConnected, isAuthenticated, authenticate, openConnectModal, startGame, loadGame, showError, showSuccess, playClick, i18n.signFailed, i18n.gameLoaded]);

  // 处理格子点击
  const handleCellClick = useCallback((x: number, y: number) => {
    if (gameStatus !== 'playing') return;

    const clickedUnit = units.find(u => u.x === x && u.y === y);

    // 如果点击的是单位
    if (clickedUnit) {
      // 如果是玩家单位，选中它
      if (clickedUnit.owner === 'player') {
        selectUnit(clickedUnit.id);
        playClick();
      }
      // 如果是敌方单位且有选中的单位，尝试攻击
      else if (selectedUnit) {
        // TODO: 实现攻击逻辑
        playClick();
      }
    }
    // 如果点击的是空格子
    else {
      // 如果有选中的单位，移动它
      if (selectedUnit) {
        moveUnit(selectedUnit, x, y);
        selectUnit(null);
        playClick();
      }
      // 否则尝试生成单位（需要先在商店选择单位类型）
      else {
        // TODO: 实现生成单位逻辑
      }
    }
  }, [gameStatus, units, selectedUnit, selectUnit, moveUnit, playClick]);

  return (
    <PageLayout title={i18n.title}>
      <div className={styles.gameBody}>
        {/* 游戏未开始 */}
        {gameStatus === 'idle' && (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeTitle}>
              <span className={styles.glitch}>{i18n.subtitle}</span>
            </div>
            <div className={styles.welcomeDesc}>
              <p>{i18n.desc1}</p>
              <p>{i18n.desc2}</p>
              <p>{i18n.desc3}</p>
            </div>
            <button
              className={styles.startBtn}
              onClick={handleStartGame}
              disabled={isSigning}
            >
              {!isConnected 
                ? i18n.connectWallet
                : !isAuthenticated 
                  ? (isSigning ? i18n.signing : i18n.signToStart) 
                  : i18n.startGame
              }
            </button>
          </div>
        )}

        {/* 游戏进行中 */}
        {gameStatus !== 'idle' && (
          <div className={styles.gameLayout}>
            <div className={styles.canvasSection}>
              <GameCanvas onCellClick={handleCellClick} />
            </div>
            <div className={styles.controlSection}>
              <GameControl />
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </PageLayout>
  );
});

WebGame.displayName = 'WebGame';

export default WebGame;
