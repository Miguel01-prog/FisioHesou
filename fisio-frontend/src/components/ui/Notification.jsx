import React, { useEffect } from 'react';
import './Notification.css';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';

/**
 * Floating toast notification component with glassmorphism design
 * @param {string} type - 'success' | 'warning' | 'danger' | 'info'
 * @param {string} title - Alert header
 * @param {string} message - Description message
 * @param {number} duration - Auto close duration in ms (default 4000)
 * @param {Function} onClose - Dismiss callback
 * @param {string|number} id - Unique identifier
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
      case 'success': return <FiCheckCircle size={22} />;
      case 'warning': return <FiAlertTriangle size={22} />;
      case 'danger':  return <FiXCircle size={22} />;
      case 'info':
      default:        return <FiInfo size={22} />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'success': return 'Éxito';
      case 'warning': return 'Atención';
      case 'danger':  return 'Alerta';
      case 'info':
      default:        return 'Aviso';
    }
  };

  return (
    <div className={`notification-toast toast-${type}`}>
      <div className="toast-icon-side">
        {getIcon()}
      </div>
      <div className="toast-body-side">
        <div className="toast-header-row">
          <span className="toast-type-pill">{getTypeLabel()}</span>
          {title && <h4 className="toast-header-title">{title}</h4>}
        </div>
        {message && <p className="toast-message-text">{message}</p>}
      </div>
      {onClose && (
        <button 
          className="toast-close-button" 
          onClick={() => onClose(id)} 
          aria-label="Cerrar notificación"
          title="Cerrar"
        >
          <FiX size={15} />
        </button>
      )}
      {duration > 0 && (
        <div className="toast-progress-bar" style={{ animationDuration: `${duration}ms` }}></div>
      )}
    </div>
  );
}

