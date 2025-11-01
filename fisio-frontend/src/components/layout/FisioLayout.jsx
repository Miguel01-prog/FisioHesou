import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx'; 
import Header from './Header.jsx';
import { Outlet } from 'react-router-dom';

export default function NutriologaLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className="main-content"
          style={{marginLeft: isCollapsed ? 'var(--sidebar-width-collapsed)'
              : 'var(--sidebar-width-expanded)',
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
