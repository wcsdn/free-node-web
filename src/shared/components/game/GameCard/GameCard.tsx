/**
 * GameCard - 通用卡片组件
 * 原则：简洁可复用
 */
import React from 'react';
import styles from './GameCard.module.css';

interface GameCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  children,
  title,
  className = '',
  onClick
}) => {
  const cardClasses = [
    styles.card,
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <div className={styles.title}>
          <h3>{title}</h3>
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default GameCard;
