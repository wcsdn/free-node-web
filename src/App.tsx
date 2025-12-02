import React, { useState, useEffect } from 'react';
import './App.css';
import MatrixRain from './components/MatrixRain';
import NewsTerminal from './components/NewsTerminal';
import CyberRabbit from './components/CyberRabbit';
import { useAccount, useBalance, useEnsName } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const LINES = [
  '> Wake up, Neo...',
  '> The Matrix has you...',
  '> Follow the white rabbit.'
];

const App: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  // 防止 hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

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
                <ConnectButton />
              </div>
            )}
            
            {/* 连接成功后显示用户信息 */}
            {mounted && isConnected && address && (
              <div className="user-info-panel">
                <div className="info-header">✅ 钱包已连接</div>
                <div className="info-row">
                  <span className="info-label">地址:</span>
                  <span className="info-value">{ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}</span>
                </div>
                {chain && (
                  <div className="info-row">
                    <span className="info-label">网络:</span>
                    <span className="info-value">{chain.name}</span>
                  </div>
                )}
                {balance && (
                  <div className="info-row">
                    <span className="info-label">余额:</span>
                    <span className="info-value">{parseFloat(balance.formatted).toFixed(4)} {balance.symbol}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 未连接时显示提示 */}
            {mounted && !isConnected && (
              <div className="connect-prompt">
                <p>🔐 连接钱包以访问新闻终端</p>
              </div>
            )}
            
            {/* 只在连接钱包后显示 NewsTerminal */}
            {mounted && isConnected && (
              <div className="news-section">
                <NewsTerminal />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;

