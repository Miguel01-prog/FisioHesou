import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/sidebar.css';
import { useAuth } from '../../context/AuthContext.jsx';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (window.innerWidth <= 1024 && window.innerWidth > 768) {
        setCollapsed(true);
        setIsCollapsed(true);
        localStorage.setItem('sidebarState', 'collapsed');
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      const newState = !collapsed;
      setCollapsed(newState);
      setIsCollapsed(newState);
      localStorage.setItem('sidebarState', newState ? 'collapsed' : 'expanded');
    }
  };

  // 👉 Muestra las opciones del sidebar según el rol del usuario
  const getNavItemsByRole = (role) => {
    switch (role) {
      case 'superadmin':
        return [
          { icon: '📊', text: 'Dashboard', path: '/admin', active: true },
          { icon: '👥', text: 'Usuarios', path: '/admin/users' },
          { icon: '📅', text: 'Citas', path: '/calendarioCitas' },
          { icon: '🏋️‍♂️', text: 'Ejercicios', path: '#' },
          { icon: '📄', text: 'Informes', path: '#' },
          { icon: '⚙️', text: 'Configuración', path: '#' },
        ];
      case 'fisioterapeuta':
        return [
          { icon: '📊', text: 'Dashboard', path: '/fisioterapeuta', active: true },
          { icon: '📅', text: 'Citas', path: '/calendarioCitas' },
          { icon: '🏋️‍♂️', text: 'Ejercicios', path: '/ejercicios' },
        ];
      case 'nutriologa':
        return [
          { icon: '📊', text: 'Dashboard', path: '/nutriologa', active: true },
          { icon: '📅', text: 'Citas', path: '/calendarioCitas' },
          { icon: '🥗', text: 'Planes alimenticios', path: '/nutriologa/planes' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItemsByRole(user?.role);

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    isMobile && sidebarOpen ? 'open' : ''
  ].filter(Boolean).join(' ');

  const getRoleLabel = (role) => {
    switch (role) {
      case 'superadmin': return 'Administrador';
      case 'fisioterapeuta': return 'Fisioterapeuta';
      case 'nutriologa': return 'Nutrióloga';
      default: return 'Usuario';
    }
  };

  return (
    <>
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside className={sidebarClasses}>
        <div className="sidebar-header">
          <h2 className="logo">{collapsed ? 'H' : 'Hesou'}</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="user-profile-sidebar">
          <div className="avatar-sidebar">
            <span className="avatar-icon">👤</span>
          </div>
          <div className="user-info-sidebar">
            <span className="user-name-sidebar">{user?.name}</span>
            <span className="user-role-sidebar">{getRoleLabel(user?.role)}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item, index) => (
              <li key={index} data-tooltip={item.text} className={item.active ? 'active' : ''}>
                <Link to={item.path}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {isMobile && !sidebarOpen && (
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      )}
    </>
  );
};

export default Sidebar;
