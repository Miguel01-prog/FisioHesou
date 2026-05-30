import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/globalStyles.css';
import api from '../../api.js';
import LoadingSpinner from '../../components/layout/LoadingSpinner.jsx';
import { showError, showSuccess } from '../../utils/alerts.js';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ajustar según la ruta real de registro en tu backend
      await api.post('/auth/register', { name: nombre, email, password, role: 'fisioterapeuta' });
      showSuccess('Éxito', 'Registro completado correctamente. Por favor inicia sesión.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      showError('Error', 'Hubo un problema al registrar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper-public">
      <div className="auth-card" style={{ maxWidth: '420px', width: '90%' }}>
        <h2 className="text-center mb-1" style={{ color: 'var(--primary-color)' }}>Crear Cuenta</h2>
        <p className="text-muted text-center mb-2">Únete a FisioHesou</p>

        <form className="form" onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            {loading && <div className="spinner-overlay" style={{ borderRadius: 'var(--radius)' }}><LoadingSpinner /></div>}
            
            <label htmlFor="nombre" className="form-label">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              className="input mb-2"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              disabled={loading}
            />

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
              {loading ? <LoadingSpinner size="small" color="#fff" /> : "Registrarse"}
            </button>
          </div>
        </form>

        <div className="text-center mt-3" style={{ marginTop: '1.5rem' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
