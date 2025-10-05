import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import Dashboard from '../pages/admin/Dashboard.jsx';
import UsersPage from '../pages/admin/UsersPage.jsx';

export default function PrivateRoutes() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
      </Routes>
    </AdminLayout>
  );
}
