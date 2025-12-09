/**
 * 模态框 Context
 * 现在只管理钱包连接模态框
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { registerModalController } from '../utils/globalAPI';

type ModalType = 'wallet' | null;

interface ModalContextType {
  currentModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  isModalOpen: (modal: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);

  const openModal = useCallback((modal: ModalType) => {
    setCurrentModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setCurrentModal(null);
  }, []);

  const isModalOpen = useCallback(
    (modal: ModalType) => {
      return currentModal === modal;
    },
    [currentModal]
  );

  // 当弹框打开时禁止背景滚动
  useEffect(() => {
    if (currentModal) {
      const scrollY = window.scrollY;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [currentModal]);

  // 注册全局控制器
  useEffect(() => {
    registerModalController({
      openModal,
      closeModal,
    });
  }, [openModal, closeModal]);

  return (
    <ModalContext.Provider value={{ currentModal, openModal, closeModal, isModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
