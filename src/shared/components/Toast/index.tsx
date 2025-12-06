import React, { useEffect } from 'react';
import './styles.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{icon}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        [ X ]
      </button>
    </div>
  );
};

export default Toast;
