import React, { useEffect, useState, useRef } from 'react';
import './styles.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  
  // 保持 onClose 引用最新
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => onCloseRef.current(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]); // 只依赖 duration

  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';

  return (
    <div className={`toast toast-${type} ${isClosing ? 'toast-closing' : ''}`}>
      <div className="toast-icon">{icon}</div>
      <div className="toast-message">{message}</div>
    </div>
  );
};

export default Toast;
