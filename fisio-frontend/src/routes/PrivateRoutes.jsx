// src/routes/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Si hay restricción de roles, la validamos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />; // O a una página de "no autorizado"
  }

  return children;
}
