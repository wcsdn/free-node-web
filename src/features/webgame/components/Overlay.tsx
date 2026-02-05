/**
 * 遮罩层组件
 */
import React, { memo } from 'react';
import styles from '../styles/jxMain.module.css';

interface OverlayProps {
  show: boolean;
  onClose: () => void;
}

const Overlay: React.FC<OverlayProps> = memo(({ show, onClose }) => {
  if (!show) return null;

  return (
    <div id="overlay" className={styles.overlay} onClick={onClose}></div>
  );
});

Overlay.displayName = 'Overlay';

export default Overlay;
