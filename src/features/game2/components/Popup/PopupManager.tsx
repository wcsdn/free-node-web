/**
 * PopupManager - 弹框管理器
 * 
 * 使用工厂模式统一调度各种类型的弹框
 * 提供全局弹框控制能力
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { ConfirmModal, AlertModal } from './BaseModal';
import type {
  PopupConfig,
  PopupInstance,
  PopupManagerInterface,
  ConfirmPopupData,
  RewardPopupData,
} from './types';
import { PopupKind } from './types';

/** 生成唯一ID */
const generateId = (): string => {
  return `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/** PopupManager 上下文 */
const PopupContext = createContext<PopupManagerInterface | null>(null);

/** 使用 PopupManager 的 hook */
export const usePopupManager = (): PopupManagerInterface => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopupManager must be used within a PopupProvider');
  }
  return context;
};

/** 全局 PopupManager 实例（用于非 React 环境调用） */
let globalPopupManager: PopupManagerInterface | null = null;

/** 设置全局实例 */
export const setGlobalPopupManager = (manager: PopupManagerInterface) => {
  globalPopupManager = manager;
};

/** 获取全局实例 */
export const getGlobalPopupManager = (): PopupManagerInterface | null => {
  return globalPopupManager;
};

/** 弹框内容渲染器类型 */
type PopupRenderer = (config: PopupConfig) => React.ReactNode;

/**
 * 弹框工厂 - 根据类型创建对应的弹框组件
 */
class PopupFactory {
  /** 渲染器注册表 */
  private renderers: Map<PopupKind, PopupRenderer> = new Map();

  constructor() {
    this.registerDefaultRenderers();
  }

  /** 注册默认渲染器 */
  private registerDefaultRenderers() {
    // 确认弹框
    this.register(PopupKind.Confirm, (config) => {
      const data = config.data as ConfirmPopupData;
      return (
        <ConfirmModal
          open={true}
          onClose={config.onClose || (() => {})}
          onConfirm={config.onConfirm || (() => {})}
          title={data?.title}
          message={data?.message}
          confirmText={data?.confirmText}
          cancelText={data?.cancelText}
          confirmVariant={data?.confirmVariant || 'primary'}
          showCancel={data?.showCancel !== false}
          autoClose={data?.autoClose !== false}
        />
      );
    });

    // 提示弹框
    this.register(PopupKind.Alert, (config) => {
      const data = config.data as { title?: string; message: string };
      return (
        <AlertModal
          open={true}
          onClose={config.onClose || (() => {})}
          title={data?.title || '提示'}
          message={data?.message}
        />
      );
    });

    // 奖励弹框
    this.register(PopupKind.Reward, (config) => {
      const data = config.data as RewardPopupData;
      return (
        <ConfirmModal
          open={true}
          onClose={config.onClose || (() => {})}
          onConfirm={config.onConfirm || (() => {})}
          title={data?.title || '奖励'}
          message={
            <div className="popup-reward-content">
              {data?.rewardIcon && <span className="popup-reward-icon">{data.rewardIcon}</span>}
              <div className="popup-reward-info">
                <div className="popup-reward-name">{data?.rewardName || '奖励'}</div>
                {data?.rewardAmount && (
                  <div className="popup-reward-amount">×{data.rewardAmount}</div>
                )}
                {data?.description && (
                  <div className="popup-reward-desc">{data.description}</div>
                )}
              </div>
            </div>
          }
          confirmText={data?.confirmText || '领取'}
          showCancel={false}
        />
      );
    });

    // 资源不足提示
    this.register(PopupKind.ResourceShortage, (config) => {
      const data = config.data as { resourceType?: string; amount?: number };
      return (
        <AlertModal
          open={true}
          onClose={config.onClose || (() => {})}
          title="资源不足"
          message={
            <div className="popup-resource-shortage">
              <p>您的{data?.resourceType || '资源'}不足</p>
              {data?.amount && <p>需要: {data.amount}</p>}
            </div>
          }
        />
      );
    });

    // 通用信息弹框
    this.register(PopupKind.Info, (config) => {
      const data = config.data as { title?: string; content: React.ReactNode; confirmText?: string };
      return (
        <ConfirmModal
          open={true}
          onClose={config.onClose || (() => {})}
          onConfirm={config.onConfirm || (() => {})}
          title={data?.title}
          message={data?.content}
          confirmText={data?.confirmText || '确定'}
          showCancel={false}
        />
      );
    });
  }

  /** 注册渲染器 */
  register(type: PopupKind, renderer: PopupRenderer) {
    this.renderers.set(type, renderer);
  }

  /** 注销渲染器 */
  unregister(type: PopupKind) {
    this.renderers.delete(type);
  }

  /** 获取渲染器 */
  getRenderer(type: PopupKind): PopupRenderer | undefined {
    return this.renderers.get(type);
  }

  /** 渲染弹框 */
  render(config: PopupConfig, id: string): React.ReactNode {
    const renderer = this.renderers.get(config.type);
    if (renderer) {
      return (
        <div key={id} className="popup-factory-wrapper">
          {renderer(config)}
        </div>
      );
    }
    // 默认渲染：显示未知弹框类型
    return (
      <div key={id} className="popup-factory-wrapper">
        <AlertModal
          open={true}
          onClose={config.onClose || (() => {})}
          title="提示"
          message={`未知弹框类型: ${config.type}`}
        />
      </div>
    );
  }
}

/** 弹框工厂单例 */
export const popupFactory = new PopupFactory();

/**
 * PopupProvider - 提供弹框管理能力的 Provider
 */
export interface PopupProviderProps {
  children: React.ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popups, setPopups] = useState<PopupInstance[]>([]);
  const managerRef = useRef<PopupManagerInterface | null>(null);

  // 创建 manager 实例
  const createManager = useCallback((): PopupManagerInterface => {
    const manager: PopupManagerInterface = {
      show: (config: PopupConfig) => {
        const id = generateId();
        const newPopup: PopupInstance = {
          id,
          config: {
            ...config,
            onClose: config.onClose || (() => {}),
          },
        };
        setPopups((prev) => [...prev, newPopup]);
        return id;
      },

      close: (id?: string) => {
        if (id) {
          setPopups((prev) => prev.filter((p) => p.id !== id));
        } else {
          // 关闭最后一个
          setPopups((prev) => prev.slice(0, -1));
        }
      },

      closeAll: () => {
        setPopups([]);
      },

      getActivePopups: () => {
        return [...popups];
      },

      update: (id: string, data: any) => {
        setPopups((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, config: { ...p.config, data } } : p
          )
        );
      },
    };

    managerRef.current = manager;
    setGlobalPopupManager(manager);
    return manager;
  }, [popups]);

  // 初始化 manager
  useEffect(() => {
    createManager();
  }, []);

  // 渲染所有弹框
  const renderPopups = () => {
    return popups.map((popup) =>
      popupFactory.render(popup.config, popup.id)
    );
  };

  return (
    <PopupContext.Provider value={managerRef.current}>
      {children}
      {/* 弹框容器 - 放在 body 最后 */}
      <div className="popup-container">{renderPopups()}</div>
    </PopupContext.Provider>
  );
};

/**
 * 快捷方法 - 无需 hook 直接调用
 */
export const popup = {
  /** 显示确认弹框 */
  confirm: (data: ConfirmPopupData, callbacks?: { onConfirm?: () => void; onClose?: () => void }): string => {
    const manager = getGlobalPopupManager();
    if (manager) {
      return manager.show({
        type: PopupKind.Confirm,
        data,
        onConfirm: callbacks?.onConfirm,
        onClose: callbacks?.onClose,
      });
    }
    console.warn('[PopupManager] Global manager not initialized');
    return '';
  },

  /** 显示提示弹框 */
  alert: (message: string, title?: string): string => {
    const manager = getGlobalPopupManager();
    if (manager) {
      return manager.show({
        type: PopupKind.Alert,
        data: { message, title },
        onClose: () => {},
      });
    }
    console.warn('[PopupManager] Global manager not initialized');
    return '';
  },

  /** 显示奖励弹框 */
  showReward: (data: RewardPopupData, callbacks?: { onConfirm?: () => void }): string => {
    const manager = getGlobalPopupManager();
    if (manager) {
      return manager.show({
        type: PopupKind.Reward,
        data,
        onConfirm: callbacks?.onConfirm,
        onClose: () => {},
      });
    }
    console.warn('[PopupManager] Global manager not initialized');
    return '';
  },

  /** 显示资源不足提示 */
  resourceShortage: (resourceType?: string, amount?: number): string => {
    const manager = getGlobalPopupManager();
    if (manager) {
      return manager.show({
        type: PopupKind.ResourceShortage,
        data: { resourceType, amount },
        onClose: () => {},
      });
    }
    console.warn('[PopupManager] Global manager not initialized');
    return '';
  },

  /** 显示通用信息弹框 */
  showInfo: (title: string, content: React.ReactNode, confirmText?: string): string => {
    const manager = getGlobalPopupManager();
    if (manager) {
      return manager.show({
        type: PopupKind.Info,
        data: { title, content, confirmText },
        onConfirm: () => {},
        onClose: () => {},
      });
    }
    console.warn('[PopupManager] Global manager not initialized');
    return '';
  },

  /** 关闭所有弹框 */
  closeAll: () => {
    const manager = getGlobalPopupManager();
    if (manager) {
      manager.closeAll();
    }
  },
};

export default PopupProvider;
