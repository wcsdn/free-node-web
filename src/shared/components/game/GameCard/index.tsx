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

export { default as GameCard } from './GameCard';
