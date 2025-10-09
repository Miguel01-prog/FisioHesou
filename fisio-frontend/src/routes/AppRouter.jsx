import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PrivateRoute from './PrivateRoutes.jsx';

// Layouts
import AdminLayout from '../components/layout/AdminLayout';
import FisioLayout from '../components/layout/FisioLayout';
import NutriologaLayout from '../components/layout/NutriologaLayout';

// Páginas
import Dashboard from '../pages/admin/Dashboard';

export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Superadmin */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['superadmin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      />

      {/* Fisioterapeuta */}
      <Route
        path="/fisioterapeuta/*"
        element={
          <PrivateRoute allowedRoles={['fisioterapeuta']}>
            <FisioLayout />
          </PrivateRoute>
        }
      />

      {/* Nutrióloga */}
      <Route
        path="/nutriologa/*"
        element={
          <PrivateRoute allowedRoles={['nutriologa']}>
            <NutriologaLayout />
          </PrivateRoute>
        }
      />

      {/* Ruta no encontrada */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
