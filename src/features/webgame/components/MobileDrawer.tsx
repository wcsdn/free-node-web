/**
 * 移动端抽屉组件
 * 用于在移动端显示 LeftPanel 和 RightPanel 的内容
 */
import React from 'react';
import styles from '../styles/mobileDrawer.module.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'left'
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div className={styles.overlay} onClick={onClose} />
      
      {/* 抽屉内容 */}
      <div className={`${styles.drawer} ${styles[position]}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
