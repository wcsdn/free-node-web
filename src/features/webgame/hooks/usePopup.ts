/**
 * 弹窗管理 Hook
 * 统一的弹窗状态管理
 */
import { useState, useCallback, useEffect } from 'react';

// 弹窗类型定义
export interface PopupConfig {
  id: string;
  title?: string;
  component: React.ReactNode;
  onClose?: () => void;
  props?: Record<string, unknown>;
}

export interface PopupState {
  isOpen: boolean;
  config: PopupConfig | null;
}

// 弹窗管理器接口
export interface PopupManagerInterface {
  open: (config: Omit<PopupConfig, 'isOpen'>) => void;
  close: () => void;
  closeAll: () => void;
  update: (config: Partial<PopupConfig>) => void;
}

// 上下文
import { createContext, useContext, useRef, useCallback as useReactCallback } from 'react';

const PopupContext = createContext<PopupManagerInterface | null>(null);

/**
 * 弹窗 Provider
 */
export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const handleOverlayClick = (e: React.MouseEvent) => {
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
          backgroundColor: '#fff',
          borderRadius: '8px',
          minWidth: '300px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {config.title && (
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0 }}>{config.title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: '16px' }}>{config.component}</div>
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
      component: <div>帮助面板内容</div>,
    });
  }, [open]);

  const openGift = useCallback(() => {
    open({
      id: 'gift',
      title: '礼品兑换',
      component: <div>礼品面板内容</div>,
    });
  }, [open]);

  const openSignin = useCallback(() => {
    open({
      id: 'signin',
      title: '每日签到',
      component: <div>签到面板内容</div>,
    });
  }, [open]);

  return {
    openHelp,
    openGift,
    openSignin,
    close,
  };
};

// 导入 React
import React from 'react';
