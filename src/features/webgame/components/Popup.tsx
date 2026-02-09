/**
 * 简单弹窗组件
 */
import React, { useState } from 'react';

declare const HidePopUp: () => void;

interface PopupProps {
  id?: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'custom';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ id, type = 'info', title, message, children, onClose }) => {
  // 点击遮罩层关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 渲染不同类型的内容
  const renderContent = () => {
    if (children) return children;
    
    const icons: Record<string, string> = {
      info: '💬',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    };

    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        minWidth: '200px'
      }}>
        {type !== 'custom' && (
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>
            {icons[type] || '💬'}
          </div>
        )}
        {message && (
          <div style={{ 
            color: '#000',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            {message}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      id={id}
      className="popup-overlay"
      onClick={handleOverlayClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1001,
      }}
    >
      <div 
        className="popup"
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth: type === 'custom' ? '90vw' : '400px',
          width: type === 'custom' ? 'auto' : '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 标题栏 */}
        {title && (
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: type === 'custom' ? 'transparent' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: type === 'custom' ? '#333' : '#fff',
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: type === 'custom' ? '#999' : '#fff',
                opacity: 0.8,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* 内容区 */}
        <div style={{
          padding: type === 'custom' ? 0 : '20px',
          overflow: 'auto',
          flex: 1,
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// 弹窗管理器
export const usePopup = () => {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const showPopup = (id: string) => {
    setActivePopup(id);
  };

  const hidePopup = () => {
    setActivePopup(null);
  };

  return { activePopup, showPopup, hidePopup };
};

export default Popup;
