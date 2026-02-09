/**
 * GameCard - 赛博朋克风格卡片
 */
import React from 'react';
import styles from './GameCard.module.css';

interface GameCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({
  children,
  title,
  className = '',
  onClick
}) => {
  const classes = [
    styles.card,
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default GameCard;
