import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoutes from './PublicRoutes.jsx';
import PrivateRoutes from './PrivateRoutes.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      {/* Páginas de login y registro */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas públicas */}
      <Route path="/*" element={<PublicRoutes />} />

      {/* Rutas privadas */}
      <Route path="/admin/*" element={<PrivateRoutes />} />

      {/* Redirige rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
