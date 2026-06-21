import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import { FiMenu, FiBell, FiChevronDown, FiActivity, FiUser } from 'react-icons/fi';
import { RxExit } from "react-icons/rx";

export default function Header({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bellOpen, setBellOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return { parent: 'Clínica', current: 'Dashboard' };
    }
    
    const parent = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : 'Personal';
    const current = pathParts[1] ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) : 'Resumen';
    return { parent, current };
  };

  const { parent, current } = getBreadcrumbs();

  return (
    <header className="header-container">
      {/* 1. Left Block: Mobile hamburger & breadcrumbs */}
      <div className="header-left-block">
        <button 
          className="mobile-hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menú"
        >
          <FiMenu size={20} />
        </button>

        <div className="header-breadcrumbs">
          <span className="breadcrumb-parent">{parent}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">{current}</span>
        </div>
      </div>

      {/* 2. Right Block: Notification Bell & Profile Controls */}
      <div className="header-right-block">
        
        {/* Floating Bell Trigger */}
        <div className="notifications-bell-dropdown-wrapper">
          <button 
            className="header-action-icon-btn" 
            onClick={() => setBellOpen(!bellOpen)}
            aria-label="Notificaciones"
          >
            <FiBell size={18} />
          </button>

          {bellOpen && (
            <div className="bell-dropdown-card glass-card">
              <div className="bell-dropdown-header">
                <span className="bell-dropdown-title">Avisos del Consultorio</span>
                <button className="bell-clear-btn" onClick={() => setBellOpen(false)}>Cerrar</button>
              </div>
              <ul className="bell-notifications-list">
                <li className="bell-notification-item">
                  <div className="bell-item-icon-wrapper">
                    <FiActivity size={14} />
                  </div>
                  <div className="bell-item-content">
                    <span className="bell-item-title">Panel Actualizado</span>
                    <span className="bell-item-desc">Se cargó el nuevo sistema de diseño premium HSL.</span>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Practitioner details badge */}
        <div className="header-practitioner-profile">
          <div className="practitioner-profile-details">
            <span className="profile-details-name">{user?.name ?? 'Usuario'}</span>
            <span className="profile-details-role">{user?.role ?? 'Practicante'}</span>
          </div>
          <div className="practitioner-avatar-wrapper" style={{ width: 34, height: 34 }}>
            <div className="practitioner-avatar-fallback" style={{ fontSize: '0.8rem' }}>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'HE'}
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <button 
          className="header-action-icon-btn" 
          onClick={handleLogout}
          title="Cerrar Sesión"
          aria-label="Cerrar sesión"
          style={{ borderColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}
        >
          <RxExit size={18} />
        </button>

      </div>
    </header>
  );
}
