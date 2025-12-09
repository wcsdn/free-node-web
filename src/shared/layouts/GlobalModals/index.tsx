/**
 * 全局模态框组件
 * 现在只管理钱包连接模态框
 */
import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguage } from '../../hooks/useLanguage';
import Backdrop from '../../components/Backdrop';
import './styles.css';

const GlobalModals: React.FC = () => {
  const { currentModal, closeModal } = useModal();
  const { isConnected } = useAccount();
  const { t } = useLanguage();

  if (currentModal !== 'wallet') return null;

  return (
    <>
      <Backdrop onClick={closeModal} zIndex={9998} />
      <div className="wallet-modal">
        <div className="wallet-modal-header">
          <h2 className="wallet-modal-title">{t('connectWallet')}</h2>
          <button onClick={closeModal} className="wallet-modal-close">
            [ X ]
          </button>
        </div>
        <div className="wallet-modal-content">
          <p className="wallet-modal-description">
            {isConnected ? t('walletConnectedSuccess') : t('connectWalletDescription')}
          </p>
          <div className="wallet-connect-wrapper">
            <ConnectButton />
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalModals;
