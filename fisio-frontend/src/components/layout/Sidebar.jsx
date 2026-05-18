import React, { useState, useEffect, Children } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';
import { useAuth } from '../../context/AuthContext.jsx';
import { IoMdClose } from 'react-icons/io';
import { FaArrowLeftLong } from "react-icons/fa6";
import { FiCalendar} from "react-icons/fi";


const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);
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
          { icon: '🙋', text: 'Pacientes', path: '/fisioterapeuta/pacientes' },
          { icon: "⚙️", text: "Configuración", children: [
            { icon: '⌚', text: "Bloquear días", path: "/fisioterapeuta/bloquear" },
            { icon: '🗒️', text: "Antecedentes", path: "/fisioterapeuta/antecedentes" },
            { icon: '🏋️‍♂️', text: "Ejercicios", path: "/fisioterapeuta/ejercicios" },
          ]
        }
        ];
      case 'nutriologa':
        return [
          { icon: '📊', text: 'Dashboard', path: '/nutriologa' },
          { icon: '📅', text: 'Citas', path: '/nutriologa/agenda' },
          { icon: '🙋', text: 'Pacientes', path: '/nutriologa/pacientes' },
          { icon: '🥗', text: 'Planes alimenticios', path: '/nutriologa/planes' },
          { icon: '⚙️', text: 'Configuracion', path: '/nutriologa/bloquear' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItemsByRole(user?.role);

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    isMobile && sidebarOpen ? 'mobile-open' : ''
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
      
      {isMobile && !sidebarOpen && (
        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(true)}>
          ≡
        </button>
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
            {navItems.map((item, index) => {
            const hasChildren = !!item.children;
            const isOpen = openSubmenu === index;

            return (
            <li 
              key={index}
              data-tooltip={item.text}
              className={isActive(item.path) ? "active" : ""}
            >
              {!hasChildren && (
                <Link to={item.path} className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.text}</span>
                </Link>
              )}
             {hasChildren && (
              <>
                <button
                  type="button"
                  className="submenu-toggle"
                  onClick={() => setOpenSubmenu(isOpen ? null : index)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.text}</span>
                </button>

                {isOpen && (
                  <ul className={`submenu ${isOpen ? "open" : ""}`}>
                    {item.children.map((sub, j) => (
                      <li key={j}>
                        <Link to={sub.path} className="submenu-item">
                          <span className="nav-icon">{sub.icon}</span>
                          <span className="nav-text">{sub.text}</span>
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
      </aside>
    </>
  );
};

export default Sidebar;
