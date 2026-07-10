import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './FisioLayout.css'; // Reuse the standard structural layout css

/**
 * Premium structural layout wrapper for Nutriologa views
 */
export default function NutriologaLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
          {location.pathname !== '/nutriologa' && location.pathname !== '/nutriologa/' && (
            <div className="layout-back-btn-container">
              <button 
                className="back-generic-btn"
                onClick={() => navigate(-1)}
              >
                ⬅ Volver
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
