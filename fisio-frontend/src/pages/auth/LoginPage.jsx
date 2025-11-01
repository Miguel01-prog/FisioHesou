import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import '../../styles/globalStyles.css';
import api from '../../api.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, { role: res.data.role, name: res.data.name });  
      if (res.data.role === 'fisioterapeuta') {
      navigate('/fisioterapeuta');
      console.log("este es el rol: ",res.data.role);
      console.log("este es el name: ",res.data.name);
    } else if (res.data.role === 'nutriologa') {
      navigate('/nutriologa');
    } else if (res.data.role === 'superadmin') {
      navigate('/admin');
      console.log("este es el rol: ",res.data.role);
    } else {
      navigate('/'); // default o página pública
    }
    } catch (error) {
      alert('Error al iniciar sesión');
    }
  };

  return (
    <div className="  auth-wrapper-public">
      <div className="auth-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-2">Iniciar sesión</h2>
        <p className="text-muted text-center mb-2">Accede con tu cuenta</p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="email" className="form-label">Correo electrónico</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password" className="form-label">Contraseña</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="******"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-primary w-100" style={{ marginTop: '1rem' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );


}
