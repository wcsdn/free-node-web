/**
 * 遮罩层组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo } from 'react';

interface OverlayProps {
  show: boolean;
  onClose: () => void;
}

const Overlay: React.FC<OverlayProps> = memo(({ show, onClose }) => {
  if (!show) return null;

  return (
    <div 
      id="overlay"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
      onClick={onClose}
    />
  );
});

Overlay.displayName = 'Overlay';

export default Overlay;
