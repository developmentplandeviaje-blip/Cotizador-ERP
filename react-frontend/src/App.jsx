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

// Route metadata dictionary
const routeTitles = {
  dashboard: { parent: 'General', title: 'Dashboard' },
  nueva_cotizacion: { parent: 'Cotizaciones', title: 'Nueva Cotización' },
  ventas_agencia: { parent: 'Ventas', title: 'Agencia' },
  ventas_freelancer: { parent: 'Ventas', title: 'Freelancer' },
  reportes_operativo: { parent: 'Reportes', title: 'Operativo' },
  reportes_comisiones: { parent: 'Reportes', title: 'Comisiones' },
  reportes_ventas: { parent: 'Reportes', title: 'Reporte Ventas' },
  reportes_gastos: { parent: 'Reportes', title: 'Gastos' },
  reportes_cuentas_cobrar: { parent: 'Reportes', title: 'Cuentas por Cobrar' },
  reportes_cuentas_pagar: { parent: 'Reportes', title: 'Cuentas por Pagar' },
  reportes_pagos_entrantes: { parent: 'Reportes', title: 'Pagos Entrantes' },
  reportes_checkin: { parent: 'Reportes', title: 'Check-in' },
  reportes_estado_venta: { parent: 'Reportes', title: 'Estado de Venta' },
  servicios_hoteles: { parent: 'Servicios', title: 'Hoteles' },
  servicios_excursiones: { parent: 'Servicios', title: 'Excursiones' },
  servicios_paquetes: { parent: 'Servicios', title: 'Paquetes' },
  servicios_traslados: { parent: 'Servicios', title: 'Traslados' },
  servicios_vehiculos: { parent: 'Servicios', title: 'Vehículos' },
  servicios_aerolineas: { parent: 'Servicios', title: 'Aerolíneas' },
  servicios_ubicaciones: { parent: 'Servicios', title: 'Ubicaciones' },
  gastos: { parent: 'Finanzas', title: 'Gastos' },
  metodos_pago: { parent: 'Finanzas', title: 'Métodos de pago' },
  usuarios_agencia: { parent: 'Usuarios', title: 'Agencia' },
  usuarios_freelancer: { parent: 'Usuarios', title: 'Freelancer' },
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState('servicios_hoteles');

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
    setActiveRoute('servicios_hoteles');
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

  // Current route information
  const currentMeta = routeTitles[activeRoute] || { parent: 'Módulo', title: activeRoute };

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
          <button className="btn-primary" onClick={() => setActiveRoute('servicios_hoteles')}>
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
      activeRoute={activeRoute}
      onNavigate={(route) => setActiveRoute(route)}
      onLogout={handleLogout}
      user={user}
    >
      {activeRoute === 'servicios_hoteles' && <HotelList user={user} />}
      {activeRoute === 'dashboard' && renderDashboard()}
      
      {activeRoute !== 'servicios_hoteles' && activeRoute !== 'dashboard' && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8125rem', color: '#94A3B8' }}>
            <span>{currentMeta.parent}</span>
            <span>›</span>
            <span style={{ color: '#E87217', fontWeight: '600' }}>{currentMeta.title}</span>
          </div>

          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', color: '#FFFFFF' }}>
            Módulo: {currentMeta.title}
          </h2>

          <p style={{ color: '#94A3B8', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
            Esta sección del sistema está estructurada y conectada a la barra de navegación del ERP. Sus vistas y formularios específicos se habilitarán en las siguientes etapas del proyecto.
          </p>

          <button
            className="btn-primary"
            onClick={() => setActiveRoute('servicios_hoteles')}
            style={{ margin: '0 auto' }}
          >
            Ir al Catálogo de Hoteles
          </button>
        </div>
      )}
    </MainLayout>
  );
}

export default App;