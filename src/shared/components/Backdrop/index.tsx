import React from 'react';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import './styles.css';

interface BackdropProps {
  onClick?: () => void;
  zIndex?: number;
}

/**
 * Backdrop - 统一遮罩组件
 * 自动处理：
 * 1. 背景滚动锁定（包括移动端）
 * 2. 点击穿透阻止
 * 3. 滚动条宽度补偿
 */
const Backdrop: React.FC<BackdropProps> = ({ onClick, zIndex = 100 }) => {
  // 统一处理背景滚动锁定
  useBodyScrollLock(true);

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClick}
      style={{ zIndex }}
    />
  );
};

export default Backdrop;
