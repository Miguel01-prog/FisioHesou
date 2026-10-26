import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      // Si no existe token, el usuario NO está logeado
      if (!storedToken) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const res = await api.get('/auth/me');
        setUser({ name: res.data.name, role: res.data.role, client: res.data.client, signature: res.data.signature });
        localStorage.setItem('user', JSON.stringify({ role: res.data.role, nombre: res.data.name, client: res.data.client, signature: res.data.signature }));
      } catch (err) {
        console.error("Error al autenticar sesión:", err);
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('dataPaciente');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 🏷️ Sincronización automática del título de la pestaña del navegador y favicon
  useEffect(() => {
    document.title = "HESOU";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = "/hesou-logo.svg";
  }, [user]);

  // 🔐 Iniciar sesión
  const login = async (userData, userToken = null) => {
    // 1. Establecer el usuario de forma síncrona para pasar las guardas de ruta de inmediato
    const userObj = { role: userData.role || userData.rol, rol: userData.role || userData.rol, name: userData.name || userData.nombre, nombre: userData.name || userData.nombre, client: userData.client, signature: userData.signature };
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));

    if (userToken) {
      setToken(userToken);
      localStorage.setItem('token', userToken);
    }

    // 2. Cargar los detalles del cliente en segundo plano sin bloquear la redirección
    try {
      const res = await api.get('/auth/me');
      setUser({ name: res.data.name, role: res.data.role, client: res.data.client, signature: res.data.signature });
      localStorage.setItem('user', JSON.stringify({ role: res.data.role, nombre: res.data.name, client: res.data.client, signature: res.data.signature }));
    } catch (err) {
      console.error("Error al cargar perfil de clínica en segundo plano:", err);
    }
  };

  // 🚪 Cerrar sesión
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Error al cerrar sesión en servidor:", err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('dataPaciente');
      sessionStorage.clear();
    }
  };

  // 🔄 Actualizar datos de usuario reactivamente
  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify({
        role: newUser.role,
        nombre: newUser.name,
        client: newUser.client,
        signature: newUser.signature
      }));
      return newUser;
    });
  };

  const value = { user, token, login, logout, updateUser, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook para acceder al contexto fácilmente
export const useAuth = () => useContext(AuthContext);
