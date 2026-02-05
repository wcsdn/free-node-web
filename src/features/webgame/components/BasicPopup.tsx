/**
 * 基础弹窗组件
 */
import React, { useState, useEffect } from 'react';

interface PopupProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ id, title, children, onClose }) => {
  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="overlay show" 
      style={{ display: 'block', position: 'fixed' }}
      onClick={handleOverlayClick}
    >
      <div 
        id={id} 
        className="popup show"
        style={{ 
          display: 'block', 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1002,
          minWidth: '300px',
          background: '#E9E9E9',
          border: '1px solid #B0B0B0'
        }}
      >
        <div style={{ 
          padding: '10px', 
          borderBottom: '1px solid #B0B0B0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 'bold' }}>{title}</span>
          <a 
            onClick={onClose} 
            style={{ 
              cursor: 'pointer', 
              fontSize: '20px',
              textDecoration: 'none',
              color: '#000'
            }}
          >
            &times;
          </a>
        </div>
        <div className="popupBody" style={{ padding: '10px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Popup;
