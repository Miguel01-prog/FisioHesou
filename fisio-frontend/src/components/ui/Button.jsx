import React from 'react';
import './Button.css';

/**
 * Premium highly interactive Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - Takes up 100% of container width
 * @param {React.ReactNode} icon - Optional icon node placed before text
 * @param {boolean} loading - Displays a loading spinner
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  const buttonClass = [
    'btn-premium',
    `btn-${variant}`,
    `btn-size-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-content">{children}</span>
    </button>
  );
}
