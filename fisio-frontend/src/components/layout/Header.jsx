import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import { 
  FiMenu, 
  FiBell, 
  FiChevronDown, 
  FiActivity, 
  FiUser, 
  FiKey, 
  FiClock, 
  FiFileText, 
  FiUserPlus, 
  FiInfo, 
  FiCheckCircle,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { RxExit } from "react-icons/rx";
import ModalCambiarContrasena from './ModalCambiarContrasena.jsx';
import api from '../../api';
import { obfuscateId } from '../../utils/utils.js';

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
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const userRole = user?.role || user?.rol || 'fisioterapeuta';

  const fetchNotifications = async () => {
    if (!userRole) return;
    try {
      const { data } = await api.get(`/notifications/${userRole}`);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [user]);

  // Fetch immediately when the bell dropdown is opened
  useEffect(() => {
    if (bellOpen) {
      fetchNotifications();
    }
  }, [bellOpen]);

  // Click outside to close notification menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      await api.delete(`/notifications/${notif._id}`);
      setNotifications(prev => prev.filter((n) => n._id !== notif._id));
      setBellOpen(false);
      if (notif.identificadorPaciente) {
        navigate(`/${userRole}/paciente/${obfuscateId(notif.identificadorPaciente)}`);
      }
    } catch (err) {
      console.error("Error al borrar notificación:", err);
    }
  };

  const handleDismissSingle = async (e, notifId) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notifId}`);
      setNotifications(prev => prev.filter((n) => n._id !== notifId));
    } catch (err) {
      console.error("Error al descartar notificación:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(notifications.map(n => api.delete(`/notifications/${n._id}`)));
      setNotifications([]);
      setBellOpen(false);
    } catch (err) {
      setNotifications([]);
      setBellOpen(false);
    }
  };


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
            return `${parsed.nombres} ${parsed.apellidos || ''}`.trim();
          }
        }
      } catch (e) { }
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
        } catch (e) { }
      }
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      if (patientId) {
        list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${obfuscateId(patientId)}` });
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
        } catch (e) { }
      }
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      if (patientId) {
        list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${obfuscateId(patientId)}` });
      }
      list.push({ label: 'Nueva Nota SOAP', path: location.pathname });
    } else if (page === 'nota-detail' || page === 'nota-detalle') {
      const local = localStorage.getItem("dataPaciente");
      let patientId = '';
      if (local) {
        try {
          const parsed = JSON.parse(local);
          patientId = parsed.identificadorPaciente || parsed._id || '';
        } catch (e) { }
      }
      list.push({ label: 'Pacientes', path: `/${pathParts[0]}/pacientes` });
      if (patientId) {
        list.push({ label: getPatientName(), path: `/${pathParts[0]}/paciente/${obfuscateId(patientId)}` });
      }
      list.push({ label: 'Detalle de Nota SOAP', path: location.pathname });
    } else {
      list.push({ label: page ? page.charAt(0).toUpperCase() + page.slice(1) : 'Resumen' });
    }

    return list;
  };

  const breadcrumbs = getBreadcrumbsList();

  // Helper to render icon for notification type
  const renderNotifIcon = (type) => {
    switch (type) {
      case 'upcoming_appointment':
        return <FiClock size={16} />;
      case 'pending_soap':
      case 'pending_note':
        return <FiFileText size={16} />;
      case 'new_patient':
        return <FiUserPlus size={16} />;
      default:
        return <FiActivity size={16} />;
    }
  };

  const renderNotifTag = (type) => {
    switch (type) {
      case 'upcoming_appointment':
        return <span className="bell-type-tag tag-appointment">Cita Hoy</span>;
      case 'pending_soap':
      case 'pending_note':
        return <span className="bell-type-tag tag-soap">Nota SOAP</span>;
      case 'new_patient':
        return <span className="bell-type-tag tag-patient">Paciente</span>;
      default:
        return <span className="bell-type-tag tag-info">Aviso</span>;
    }
  };

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
        <div className="notifications-bell-dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`header-action-icon-btn ${notifications.length > 0 ? 'has-notifications' : ''}`}
            onClick={() => setBellOpen(!bellOpen)}
            aria-label="Notificaciones"
            style={{ position: 'relative' }}
          >
            <FiBell size={19} />
            {notifications.length > 0 && (
              <span className="bell-badge-count">
                {notifications.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="bell-dropdown-card glass-card">
              
              {/* Dropdown Header */}
              <div className="bell-dropdown-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBell size={16} style={{ color: 'var(--primary)' }} />
                  <span className="bell-dropdown-title">Avisos del Consultorio</span>
                  {notifications.length > 0 && (
                    <span className="bell-count-pill">{notifications.length}</span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button className="bell-clear-btn" onClick={handleClearAll} title="Limpiar todas las notificaciones">
                    Limpiar todo
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <ul className="bell-notifications-list">
                {notifications.length === 0 ? (
                  <div className="bell-empty-state">
                    <FiCheckCircle size={32} style={{ color: 'var(--success, #10b981)', marginBottom: '0.5rem', opacity: 0.85 }} />
                    <p style={{ fontWeight: '700', color: 'var(--text-main)', margin: '0 0 2px 0', fontSize: '0.875rem' }}>
                      Sin notificaciones pendientes
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ¡Todo está al día en tu agenda clínica!
                    </span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <li 
                      key={notif._id} 
                      className={`bell-notification-item notif-type-${notif.type || 'info'}`}
                      onClick={() => handleNotificationClick(notif)}
                      title="Haz clic para abrir el expediente"
                    >
                      <div className="bell-item-icon-wrapper">
                        {renderNotifIcon(notif.type)}
                      </div>

                      <div className="bell-item-content">
                        <div className="bell-item-header-meta">
                          {renderNotifTag(notif.type)}
                          <span className="bell-item-time">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="bell-item-title">
                          {notif.title}
                        </span>
                        <span className="bell-item-desc">
                          {notif.description}
                        </span>
                      </div>

                      <button
                        className="bell-item-dismiss-btn"
                        onClick={(e) => handleDismissSingle(e, notif._id)}
                        title="Descartar notificación"
                        aria-label="Descartar"
                      >
                        <FiX size={14} />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {/* Dropdown Footer */}
              <div className="bell-dropdown-footer">
                <span>Selecciona una notificación para abrir su expediente</span>
              </div>

            </div>
          )}
        </div>


        {/* Practitioner details badge */}
        <div
          className="header-practitioner-profile"
          onClick={() => navigate(`/${userRole}/perfil`)}
          style={{ cursor: 'pointer' }}
          title="Editar mi perfil"
        >
          <div className="practitioner-profile-details">
            <span className="profile-details-name">{user?.name || user?.nombres || 'Usuario'}</span>
            <span className="profile-details-role">{userRole}</span>
          </div>
          <div className="practitioner-avatar-wrapper" style={{ width: 34, height: 34 }}>
            <div className="practitioner-avatar-fallback" style={{ fontSize: '0.8rem' }}>
              {(user?.name || user?.nombres || 'HE').substring(0, 2).toUpperCase()}
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

      {showChangePasswordModal && (
        <ModalCambiarContrasena onClose={() => setShowChangePasswordModal(false)} />
      )}
    </header>
  );
}
