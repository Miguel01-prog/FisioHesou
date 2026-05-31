import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/globalStyles.css';
import api from '../../api.js';
import LoadingSpinner from '../../components/layout/LoadingSpinner.jsx';
import { showError } from '../../utils/alerts.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login({ role: res.data.role, name: res.data.name });

      localStorage.setItem("user", JSON.stringify({ rol: res.data.role, nombre: res.data.name }));

      if (res.data.role === 'fisioterapeuta') {
        navigate('/fisioterapeuta');
      } else if (res.data.role === 'nutriologa') {
        navigate('/nutriologa');
      } else if (res.data.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      showError('Error', 'Credenciales incorrectas o error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper-public">
      <div className="auth-card" style={{ maxWidth: '420px', width: '90%' }}>
        <h2 className="text-center mb-1" style={{ color: 'var(--primary)' }}>Bienvenido</h2>
        <p className="text-muted text-center mb-2">Ingresa tus credenciales para continuar</p>

        <form className="form" onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            {loading && <div className="spinner-overlay" style={{ borderRadius: 'var(--radius)' }}><LoadingSpinner /></div>}

            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="input mb-2"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input mb-2"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <button type="submit" className="btn btn-primary w-100" style={{ marginTop: '0.5rem', height: '45px' }} disabled={loading}>
              {loading ? <LoadingSpinner size="small" color="#fff" /> : "Ingresar"}
            </button>
          </div>
        </form>

        <div className="text-center mt-3" style={{ marginTop: '1.5rem' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
