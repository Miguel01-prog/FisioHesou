import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import { FiMenu, FiBell, FiChevronDown, FiActivity, FiUser, FiKey } from 'react-icons/fi';
import { RxExit } from "react-icons/rx";
import ModalCambiarContrasena from './ModalCambiarContrasena.jsx';

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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBreadcrumbsList = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const list = [];

    if (pathParts.length === 0) {
      return [{ label: 'Clínica' }, { label: 'Dashboard' }];
    }

    // Role
    const role = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : 'Personal';
    list.push({ label: role, path: `/${pathParts[0]}` });

    const page = pathParts[1];

    const getPatientName = () => {
      try {
        const local = localStorage.getItem("dataPaciente");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && (parsed.nombres || parsed.apellidos)) {
            return `${parsed.nombres} ${parsed.apellidos}`;
          }
        }
      } catch (e) {}
      return "Paciente";
    };

    if (page === 'pacientes') {
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
    } else if (page === 'paciente') {
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      list.push({ label: getPatientName(), path: location.pathname });
    } else if (page === 'planes-paciente') {
      const id = pathParts[2];
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${id}` });
      list.push({ label: 'Planes', path: location.pathname });
    } else if (page === 'crear-plan') {
      const id = pathParts[2];
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${id}` });
      list.push({ label: 'Crear Plan', path: location.pathname });
    } else if (page === 'editar-plan') {
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      list.push({ label: getPatientName(), path: null });
      list.push({ label: 'Editar Plan', path: location.pathname });
    } else if (page === 'plan-documento') {
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      list.push({ label: getPatientName(), path: null });
      list.push({ label: 'Plan PDF', path: location.pathname });
    } else if (page === 'creacion-historial') {
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      list.push({ label: getPatientName(), path: null });
      list.push({ label: 'Crear Historial', path: location.pathname });
    } else if (page === 'historial-detalle') {
      const local = localStorage.getItem("dataPaciente");
      let patientId = '';
      if (local) {
        try {
          const parsed = JSON.parse(local);
          patientId = parsed.identificadorPaciente || parsed._id || '';
        } catch (e) {}
      }
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      if (patientId) {
        list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${patientId}` });
      } else {
        list.push({ label: getPatientName(), path: null });
      }
      list.push({ label: 'Historial', path: location.pathname });
    } else if (page === 'notas') {
      const local = localStorage.getItem("dataPaciente");
      let patientId = '';
      if (local) {
        try {
          const parsed = JSON.parse(local);
          patientId = parsed.identificadorPaciente || parsed._id || '';
        } catch (e) {}
      }
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      if (patientId) {
        list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${patientId}` });
      }
      list.push({ label: 'Nueva Nota SOAP', path: location.pathname });
    } else if (page === 'nota-detail' || page === 'nota-detalle') {
      const local = localStorage.getItem("dataPaciente");
      let patientId = '';
      if (local) {
        try {
          const parsed = JSON.parse(local);
          patientId = parsed.identificadorPaciente || parsed._id || '';
        } catch (e) {}
      }
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      if (patientId) {
        list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${patientId}` });
      }
      list.push({ label: 'Detalle de Nota SOAP', path: location.pathname });
    } else {
      list.push({ label: page ? page.charAt(0).toUpperCase() + page.slice(1) : 'Resumen' });
    }

    return list;
  };

  const breadcrumbs = getBreadcrumbsList();

  return (
    <header className="header-container">
      {/* 1. Left Block: Mobile hamburger, back button & breadcrumbs */}
      <div className="header-left-block">
        <button 
          className="mobile-hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menú"
        >
          <FiMenu size={20} />
        </button>

        <div className="header-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="breadcrumb-divider">/</span>}
              {crumb.path && idx < breadcrumbs.length - 1 ? (
                <span 
                  className="breadcrumb-parent" 
                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                  onClick={() => navigate(crumb.path)}
                >
                  {crumb.label}
                </span>
              ) : (
                <span className={idx === breadcrumbs.length - 1 ? "breadcrumb-current" : "breadcrumb-parent"}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
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

        {/* Change Password Button */}
        <button 
          className="header-action-icon-btn" 
          onClick={() => setShowChangePasswordModal(true)}
          title="Cambiar Contraseña"
          aria-label="Cambiar contraseña"
          style={{ marginRight: '8px', borderColor: 'rgba(94, 80, 161, 0.15)', color: 'var(--primary)' }}
        >
          <FiKey size={18} />
        </button>

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

      {showChangePasswordModal && (
        <ModalCambiarContrasena onClose={() => setShowChangePasswordModal(false)} />
      )}
    </header>
  );
}
