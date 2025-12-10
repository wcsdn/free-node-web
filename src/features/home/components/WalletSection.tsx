/**
 * 钱包连接区域组件
 */
import React, { memo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useEnsName } from 'wagmi';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { useSoundEffect } from '@/shared/hooks/useSoundEffect';
import './WalletSection.css';

export const WalletSection: React.FC = memo(() => {
  const { isConnected, address, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
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

      {/* 连接成功后显示用户信息 */}
      {isConnected && address && (
        <div className="user-info-panel">
          <div className="info-header">{t('walletConnected')}</div>
          <div className="info-row">
            <span className="info-label">{t('address')}</span>
            <span className="info-value">
              {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
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
              <span className="info-value">
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 游客模式提示 */}
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
