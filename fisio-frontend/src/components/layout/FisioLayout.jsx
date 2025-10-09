import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx'; // O el sidebar correspondiente a fisioterapeuta
import { Outlet } from 'react-router-dom';

export default function FisioLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
