import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';
import { useAuth } from '../../context/AuthContext.jsx';
import { IoMdClose } from 'react-icons/io';
import { FaArrowLeftLong } from "react-icons/fa6";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (window.innerWidth <= 1020 && window.innerWidth > 768) {
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

  const getNavItemsByRole = (role) => {
    switch (role) {
      case 'superadmin':
        return [
          { icon: '📊', text: 'Dashboard', path: '/admin' },
          { icon: '👥', text: 'Usuarios', path: '/admin/users' },
          { icon: '📅', text: 'Citas', path: '/calendarioCitas' },
          { icon: '🏋️‍♂️', text: 'Ejercicios', path: '#' },
          { icon: '📄', text: 'Informes', path: '#' },
          { icon: '⚙️', text: 'Configuración', path: 'bloquear' },
        ];
      case 'fisioterapeuta':
        return [
          { icon: '📊', text: 'Dashboard', path: '/fisioterapeuta' },
          { icon: '📅', text: 'Citas', path: '/fisioterapeuta/agenda' },
          { icon: '🏋️‍♂️', text: 'Ejercicios', path: '/ejercicios' },
          { icon: '🔒', text: 'Bloquear horarios', path: '/fisioterapeuta/bloquear' }
        ];
      case 'nutriologa':
        return [
          { icon: '📊', text: 'Dashboard', path: '/nutriologa' },
          { icon: '📅', text: 'Citas', path: '/nutriologa/agenda' },
          { icon: '🥗', text: 'Planes alimenticios', path: '/nutriologa/planes' },
          { icon: '🔒', text: 'Bloquear horarios', path: '/nutriologa/bloquear' }
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

  // Función robusta para resaltar item activo
  const isActive = (path) => {
    // Dashboard solo se activa en su ruta exacta
    if (['/admin', '/fisioterapeuta', '/nutriologa'].includes(path)) {
      return location.pathname === path;
    }
    // Otros items se activan si la ruta actual empieza con el path
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={sidebarClasses}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="logo">{collapsed ? '' : 'Hesou'}</h2>
          <button className={`btn toggle-btn ${collapsed ? 'collapsed' : 'expanded'}`} onClick={toggleSidebar}
            aria-label="Toggle sidebar">
            {isMobile
              ? (sidebarOpen ? <IoMdClose size={20}/> : <FaArrowLeftLong size={20} color="#3e3a8e"/>)
              : (collapsed
                  ? <h3 className="logo" style={{ marginRight: '7px', fontSize: '24px', color: '#3e3a8e', fontWeight: 'bold', lineHeight: 1 }}>H</h3>
                  : <FaArrowLeftLong size={20} color="#3e3a8e"/>
                )
            }
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item, index) => (
              <li
                key={index}
                data-tooltip={item.text}
                className={isActive(item.path) ? 'active' : ''}
              >
                <Link to={item.path}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
