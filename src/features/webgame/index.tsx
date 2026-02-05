/**
 * WebGame 剑侠情缘游戏主入口
 * 从 Main.aspx 迁移
 */
import React, { memo, useCallback, useEffect } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useWebGameStore } from './stores/useWebGameStore';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { useToast } from '@/shared/components/Toast/ToastContext';
import PageLayout from '@/shared/layouts/PageLayout';
import JxGame from './components/JxGame';
import styles from './styles/game.module.css';

const WebGame: React.FC = memo(() => {
  // 临时关闭钱包检查，方便调试
  // const { isConnected } = useAccount();
  // const { openConnectModal } = useConnectModal();
  // const { authHeader, isAuthenticated, isSigning, authenticate } = useWalletAuth();
  const isConnected = true; // 直接通过
  const isAuthenticated = true; // 直接通过
  const isSigning = false;
  const authHeader = 'test:0x1234567890abcdef1234567890abcdef12345678';
  const walletAddress = authHeader ? authHeader.split(':')[0] : '';
  const { language } = useLanguage();
  const { playClick, playError } = useSoundEffect();
  const { showError } = useToast();
  const { error, setError } = useWebGameStore();

  const i18n = {
    title: language === 'en' ? '剑侠情缘' : '剑侠情缘Web',
    welcome: language === 'en' ? 'Welcome to JX Online' : '欢迎来到剑侠情缘',
    connectWallet: language === 'en' ? 'Connect Wallet' : '连接钱包',
    signing: language === 'en' ? 'Signing...' : '签名中...',
    signToStart: language === 'en' ? 'Sign to Start' : '签名开始',
    startGame: language === 'en' ? 'Enter Game' : '进入游戏',
    signFailed: language === 'en' ? 'Signature failed' : '签名失败',
  };

  // 显示错误提示
  useEffect(() => {
    if (error) {
      showError(error);
      playError();
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, showError, playError, setError]);

  // 处理进入游戏 - 临时跳过
  const handleStartGame = useCallback(() => {
    playClick();
  }, [playClick]);

  // 未认证时显示欢迎界面
  if (!isAuthenticated) {
    return (
      <PageLayout title={i18n.title}>
        <div className={styles.gameBody}>
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeTitle}>
              <span className={styles.glitch}>{i18n.title}</span>
            </div>
            <div className={styles.welcomeDesc}>
              <p>{i18n.welcome}</p>
            </div>
            <button
              className={styles.startBtn}
              onClick={handleStartGame}
              disabled={isSigning}
            >
              {!isConnected 
                ? i18n.connectWallet
                : isSigning ? i18n.signing : i18n.signToStart
              }
            </button>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  // 已认证时显示剑侠情缘游戏主界面
  return <JxGame walletAddress={walletAddress || ''} />;
});

WebGame.displayName = 'WebGame';

export default WebGame;
