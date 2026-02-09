/**
 * 提示框组件
 * 原则：移动端优先，简洁设计
 */
import React, { memo, useEffect } from 'react';

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
      className="fixed z-50 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg border border-slate-700"
      style={{ left: x, top: y }}
    >
      {content || '提示信息'}
    </div>
  );
});

Tips.displayName = 'Tips';

export default Tips;
