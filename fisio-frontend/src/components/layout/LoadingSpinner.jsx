import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = 'var(--primary-color)', text = '' }) => {
  return (
    <div className={`spinner-container ${size}`}>
      <div className="spinner" style={{ borderTopColor: color }}></div>
      {text && <span className="spinner-text" style={{ color }}>{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
