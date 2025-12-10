/**
 * LazyRabbit - 慵懒白兔组件
 * 可复用的 SVG 兔子图标
 */

import React from 'react';
import './styles.css';

interface LazyRabbitProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LazyRabbit: React.FC<LazyRabbitProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: { width: 28, height: 22 },
    md: { width: 42, height: 32 },
    lg: { width: 56, height: 44 },
  };

  const { width, height } = sizeMap[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 70"
      fill="none"
      className={`lazy-rabbit lazy-rabbit-${size} ${className}`}
    >
      <defs>
        <filter id="rabbitGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* 左耳 - 耷拉着，往左上移动 */}
      <ellipse
        cx="15"
        cy="11"
        rx="6"
        ry="16"
        fill="rgba(255, 255, 255, 0.9)"
        stroke="rgba(0, 255, 65, 0.6)"
        strokeWidth="1"
        transform="rotate(-35 15 11)"
        filter="url(#rabbitGlow)"
      />
      {/* 右耳 - 竖起一点 */}
      <ellipse
        cx="45"
        cy="12"
        rx="5"
        ry="14"
        fill="rgba(255, 255, 255, 0.9)"
        stroke="rgba(0, 255, 65, 0.6)"
        strokeWidth="1"
        transform="rotate(10 45 12)"
        filter="url(#rabbitGlow)"
      />
      {/* 身体 - 趴着的椭圆 */}
      <ellipse
        cx="55"
        cy="50"
        rx="35"
        ry="18"
        fill="rgba(255, 255, 255, 0.95)"
        stroke="rgba(0, 255, 65, 0.5)"
        strokeWidth="1"
        filter="url(#rabbitGlow)"
      />
      {/* 前爪 - 左 */}
      <ellipse
        cx="28"
        cy="62"
        rx="8"
        ry="4"
        fill="rgba(255, 255, 255, 0.9)"
        stroke="rgba(0, 255, 65, 0.4)"
        strokeWidth="1"
        transform="rotate(-15 28 62)"
        filter="url(#rabbitGlow)"
      />
      {/* 前爪 - 右 */}
      <ellipse
        cx="45"
        cy="64"
        rx="8"
        ry="4"
        fill="rgba(255, 255, 255, 0.9)"
        stroke="rgba(0, 255, 65, 0.4)"
        strokeWidth="1"
        transform="rotate(10 45 64)"
        filter="url(#rabbitGlow)"
      />
      {/* 头 */}
      <ellipse
        cx="30"
        cy="40"
        rx="18"
        ry="15"
        fill="rgba(255, 255, 255, 0.95)"
        stroke="rgba(0, 255, 65, 0.5)"
        strokeWidth="1"
        filter="url(#rabbitGlow)"
      />
      {/* 左眼 - 眯着的红色 */}
      <path
        d="M 19 37 Q 22 39 25 37"
        stroke="#ff4444"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* 右眼 - 爱心 */}
      <path
        d="M 38 36 L 36.5 34.5 Q 35 33 33.5 34.5 Q 32 36 33.5 37.5 L 38 42 L 42.5 37.5 Q 44 36 42.5 34.5 Q 41 33 39.5 34.5 Z"
        fill="#ff4444"
        stroke="none"
      />
      {/* 鼻子 */}
      <ellipse cx="30" cy="45" rx="2" ry="1.5" fill="#ffcccc" />
      {/* 后腿 */}
      <ellipse
        cx="78"
        cy="63"
        rx="10"
        ry="6"
        fill="rgba(255, 255, 255, 0.9)"
        stroke="rgba(0, 255, 65, 0.4)"
        strokeWidth="1"
        transform="rotate(155 78 63)"
        filter="url(#rabbitGlow)"
      />
      {/* 尾巴 */}
      <circle
        cx="89"
        cy="44"
        r="5"
        fill="rgba(255, 255, 255, 0.9)"
        stroke="rgba(0, 255, 65, 0.4)"
        strokeWidth="1"
      />
    </svg>
  );
};

export default LazyRabbit;
