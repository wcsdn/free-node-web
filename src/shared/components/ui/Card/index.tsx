/**
 * Card 组件
 */

import React from 'react';
import type { CardProps } from '@/types';
import './styles.css';

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  const cardClasses = ['card', className].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-content">{children}</div>
    </div>
  );
};
