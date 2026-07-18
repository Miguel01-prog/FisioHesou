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
        const storedToken = localStorage.getItem('token');
        if (storedToken) setToken(storedToken);
        const res = await api.get('/auth/me');
        setUser({ name: res.data.name, role: res.data.role, client: res.data.client });
        localStorage.setItem('user', JSON.stringify({ role: res.data.role, nombre: res.data.name, client: res.data.client }));
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);


  // 🔐 Iniciar sesión
  const login = async (userData, userToken = null) => {
    // 1. Establecer el usuario de forma síncrona para pasar las guardas de ruta de inmediato
    setUser(userData);
    localStorage.setItem('user', JSON.stringify({ rol: userData.role, nombre: userData.name })); 

    if (userToken) {
      setToken(userToken);
      localStorage.setItem('token', userToken);
    }

    // 2. Cargar los detalles del cliente en segundo plano sin bloquear la redirección
    try {
      const res = await api.get('/auth/me');
      setUser({ name: res.data.name, role: res.data.role, client: res.data.client });
      localStorage.setItem('user', JSON.stringify({ role: res.data.role, nombre: res.data.name, client: res.data.client }));
    } catch (err) {
      console.error("Error al cargar perfil de clínica en segundo plano:", err);
    }
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
    localStorage.removeItem('token');
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
