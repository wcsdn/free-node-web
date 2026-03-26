/**
 * Toast - 全局提示组件
 * 
 * 功能：
 * - success/error/info/warning 四种类型
 * - 自动消失（3秒）
 * - 支持多个 toast 并存
 * - 手机适配（底部弹出，宽度100%）
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// Toast 容器组件
const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          onClick={() => onRemove(toast.id)}
        >
          <span className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'ℹ'}
            {toast.type === 'warning' && '⚠'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// ToastProvider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++counterRef.current}`;
    const toastItem: ToastItem = { id, type, message };

    setToasts(prev => [...prev, toastItem]);

    // 3秒后自动移除
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast('success', message), [showToast]);
  const error = useCallback((message: string) => showToast('error', message), [showToast]);
  const info = useCallback((message: string) => showToast('info', message), [showToast]);
  const warning = useCallback((message: string) => showToast('warning', message), [showToast]);

  // 注册全局 toast 引用，使非 React 上下文中也可以调用 toast
  useEffect(() => {
    setGlobalToast({ success, error, info, warning });
  }, [success, error, info, warning]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// 静态方法调用方式（全局单例）
let globalToastRef: { success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void; warning: (msg: string) => void } | null = null;

export const setGlobalToast = (toast: typeof globalToastRef) => {
  globalToastRef = toast;
};

export const toast = {
  success: (msg: string) => globalToastRef?.success(msg),
  error: (msg: string) => globalToastRef?.error(msg),
  info: (msg: string) => globalToastRef?.info(msg),
  warning: (msg: string) => globalToastRef?.warning(msg),
};

export default ToastProvider;
