import React from 'react';
import './Card.css';

/**
 * Premium UI Card component for clinical metrics and content.
 * 
 * @param {string} title - The title of the card
 * @param {string|number} value - Big bold metric value
 * @param {React.ReactNode} icon - Floating icon
 * @param {string} trend - Green or red trend percentage (e.g., '+12%', '-3%')
 * @param {string} trendText - Text accompanying the trend (e.g., 'este mes')
 * @param {string} status - 'primary' | 'success' | 'warning' | 'danger' | 'info' (adds glowing left border)
 * @param {React.ReactNode} action - Extra header actions (e.g. dropdown, edit button)
 */
export default function Card({
  title,
  value,
  icon,
  trend,
  trendText,
  status,
  action,
  children,
  className = '',
  ...props
}) {
  const cardClass = [
    'glass-card',
    'metric-card',
    status ? `card-status-${status}` : '',
    className
  ].filter(Boolean).join(' ');

  const isPositiveTrend = trend && !trend.startsWith('-');

  return (
    <div className={cardClass} {...props}>
      {(title || icon || action) && (
        <div className="card-header-container">
          <div className="card-title-wrapper">
            {icon && <span className={`card-header-icon status-${status || 'primary'}`}>{icon}</span>}
            {title && <h3 className="card-header-title">{title}</h3>}
          </div>
          {action && <div className="card-action-wrapper">{action}</div>}
        </div>
      )}
      
      {value !== undefined && (
        <div className="card-value-container">
          <h2 className="card-value-display">{value}</h2>
        </div>
      )}

      {trend && (
        <div className="card-trend-container">
          <span className={`trend-badge ${isPositiveTrend ? 'trend-up' : 'trend-down'}`}>
            {trend}
          </span>
          {trendText && <span className="trend-description">{trendText}</span>}
        </div>
      )}

      {children && <div className="card-children-content">{children}</div>}
    </div>
  );
}
