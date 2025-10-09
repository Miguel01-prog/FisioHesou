import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import '../../styles/login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
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
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Ingresar</button>
    </form>
  );
}
