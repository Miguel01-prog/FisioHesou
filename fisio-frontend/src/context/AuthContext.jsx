import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser({ name: res.data.name, role: res.data.role });
        localStorage.setItem('user', JSON.stringify({ role: res.data.role, nombre: res.data.name }));
      } catch (err) {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);


  // 🔐 Iniciar sesión
  const login = (userData) => {
    // The backend already set the token in HttpOnly cookie
    setUser(userData);
    localStorage.setItem('user', JSON.stringify({ rol: userData.role, nombre: userData.name })); 
  };

  // 🚪 Cerrar sesión
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = { user, token, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook para acceder al contexto fácilmente
export const useAuth = () => useContext(AuthContext);
