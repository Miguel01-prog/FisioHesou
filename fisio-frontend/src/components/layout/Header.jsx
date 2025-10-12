import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoMdClose } from 'react-icons/io';
import { RxExit } from "react-icons/rx";
import { GrTextAlignLeft } from "react-icons/gr";

export default function Header({ isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
    // opcional: persistir estado
    localStorage.setItem('sidebarState', !isCollapsed ? 'collapsed' : 'expanded');
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', current === 'dark' ? 'dark' : '');
    localStorage.setItem('theme', current);
  };

  return (
    <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
       
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <div style={{ fontSize: 13, color: "#3e3a8e"  }}>{user?.name ?? 'Usuario'}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{user?.role}</div>
        </div>
        <button className="btn-cerrar" onClick={handleLogout}><RxExit size={20} color="#3e3a8e"/></button>
      </div>
    </header>
  );
}
