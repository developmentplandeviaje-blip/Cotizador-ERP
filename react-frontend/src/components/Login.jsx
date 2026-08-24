import React, { useState } from 'react';
import axios from 'axios';

const LogoSvg = () => (
  <svg viewBox="0 0 220 60" width="180" height="50" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Map Pin Icon (Orange) */}
    <g transform="translate(5, 5)">
      {/* Outer Pin Pinhead */}
      <path 
        d="M20 0C8.95 0 0 8.95 0 20C0 32 20 42 20 42C20 42 40 32 40 20C40 8.95 31.05 0 20 0Z" 
        fill="#ff6a00" 
      />
      {/* Inner Pin Hole (Dark Blue) */}
      <circle cx="20" cy="18" r="8" fill="#0f172a" />
      {/* Airplane Arc / Orbit */}
      <path 
        d="M-2 25C3 10 32 5 42 16" 
        stroke="#ffffff" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round"
      />
      {/* Small Plane on Arc */}
      <path 
        d="M40 14L43 18L39 19L38 17L35 18L36 16L40 14Z" 
        fill="#ffffff" 
      />
    </g>
    
    {/* Text "PLAN DE VIAJE" */}
    <text 
      x="58" 
      y="26" 
      fill="#ffffff" 
      fontSize="18" 
      fontWeight="800" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      letterSpacing="1.5"
    >
      PLAN DE VIAJE
    </text>
    {/* Text "Más que Viajar" */}
    <text 
      x="75" 
      y="40" 
      fill="#ff6a00" 
      fontSize="9" 
      fontWeight="700" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      letterSpacing="2"
    >
      — Más que Viajar —
    </text>
  </svg>
);

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (!email || !password) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingrese un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      // Call the Laravel backend API endpoint
      const response = await axios.post('/v1/auth/login', {
        email,
        password
      });

      const data = response.data;
      
      // Store token and user information securely
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_profile', JSON.stringify(data.user));

      setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
      
      // Trigger callback to update App state
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 403) {
        setError('Cuenta inhabilitada. Contacte al administrador.');
      } else {
        setError('Error al conectar con el servidor. Intente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo Section */}
        <div className="login-logo">
          <LogoSvg />
        </div>

        {/* Title */}
        <div className="login-title">Inicio de Sesión</div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* User Input */}
          <div className="input-group">
            <label className="input-label" htmlFor="email">Usuario:</label>
            <input
              type="email"
              id="email"
              className="login-input"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="input-group">
            <label className="input-label" htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Iniciar'}
          </button>
        </form>
      </div>
    </div>
  );
}
