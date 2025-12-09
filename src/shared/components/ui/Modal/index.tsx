/**
 * Modal 组件
 */

import React, { useEffect } from 'react';
import Backdrop from '../../Backdrop';
import type { ModalProps } from '@/types';
import './styles.css';

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <Backdrop onClick={onClose} zIndex={9998} />
      <div className="modal">
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          <button onClick={onClose} className="modal-close">
            [ X ]
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </>
  );
};
