import React from 'react';
import AppRouter from './routes/AppRouter.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/design-system.css';

export default function App() {
  return (
    <AuthProvider>
      <div className="fluid-background"></div>
      <AppRouter />
    </AuthProvider>
  );
}
