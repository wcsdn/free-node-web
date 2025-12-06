import React from 'react';
import './styles.css';

interface BackdropProps {
  onClick?: () => void;
  zIndex?: number;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick, zIndex = 9998 }) => {
  return (
    <div 
      className="modal-backdrop" 
      onClick={onClick}
      style={{ zIndex }}
    />
  );
};

export default Backdrop;
