import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = '', fullScreen = false }) => {
  const content = (
    <div className={`spinner-container ${size}`}>
      <div className="spinner-dot-ring">
        <div className="dot-holder dot-1"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-2"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-3"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-4"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-5"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-6"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-7"><div className="ring-dot"></div></div>
        <div className="dot-holder dot-8"><div className="ring-dot"></div></div>
      </div>
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="spinner-fullscreen-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
