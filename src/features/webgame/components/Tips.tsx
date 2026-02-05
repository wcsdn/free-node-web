/**
 * 提示框组件
 */
import React, { memo, useEffect } from 'react';
import styles from '../styles/jxMain.module.css';

interface TipsProps {
  show: boolean;
  onClose: () => void;
  content?: string;
  x?: number;
  y?: number;
}

const Tips: React.FC<TipsProps> = memo(({ show, onClose, content, x = 0, y = 0 }) => {

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div 
      id="tips" 
      className={styles.tips}
      style={{ left: x, top: y }}
    >
      {content || '提示信息'}
    </div>
  );
});

Tips.displayName = 'Tips';

export default Tips;
