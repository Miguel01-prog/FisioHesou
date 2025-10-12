import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarState');
    if (saved === 'collapsed') setIsCollapsed(true);
    if (saved === 'expanded') setIsCollapsed(false);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
