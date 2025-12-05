import React, { useState, useEffect } from 'react';
import './App.css';
import MatrixRain from './components/MatrixRain';
import NewsTerminal from './components/NewsTerminal';
import CyberRabbit from './components/CyberRabbit';
import VipContent from './components/VipContent';
import DonateButton from './components/DonateButton';
import Guestbook from './components/Guestbook';
import SettingsPanel from './components/SettingsPanel';
import ProjectArchives from './components/ProjectArchives';
import SkillRadar from './components/SkillRadar';
import ExecutionLog from './components/ExecutionLog';
import { useAccount, useBalance, useEnsName } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguage } from './contexts/LanguageContext';
import { useSoundEffect } from './hooks/useSoundEffect';

const App: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const { t } = useLanguage();
  const { playSuccess } = useSoundEffect();
  const [mounted, setMounted] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [hasPlayedConnectSound, setHasPlayedConnectSound] = useState(false);

  const LINES = [
    '> Wake up, Neo...',
    '> The Matrix has you...',
    '> Follow the white rabbit.',
  ];

  // 防止 hydration 不匹配
  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    if (currentLine < LINES.length) {
      const line = LINES[currentLine];
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (charIndex < line.length) {
          setDisplayedText(() => {
            const currentLineText = LINES.slice(0, currentLine).join('\n');
            return currentLineText + (currentLineText ? '\n' : '') + line.substring(0, charIndex + 1);
          });
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
          }, 500);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    } else if (currentLine === LINES.length) {
      const timer = setTimeout(() => {
        setShowButtons(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLine]);

  return (
    <div className="matrix-container">
      <SettingsPanel />
      <MatrixRain fontSize={16} />
      <div className="crt-scanline"></div>
      <div className="crt-noise"></div>
      
      <div className="terminal-content">
        <div className="typewriter-text">
          {displayedText}
          <span className="cursor">_</span>
        </div>
        
        {showButtons && (
          <>
            <CyberRabbit />
            
            {/* 只在客户端挂载后显示钱包相关 UI */}
            {mounted && (
              <div className="wallet-connect-section">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button onClick={openConnectModal} className="custom-connect-button">
                                Open Door
                              </button>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button onClick={openChainModal} className="custom-connect-button">
                                {chain.name}
                              </button>
                              <button onClick={openAccountModal} className="custom-connect-button">
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            )}
            
            {/* 连接成功后显示用户信息 */}
            {mounted && isConnected && address && (
              <div className="user-info-panel">
                <div className="info-header">{t('walletConnected')}</div>
                <div className="info-row">
                  <span className="info-label">{t('address')}</span>
                  <span className="info-value">{ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}</span>
                </div>
                {chain && (
                  <div className="info-row">
                    <span className="info-label">{t('network')}</span>
                    <span className="info-value">{chain.name}</span>
                  </div>
                )}
                {balance && (
                  <div className="info-row">
                    <span className="info-label">{t('balance')}</span>
                    <span className="info-value">{parseFloat(balance.formatted).toFixed(4)} {balance.symbol}</span>
                  </div>
                )}
              </div>
            )}
            
            
            {/* 只在连接钱包后显示所有内容 */}
            {mounted && isConnected && (
              <>
                <VipContent />
                <ProjectArchives />
                <SkillRadar />
                <ExecutionLog />
                <DonateButton />
                <Guestbook />
                <div className="news-section">
                  <NewsTerminal />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;

