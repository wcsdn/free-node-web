import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { registerModalController } from '../utils/globalAPI';

type ModalType = 'ghost-mail' | 'profile' | 'wallet' | 'news' | 'settings' | null;

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

  const isModalOpen = useCallback((modal: ModalType) => {
    return currentModal === modal;
  }, [currentModal]);

  // 注册全局控制器
  useEffect(() => {
    registerModalController({
      openModal: (modal) => openModal(modal),
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
