/**
 * GameInput - 赛博朋克风格输入框
 */
import React from 'react';
import styles from './GameInput.module.css';

interface GameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  label?: string;
  disabled?: boolean;
}

export const GameInput: React.FC<GameInputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  label,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.input}
      />
    </div>
  );
};

export default GameInput;
