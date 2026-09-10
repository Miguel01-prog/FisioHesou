// src/routes/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/layout/LoadingSpinner';

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role || user?.rol;

  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    const defaultRedirect = 
      userRole === 'fisioterapeuta' ? '/fisioterapeuta' :
      userRole === 'nutriologa' ? '/nutriologa' :
      userRole === 'superadmin' ? '/admin' : '/login';

    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
}
