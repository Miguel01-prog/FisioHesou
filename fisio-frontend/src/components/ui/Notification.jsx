import React, { useEffect } from 'react';
import './Notification.css';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';

/**
 * Premium floating notification toast
 * @param {string} type - 'success' | 'warning' | 'danger' | 'info'
 * @param {string} title - Bold alert header
 * @param {string} message - Description message
 * @param {number} duration - Auto close duration in ms (default 4000)
 * @param {Function} onClose - Dismiss callback
 */
export default function Notification({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  id
}) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, id]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <FiCheckCircle size={20} />;
      case 'warning': return <FiAlertTriangle size={20} />;
      case 'danger': return <FiXCircle size={20} />;
      case 'info':
      default: return <FiInfo size={20} />;
    }
  };

  return (
    <div className={`notification-toast toast-${type} glass-card`}>
      <div className="toast-icon-side">
        {getIcon()}
      </div>
      <div className="toast-body-side">
        {title && <h4 className="toast-header-title">{title}</h4>}
        {message && <p className="toast-message-text">{message}</p>}
      </div>
      {onClose && (
        <button className="toast-close-button" onClick={() => onClose(id)} aria-label="Cerrar">
          <FiX size={16} />
        </button>
      )}
      <div className="toast-progress-bar" style={{ animationDuration: `${duration}ms` }}></div>
    </div>
  );
}
