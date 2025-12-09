/**
 * Input 组件
 */

import React from 'react';
import type { InputProps } from '@/types';
import './styles.css';

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  const inputClasses = [
    'input',
    error && 'input-error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input className={inputClasses} {...props} />
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};
