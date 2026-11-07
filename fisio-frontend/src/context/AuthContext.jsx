import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

const AuthContext = createContext();

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos de inactividad
const LAST_ACTIVITY_KEY = 'hesou_last_activity';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);


  const logout = useCallback(async () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('dataPaciente');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.clear();
    api.post('/auth/logout').catch((err) => {
      console.error("Error al cerrar sesión en servidor:", err);
    });
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      // Si no existe token, el usuario NO está logeado
      if (!storedToken) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setLoading(false);
        return;
      }

      // Verificar si ya transcurrieron más de 30 minutos desde la última actividad
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
      if (lastActivity > 0 && Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
        await logout();
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
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
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [logout]);

  // ⏱️ Control de cierre de sesión automático tras 30 minutos de inactividad
  useEffect(() => {
    if (!user && !token) return;

    let lastRecorded = Date.now();
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(lastRecorded));
    }

    const triggerInactivityLogout = () => {
      logout();
      if (
        window.location.pathname !== '/login' &&
        !window.location.pathname.startsWith('/citas/')
      ) {
        window.location.href = '/login';
      }
    };

    const resetTimer = () => {
      const now = Date.now();
      const storedLast = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || now);

      // Si al volver a la pestaña o despertar el equipo ya pasaron 30 min, cerrar sesión de inmediato
      if (now - storedLast >= INACTIVITY_LIMIT_MS) {
        triggerInactivityLogout();
        return;
      }

      // Actualizar timestamp en localStorage (con throttle de 5s para evitar escrituras excesivas)
      if (now - lastRecorded > 5000) {
        lastRecorded = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(triggerInactivityLogout, INACTIVITY_LIMIT_MS);
    };

    const checkExpiration = () => {
      const storedLast = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
      if (storedLast > 0 && Date.now() - storedLast >= INACTIVITY_LIMIT_MS) {
        triggerInactivityLogout();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    window.addEventListener('focus', checkExpiration);
    document.addEventListener('visibilitychange', checkExpiration);

    // Iniciar temporizador e intervalo de verificación (por si el equipo entra en suspensión)
    inactivityTimerRef.current = setTimeout(triggerInactivityLogout, INACTIVITY_LIMIT_MS);
    const intervalId = setInterval(checkExpiration, 30000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener('focus', checkExpiration);
      document.removeEventListener('visibilitychange', checkExpiration);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      clearInterval(intervalId);
    };
  }, [user, token, logout]);

  // 🏷️ Sincronización automática del título de la pestaña del navegador y favicon
  useEffect(() => {
    document.title = "HESOU";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = "/logo_hesou.svg";
  }, [user]);

  // 🔐 Iniciar sesión
  const login = async (userData, userToken = null) => {
    // 1. Establecer el usuario y marca de actividad de forma síncrona
    const userObj = { role: userData.role || userData.rol, rol: userData.role || userData.rol, name: userData.name || userData.nombre, nombre: userData.name || userData.nombre, client: userData.client, signature: userData.signature };
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

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
