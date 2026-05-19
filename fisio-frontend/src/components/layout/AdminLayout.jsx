import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarState');
    if (saved === 'collapsed') setIsCollapsed(true);
    if (saved === 'expanded') setIsCollapsed(false);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          marginLeft: isMobile ? '0' : (isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)'),
          transition: 'var(--transition)',
          minWidth: 0
        }}
      >
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <main
          className="main-content"
          style={{
            transition: 'var(--transition)',
            minHeight: 'calc(100vh - var(--header-height))',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
