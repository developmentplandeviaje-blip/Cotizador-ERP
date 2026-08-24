import { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './components/Login';

// Configure default base URL for Axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
axios.defaults.baseURL = API_URL;

// Add authorization header interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_profile');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      
      // Verify token validity by fetching profile
      axios.get('/v1/auth/profile')
        .then(response => {
          const freshUser = response.data.user;
          setUser(freshUser);
          localStorage.setItem('user_profile', JSON.stringify(freshUser));
        })
        .catch(error => {
          console.error('Session expired:', error);
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userProfile) => {
    setUser(userProfile);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/v1/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
        <h3>Cargando sistema...</h3>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Dashboard / Panel view
  const isFreelancer = user.level === 'Freelancer';
  const branding = user.branding;

  return (
    <div className="dashboard-container" style={{
      backgroundColor: isFreelancer && branding?.color_primario ? branding.color_primario : '#0f172a',
      minHeight: '100vh',
      color: '#fff',
      padding: '40px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '40px auto', 
        background: 'rgba(255, 255, 255, 0.05)', 
        padding: '40px', 
        borderRadius: '24px', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        
        {/* Branding header for Freelancer */}
        {isFreelancer && branding && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px' }}>
            <img src={branding.logo_url} alt="Freelancer Logo" style={{ maxHeight: '60px', borderRadius: '8px' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h2 style={{ margin: 0, color: '#fff' }}>{user.first_name} {user.last_name}</h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>RIF: {branding.rif} (Perfil Freelancer)</p>
            </div>
          </div>
        )}

        {!isFreelancer && (
          <h2 style={{ marginBottom: '25px', color: '#fff' }}>Cotizador ERP — Panel de Control</h2>
        )}

        <div style={{ marginBottom: '30px', lineHeight: '1.6' }}>
          <p>Bienvenido, <strong>{user.first_name} {user.last_name}</strong>!</p>
          <p>Tu correo: <strong>{user.email}</strong></p>
          <p>Rol / Nivel: <strong style={{ color: '#ff6a00' }}>{user.level}</strong></p>
        </div>

        <button 
          onClick={handleLogout} 
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
            border: 'none',
            borderRadius: '20px',
            padding: '12px 30px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)',
            fontSize: '15px'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default App;