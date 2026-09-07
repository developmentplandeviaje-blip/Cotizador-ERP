import { useEffect, useState } from 'react';
import axios from 'axios';
import Login from './components/Login';
import MainLayout from './components/layout/MainLayout';
import HotelList from './components/catalog/hotels/HotelList';

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
  const [activeSection, setActiveSection] = useState('hoteles');

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
    setActiveSection('hoteles');
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', background: '#0b1120' }}>
        <h3>Cargando sistema...</h3>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Dashboard preview (Pages 1-2)
  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Panel Principal</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
            Bienvenido, {user.first_name} {user.last_name} ({user.level})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => setActiveSection('hoteles')}>
            Ver Catálogo de Hoteles
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>Meta Anual</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#E87217', fontSize: '1.5rem' }}>USD 112,645.65</h2>
        </div>
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>Total Recibido</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#2563EB', fontSize: '1.5rem' }}>USD 101,325.11</h2>
        </div>
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>Rendimiento</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#15803D', fontSize: '1.5rem' }}>853 Ventas (7.78%)</h2>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout
      activeSection={activeSection}
      onNavigate={(sec) => setActiveSection(sec)}
      onLogout={handleLogout}
      user={user}
    >
      {activeSection === 'hoteles' && <HotelList user={user} />}
      {activeSection === 'dashboard' && renderDashboard()}
      {activeSection !== 'hoteles' && activeSection !== 'dashboard' && (
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
          <h2>Módulo en Desarrollo: {activeSection.toUpperCase()}</h2>
          <p style={{ color: '#94A3B8' }}>Este módulo se conectará en las siguientes épicas del ERP.</p>
          <button className="btn-primary" onClick={() => setActiveSection('hoteles')}>
            Volver al Catálogo de Hoteles
          </button>
        </div>
      )}
    </MainLayout>
  );
}

export default App;