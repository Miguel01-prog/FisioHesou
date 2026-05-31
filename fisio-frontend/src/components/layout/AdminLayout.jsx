import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { Outlet } from 'react-router-dom';
import './FisioLayout.css'; // Reuse the standard structural layout css

/**
 * Premium structural layout wrapper for Admin views
 */
export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout-app-wrapper">
      {/* 🧭 Sidebar (collapsible / mobile drawer) */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* 🖥️ Main Right side content container */}
      <div 
        className={`layout-main-panel ${isCollapsed ? 'sidebar-collapsed-layout' : ''}`}
      >
        {/* 🔝 Floating glass header */}
        <Header 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* 🧱 Dynamic main content body */}
        <main className="layout-content-view">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
