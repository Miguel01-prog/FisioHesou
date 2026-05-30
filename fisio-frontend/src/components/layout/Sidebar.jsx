import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
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
  FiLogOut 
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItemsByRole = (role) => {
    switch (role) {
      case 'superadmin':
        return [
          { label: 'Dashboard', icon: <FiGrid />, path: '/admin' },
          { label: 'Usuarios', icon: <FiUsers />, path: '/admin/users' },
          { label: 'Citas', icon: <FiCalendar />, path: '#' },
          { label: 'Ejercicios', icon: <FiActivity />, path: '#' },
          { label: 'Informes', icon: <FiBookOpen />, path: '#' },
          { label: 'Configuración', icon: <FiSettings />, path: '#' }
        ];
      case 'fisioterapeuta':
        return [
          { label: 'Dashboard', icon: <FiGrid />, path: '/fisioterapeuta' },
          { label: 'Citas', icon: <FiCalendar />, path: '/fisioterapeuta/agenda' },
          { label: 'Pacientes', icon: <FiUsers />, path: '/fisioterapeuta/pacientes' },
          {
            label: 'Configuración',
            icon: <FiSettings />,
            path: '#',
            children: [
              { label: 'Bloquear días', icon: <FiClock />, path: '/fisioterapeuta/bloquear' },
              { label: 'Antecedentes', icon: <FiBookOpen />, path: '/fisioterapeuta/antecedentes' },
              { label: 'Ejercicios', icon: <FiActivity />, path: '/fisioterapeuta/ejercicios' }
            ]
          }
        ];
      case 'nutriologa':
        return [
          { label: 'Dashboard', icon: <FiGrid />, path: '/nutriologa' },
          { label: 'Citas', icon: <FiCalendar />, path: '/nutriologa/agenda' },
          { label: 'Pacientes', icon: <FiUsers />, path: '/nutriologa/pacientes' },
          { label: 'Planes Alimenticios', icon: <FiActivity />, path: '/nutriologa/planes' },
          { label: 'Configuración', icon: <FiSettings />, path: '/nutriologa/bloquear' }
        ];
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
      <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Header - Clinic Branding */}
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper">
            <div className="brand-logo-sphere">
              <span>H</span>
            </div>
            {!isCollapsed && <span className="brand-name">Hesou</span>}
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

        {/* Footer - Clinic Practitioner Profile */}
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
        </div>

      </aside>
    </>
  );
}
