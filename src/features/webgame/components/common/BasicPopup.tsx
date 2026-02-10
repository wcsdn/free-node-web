/**
 * 基础弹窗组件
 * 性能优化: 使用 React.memo 减少重渲染
 */
import React, { memo, useCallback } from 'react';

// 弹窗属性接口
interface PopupProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * 基础弹窗组件
 * 
 * @description
 * - 使用 React.memo 避免不必要的重渲染
 * - 使用 useCallback 缓存回调函数
 * - 使用 CSS Modules 替代内联样式
 */
const BasicPopup: React.FC<PopupProps> = memo(({ id, title, children, onClose }) => {
  // 点击遮罩关闭 - 使用 useCallback 缓存
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // 关闭按钮点击处理
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div 
      className="basic-popup-overlay"
      onClick={handleOverlayClick}
    >
      <div 
        id={id} 
        className="basic-popup-container"
      >
        <div className="basic-popup-header">
          <span className="basic-popup-title">{title}</span>
          <button 
            className="basic-popup-close"
            onClick={handleCloseClick}
            aria-label="关闭"
          >
            &times;
          </button>
        </div>
        <div className="basic-popup-body">
          {children}
        </div>
      </div>
    </div>
  );
});

// 显示名称便于调试
BasicPopup.displayName = 'BasicPopup';

export default BasicPopup;

// 导出类型供外部使用
export type { PopupProps };
