import React from 'react';
import Sidebar from './Sidebar.jsx';

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px' }}>{children}</main>
    </div>
  );
}
