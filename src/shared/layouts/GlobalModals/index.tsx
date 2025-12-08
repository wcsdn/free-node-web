import React, { useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguage } from '../../contexts/LanguageContext';
import Backdrop from '../../components/Backdrop';
import ProfilePage from '../../../features/profile/ProfilePage';
import GhostMailPage from '../../../features/ghost-mail/GhostMailPage';
import NewsPage from '../../../features/news/NewsPage';
import SettingsPage from '../../../features/settings';
import './styles.css';

const GlobalModals: React.FC = () => {
  const { currentModal, closeModal } = useModal();
  const { isConnected } = useAccount();
  const { t } = useLanguage();

  // 当有模态框打开时,禁止 body 滚动
  useEffect(() => {
    if (currentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // 清理函数
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentModal]);

  return (
    <>
      {/* Profile Modal */}
      <ProfilePage 
        isOpen={currentModal === 'profile'} 
        onClose={closeModal} 
      />

      {/* Wallet Connect Modal */}
      {currentModal === 'wallet' && (
        <>
          <Backdrop onClick={closeModal} zIndex={9998} />
          <div className="wallet-modal">
            <div className="wallet-modal-header">
              <h2 className="wallet-modal-title">
                {t('connectWallet')}
              </h2>
              <button onClick={closeModal} className="wallet-modal-close">
                [ X ]
              </button>
            </div>
            <div className="wallet-modal-content">
              {!isConnected ? (
                <>
                  <p className="wallet-modal-description">
                    {t('connectWalletDescription')}
                  </p>
                  <div className="wallet-connect-wrapper">
                    <ConnectButton />
                  </div>
                </>
              ) : (
                <>
                  <p className="wallet-modal-description">
                    {t('walletConnectedSuccess')}
                  </p>
                  <div className="wallet-connect-wrapper">
                    <ConnectButton />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Ghost Mail Modal */}
      {currentModal === 'ghost-mail' && (
        <>
          <Backdrop onClick={closeModal} zIndex={9998} />
          <div className="ghost-mail-modal">
            <div className="ghost-mail-modal-header">
              <h2 className="ghost-mail-modal-title">
                {t('ghostMailTitle')}
              </h2>
              <button onClick={closeModal} className="ghost-mail-modal-close">
                [ X ]
              </button>
            </div>
            <div className="ghost-mail-modal-content">
              <GhostMailPage />
            </div>
          </div>
        </>
      )}

      {/* News Modal */}
      {currentModal === 'news' && (
        <>
          <Backdrop onClick={closeModal} zIndex={9998} />
          <div className="news-modal">
            <div className="news-modal-header">
              <h2 className="news-modal-title">
                {t('newsTerminal')}
              </h2>
              <button onClick={closeModal} className="news-modal-close">
                [ X ]
              </button>
            </div>
            <div className="news-modal-content">
              <NewsPage />
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      {currentModal === 'settings' && (
        <>
          <Backdrop onClick={closeModal} zIndex={9998} />
          <SettingsPage onClose={closeModal} />
        </>
      )}
    </>
  );
};

export default GlobalModals;
