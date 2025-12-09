/**
 * 主页组件
 * 从 App.tsx 拆分出来的主页逻辑
 */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAccount } from 'wagmi';
import MatrixRain from '@/shared/components/MatrixRain';
import CyberRabbit from '@/shared/components/CyberRabbit';
import CyberRose from '@/shared/components/CyberRose';
import ActionButton from '@/shared/components/ActionButton';
import Footer from '@/shared/components/Footer';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import { perfMonitor } from '@/shared/utils/performance';
import { useTypewriter, useAmbientSound } from './hooks';
import { WalletSection, HomeContent } from './components';
import './HomePage.css';

const MATRIX_LINES = [
  '> Wake up, Neo...',
  '> The Matrix has you...',
  '> Follow the white rabbit.',
];

const HomePage: React.FC = memo(() => {
  const { isConnected } = useAccount();
  const { playSuccess } = useSoundEffect();
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [hasPlayedConnectSound, setHasPlayedConnectSound] = useState(false);

  // 使用自定义 hooks
  useAmbientSound();

  const handleTypewriterComplete = useCallback(() => {
    setTimeout(() => setShowContent(true), 1000);
  }, []);

  const { displayedText } = useTypewriter({
    lines: MATRIX_LINES,
    typingSpeed: 50,
    lineDelay: 500,
    onComplete: handleTypewriterComplete,
  });

  // 防止 hydration 不匹配
  useEffect(() => {
    perfMonitor.mark('home-mount');
    setMounted(true);
    perfMonitor.measure('Home Mount Time', 'home-mount');
  }, []);

  // 连接成功时播放音效
  useEffect(() => {
    if (isConnected && !hasPlayedConnectSound) {
      playSuccess();
      setHasPlayedConnectSound(true);
    } else if (!isConnected) {
      setHasPlayedConnectSound(false);
    }
  }, [isConnected, hasPlayedConnectSound, playSuccess]);

  return (
    <div className="matrix-container">
      {/* 导航按钮 */}
      {showContent && (
        <>
          <ActionButton type="profile" position={0} />
          <ActionButton type="news" position={1} />
          <ActionButton type="ghost-mail" position={2} />
          <ActionButton type="settings" position={3} />
        </>
      )}

      {/* 背景效果 */}
      <MatrixRain fontSize={16} />
      <div className="crt-scanline" />
      <div className="crt-noise" />

      {/* 主内容区 */}
      <div className="terminal-content">
        <div className="typewriter-text">
          {displayedText}
          <span className="cursor">_</span>
        </div>

        {showContent && (
          <>
            <CyberRabbit />
            <CyberRose />

            {/* 钱包区域 - 只在客户端挂载后显示 */}
            {mounted && <WalletSection />}

            {/* 主页内容 */}
            {mounted && <HomeContent />}
          </>
        )}
      </div>

      {/* 页脚 */}
      {showContent && <Footer />}
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;
