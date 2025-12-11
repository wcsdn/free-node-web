/**
 * 钱包连接区域组件
 */
import React, { memo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import './WalletSection.css';

export const WalletSection: React.FC = memo(() => {
  const { isConnected } = useAccount();
  const { t } = useLanguage();
  const { playClick } = useSoundEffect();

  return (
    <>
      {/* 钱包连接按钮 */}
      <div className="wallet-connect-section">
        <ConnectButton.Custom>
          {({ account, chain: currentChain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && currentChain;

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
                {!connected ? (
                  <button
                    onClick={() => {
                      playClick();
                      openConnectModal();
                    }}
                    className="custom-connect-button"
                  >
                    Open Door
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={openChainModal} className="custom-connect-button">
                      {currentChain.name}
                    </button>
                    <button onClick={openAccountModal} className="custom-connect-button">
                      {account.displayName}
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>

      {/* 游客模式提示 - 只在未连接时显示 */}
      {!isConnected && (
        <div className="user-info-panel guest-mode-panel">
          <div className="info-header">👻 {t('guestMode') || 'Guest Mode'}</div>
          <div className="info-row">
            <span className="info-value guest-mode-hint">
              {t('guestModeHint') || 'Connect wallet to unlock full features'}
            </span>
          </div>
        </div>
      )}
    </>
  );
});

WalletSection.displayName = 'WalletSection';
