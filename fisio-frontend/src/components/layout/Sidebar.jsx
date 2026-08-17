import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api';
import * as Icons from 'react-icons/fi';
import './Sidebar.css';
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiChevronLeft,
  FiClock,
  FiBookOpen,
  FiActivity,
  FiLogOut,
  FiCpu
} from 'react-icons/fi';

/**
 * Super responsive and premium multi-role clinic Sidebar
 */
export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [allModules, setAllModules] = useState([]);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const res = await api.get("/modules");
        setAllModules(res.data.modules || []);
      } catch (err) {
        console.error("Error al cargar módulos en Sidebar:", err);
      }
    };
    loadModules();
  }, []);

  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName] || Icons.FiGrid;
    return <IconComponent />;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItemsByRole = (role) => {
    const clientModules = user?.client?.modules || ["agenda", "pacientes", "bloquear"];
    const patientLabel = user?.client?.patientLabelPlural || "Pacientes";
    const specialistLabel = user?.client?.specialistLabelPlural || "Especialistas";

    switch (role) {
      case 'superadmin':
        return [
          { label: 'Dashboard', icon: <FiGrid />, path: '/admin' },
          { label: 'Negocios SaaS', icon: <FiSettings />, path: '/admin/clinicas' },
          { label: 'Usuarios', icon: <FiUsers />, path: '/admin/users' },
          { label: 'Módulos', icon: <FiCpu />, path: '/admin/modules' }
        ];
      case 'fisioterapeuta':
      case 'nutriologa': {
        const items = [
          { label: 'Dashboard', icon: <FiGrid />, path: `/${role}` }
        ];

        // Mapear módulos dinámicos desde la base de datos
        // Si aún no se cargan de la DB, cargamos los básicos por defecto para evitar parpadeos
        const modulesToMap = allModules.length > 0 ? allModules : [
          { key: "agenda", label: "Citas", path: "agenda", icon: "FiCalendar", active: true, parentKey: null },
          { key: "pacientes", label: patientLabel, path: "pacientes", icon: "FiUsers", active: true, parentKey: null },
          { key: "configuracion", label: "Configuración", path: "#", icon: "FiSettings", active: true, parentKey: null },
          { key: "bloquear", label: "Bloquear días", path: "bloquear", icon: "FiClock", active: true, parentKey: "configuracion" },
          { key: "ejercicios", label: "Ejercicios", path: "ejercicios", icon: "FiActivity", active: true, parentKey: "configuracion" },
          { key: "planes", label: "Planes Alimenticios", path: "planes", icon: "FiActivity", active: true, parentKey: "configuracion" },
          { key: "antecedentes", label: "Antecedentes", path: "antecedentes", icon: "FiBookOpen", active: true, parentKey: "configuracion" }
        ];

        // 1. Separar padres e hijos activos para este cliente
        const parentModules = [];
        const childrenMap = {}; // parentKey -> array de hijos

        modulesToMap.forEach((m) => {
          // El módulo padre contenedor (ej. configuracion) se incluye si está activo globalmente
          if (m.active) {
            if (!m.parentKey) {
              parentModules.push(m);
            } else {
              if (clientModules.includes(m.key)) {
                if (!childrenMap[m.parentKey]) {
                  childrenMap[m.parentKey] = [];
                }
                
                let label = m.label;
                if (m.key === "pacientes") label = patientLabel;

                childrenMap[m.parentKey].push({
                  label,
                  icon: renderIcon(m.icon),
                  path: `/${role}/${m.path}`
                });
              }
            }
          }
        });

        // 2. Construir la navegación principal
        parentModules.forEach((pm) => {
          if (pm.path === "#") {
            const children = childrenMap[pm.key] || [];
            if (children.length > 0) {
              items.push({
                label: pm.label,
                icon: renderIcon(pm.icon),
                path: "#",
                children
              });
            }
          } else {
            if (clientModules.includes(pm.key)) {
              let label = pm.label;
              if (pm.key === "pacientes") label = patientLabel;

              items.push({
                label,
                icon: renderIcon(pm.icon),
                path: `/${role}/${pm.path}`
              });
            }
          }
        });

        return items;
      }
      default:
        return [];
    }
  };

  const menuItems = getNavItemsByRole(user?.role);

  const handleSubmenuToggle = (index, e) => {
    e.preventDefault();
    setActiveSubmenu(activeSubmenu === index ? null : index);
    if (isCollapsed) {
      setIsCollapsed(false); // Expand sidebar when opening submenus
    }
  };

  const handleLinkClick = (path, e) => {
    if (path === '#') {
      e.preventDefault();
    } else {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => {
    if (!path) return false;

    // Dashboard matches exact path
    if (['/admin', '/fisioterapeuta', '/nutriologa'].includes(path)) {
      return location.pathname === path;
    }

    // Keep "Pacientes" highlighted when browsing patient details
    if (path.endsWith('/pacientes') && (
      location.pathname.includes('/paciente') ||
      location.pathname.includes('/historial') ||
      location.pathname.includes('/nota') ||
      location.pathname.includes('/plan')
    )) {
      return true;
    }

    return location.pathname.startsWith(path);
  };

  // Aplicar colores del tema del cliente de forma dinámica
  useEffect(() => {
    const theme = user?.client?.theme;
    if (theme) {
      if (theme.primaryColor) document.documentElement.style.setProperty('--primary', theme.primaryColor);
      if (theme.accentColor) document.documentElement.style.setProperty('--accent', theme.accentColor);
      if (theme.sidebarBg) document.documentElement.style.setProperty('--sidebar-bg-custom', theme.sidebarBg);
    }
  }, [user?.client?.theme]);

  const brandTitle = user?.client?.sidebarName || user?.client?.name || "Hesou";
  const brandSubtitle = user?.client?.sidebarSubtitle || "";
  const sidebarBg = user?.client?.theme?.sidebarBg;
  const titleColor = user?.client?.theme?.titleColor;
  const subtitleColor = user?.client?.theme?.subtitleColor;

  return (
    <>
      {/* 📱 Frosted Glass Overlay for Mobile/iPad drawer */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* 🧭 Main Sidebar */}
      <aside 
        className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          background: sidebarBg || undefined
        }}
      >

        {/* Header - Clinic Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user?.client?.logo ? (
              <img
                src={user.client.logo}
                alt="Logo"
                style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "contain", flexShrink: 0 }}
              />
            ) : (
              <div className="brand-logo-sphere" style={{ background: user?.client?.theme?.primaryColor || undefined, flexShrink: 0 }}>
                <span>{brandTitle.substring(0, 1).toUpperCase()}</span>
              </div>
            )}
            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span className="brand-name" style={{ fontSize: "1.05rem", fontWeight: "700", color: titleColor || "inherit", lineHeight: "1.25" }}>
                  {brandTitle}
                </span>
                {brandSubtitle && (
                  <span style={{ fontSize: "0.725rem", color: subtitleColor || "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {brandSubtitle}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            className="sidebar-collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            <FiChevronLeft className={`toggle-chevron-icon ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-navigation">
          <ul className="sidebar-menu-list">
            {menuItems.map((item, index) => {
              const hasChildren = !!item.children;
              const isSubOpen = activeSubmenu === index;
              const itemActive = isActive(item.path) || (hasChildren && item.children.some(c => isActive(c.path)));

              return (
                <li key={index} className={`menu-list-item ${itemActive ? 'active' : ''}`}>
                  {!hasChildren ? (
                    <Link
                      to={item.path}
                      className="menu-link-anchor"
                      onClick={(e) => handleLinkClick(item.path, e)}
                    >
                      <span className="menu-link-icon">{item.icon}</span>
                      {!isCollapsed && <span className="menu-link-text">{item.label}</span>}
                      {isCollapsed && <span className="menu-tooltip-hover">{item.label}</span>}
                    </Link>
                  ) : (
                    <>
                      <button
                        className={`menu-link-anchor menu-submenu-trigger ${isSubOpen ? 'submenu-expanded' : ''}`}
                        onClick={(e) => handleSubmenuToggle(index, e)}
                      >
                        <span className="menu-link-icon">{item.icon}</span>
                        {!isCollapsed && <span className="menu-link-text">{item.label}</span>}
                        {!isCollapsed && <span className="menu-submenu-caret"></span>}
                        {isCollapsed && <span className="menu-tooltip-hover">{item.label}</span>}
                      </button>

                      {isSubOpen && !isCollapsed && (
                        <ul className="sidebar-submenu-list">
                          {item.children.map((subItem, childIdx) => (
                            <li key={childIdx} className={`submenu-list-item ${isActive(subItem.path) ? 'active' : ''}`}>
                              <Link
                                to={subItem.path}
                                className="submenu-link-anchor"
                                onClick={(e) => handleLinkClick(subItem.path, e)}
                              >
                                <span className="submenu-link-icon">{subItem.icon}</span>
                                <span className="submenu-link-text">{subItem.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Clinic Practitioner Profile 
        <div className="sidebar-footer">
          <div className="practitioner-profile-row">
            <div className="practitioner-avatar-wrapper">
              <div className="practitioner-avatar-fallback">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'HE'}
              </div>
            </div>
            {!isCollapsed && (
              <div className="practitioner-info-block">
                <span className="practitioner-name">{user?.name ?? 'Usuario'}</span>
                <span className="practitioner-specialty">{user?.role ?? 'Personal'}</span>
              </div>
            )}
            {!isCollapsed && (
              <button 
                className="practitioner-logout-btn" 
                title="Cerrar Sesión" 
                aria-label="Cerrar sesión"
                onClick={handleLogout}
              >
                <FiLogOut size={16} />
              </button>
            )}
          </div>
        </div>*/}

      </aside>
    </>
  );
}
