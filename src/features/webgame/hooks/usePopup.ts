/**
 * 弹窗管理 Hook
 * 统一的弹窗状态管理
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode, type ReactElement } from 'react';

// 弹窗类型定义
interface PopupConfig {
  id: string;
  title?: string;
  component: ReactNode;
  onClose?: () => void;
  props?: Record<string, unknown>;
}

interface PopupState {
  isOpen: boolean;
  config: PopupConfig | null;
}

// 弹窗管理器接口
interface PopupManagerInterface {
  open: (config: Omit<PopupConfig, 'isOpen'>) => void;
  close: () => void;
  closeAll: () => void;
  update: (config: Partial<PopupConfig>) => void;
}

// 上下文
const PopupContext = createContext<PopupManagerInterface | null>(null);

/**
 * 弹窗 Provider
 */
export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [popupState, setPopupState] = useState<PopupState>({
    isOpen: false,
    config: null,
  });

  // 打开弹窗
  const open = useCallback((config: Omit<PopupConfig, 'isOpen'>) => {
    setPopupState({
      isOpen: true,
      config: {
        ...config,
        isOpen: true,
      },
    });
  }, []);

  // 关闭弹窗
  const close = useCallback(() => {
    setPopupState(prev => {
      if (prev.config?.onClose) {
        prev.config.onClose();
      }
      return { isOpen: false, config: null };
    });
  }, []);

  // 关闭所有弹窗
  const closeAll = useCallback(() => {
    setPopupState({ isOpen: false, config: null });
  }, []);

  // 更新弹窗配置
  const update = useCallback((config: Partial<PopupConfig>) => {
    setPopupState(prev => ({
      ...prev,
      config: prev.config ? { ...prev.config, ...config } : null,
    }));
  }, []);

  return (
    <PopupContext.Provider value={{ open, close, closeAll, update }}>
      {children}
      {popupState.isOpen && popupState.config && (
        <PopupContainer config={popupState.config} onClose={close} />
      )}
    </PopupContext.Provider>
  );
};

/**
 * 弹窗容器组件
 */
const PopupContainer: React.FC<{ config: PopupConfig; onClose: () => void }> = ({
  config,
  onClose,
}) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          minWidth: '300px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(255,215,0,0.3)',
        }}
      >
        {config.title && (
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #c9a227 0%, #f4d03f 100%)',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <h3 style={{ margin: 0, color: '#1a1a2e' }}>{config.title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#1a1a2e',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: '16px', color: '#fff' }}>{config.component}</div>
      </div>
    </div>
  );
};

/**
 * 使用弹窗管理器
 */
export const usePopupManager = (): PopupManagerInterface => {
  const context = useContext(PopupContext);
  
  if (!context) {
    throw new Error('usePopupManager must be used within a PopupProvider');
  }
  
  return context;
};

/**
 * 快捷打开常用弹窗的 Hook
 */
export const useQuickPopups = () => {
  const { open, close } = usePopupManager();

  const openHelp = useCallback(() => {
    open({
      id: 'help',
      title: '游戏帮助',
      component: <div style={{ padding: '20px', textAlign: 'center' }}>帮助面板开发中...</div>,
    });
  }, [open]);

  const openGift = useCallback(() => {
    open({
      id: 'gift',
      title: '礼品兑换',
      component: <div style={{ padding: '20px', textAlign: 'center' }}>礼品面板开发中...</div>,
    });
  }, [open]);

  const openSignin = useCallback(() => {
    open({
      id: 'signin',
      title: '每日签到',
      component: <div style={{ padding: '20px', textAlign: 'center' }}>签到面板开发中...</div>,
    });
  }, [open]);

  return {
    openHelp,
    openGift,
    openSignin,
    close,
  };
};
