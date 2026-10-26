import { useEffect, useState } from 'react';
import ToastContainer from './components/common/ToastContainer';
import axios from 'axios';
import Login from './components/Login';
import MainLayout from './components/layout/MainLayout';
import HotelList from './components/catalog/hotels/HotelList';
import UbicacionList from './components/catalog/ubicaciones/UbicacionList';
import ExcursionList from './components/catalog/excursiones/ExcursionList';
import PaqueteList from './components/catalog/paquetes/PaqueteList';
import VehiculoList from './components/catalog/vehiculos/VehiculoList';
import TrasladoList from './components/catalog/traslados/TrasladoList';
import AerolineaList from './components/catalog/aerolineas/AerolineaList';
import UserAgenciaList from './components/users/agencia/UserAgenciaList';
import UserFreelancerList from './components/users/freelancer/UserFreelancerList';
import UserAliadoList from './components/users/aliados/UserAliadoList';
import MetodoPagoList from './components/finance/metodos_pago/MetodoPagoList';
import NuevaCotizacion from './components/cotizacion/NuevaCotizacion';
import RegistroCotizaciones from './components/cotizacion/RegistroCotizaciones';

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
  ventas_cotizaciones: { parent: 'Ventas', title: 'Registro de Cotizaciones' },
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
  usuarios_aliados: { parent: 'Usuarios', title: 'Aliados' },
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRouteState] = useState(() => {
    return window.location.hash ? window.location.hash.substring(1) : 'dashboard';
  });

  const [hasVisitedCotizador, setHasVisitedCotizador] = useState(() => {
    try {
      const hash = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
      if (hash === 'nueva_cotizacion') return true;
      const saved = localStorage.getItem('cotizador_open_tabs');
      if (saved) return true;
    } catch {}
    return false;
  });

  useEffect(() => {
    if (activeRoute === 'nueva_cotizacion') {
      setHasVisitedCotizador(true);
    }
  }, [activeRoute]);

  const setActiveRoute = (route) => {
    window.location.hash = route;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveRouteState(hash);
      } else {
        setActiveRouteState('dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Validaciones y límites globales de caracteres y formatos según contexto
  useEffect(() => {
    const handleGlobalInputRules = (e) => {
      const target = e.target;
      if (!target || !target.tagName) return;

      const tagName = target.tagName.toUpperCase();
      const type = (target.type || '').toLowerCase();
      const placeholder = (target.placeholder || '').toLowerCase();
      const name = (target.name || '').toLowerCase();
      const id = (target.id || '').toLowerCase();

      // 1. Inputs tipo number (límite de 3 dígitos enteros)
      if (tagName === 'INPUT' && type === 'number') {
        const step = target.getAttribute('step');
        const hasDecimals = step && (step === 'any' || step.includes('.'));
        if (!hasDecimals && target.value && target.value.length > 3) {
          target.value = target.value.slice(0, 3);
        }
      }

      // 2. Input de Email: antes de '@' máx. 30 chars, después de '.' máx. 4 chars
      else if (tagName === 'INPUT' && (type === 'email' || name.includes('correo') || placeholder.includes('correo') || placeholder.includes('@'))) {
        let val = target.value;
        if (val.includes('@')) {
          const atIndex = val.indexOf('@');
          let userPart = val.slice(0, atIndex);
          let domainPart = val.slice(atIndex + 1);

          if (userPart.length > 30) userPart = userPart.slice(0, 30);
          domainPart = domainPart.replace(/@/g, '');

          if (domainPart.includes('.')) {
            const lastDotIndex = domainPart.lastIndexOf('.');
            let preDot = domainPart.slice(0, lastDotIndex);
            let ext = domainPart.slice(lastDotIndex + 1);
            if (ext.length > 4) ext = ext.slice(0, 4);
            domainPart = preDot + '.' + ext;
          }
          val = userPart + '@' + domainPart;
        } else {
          if (val.length > 30) val = val.slice(0, 30);
        }
        if (val.length > 50) val = val.slice(0, 50);
        if (target.value !== val) target.value = val;
      }

      // 3. Teléfono: máx. 15 dígitos, solo números y signo '+'
      else if (tagName === 'INPUT' && (type === 'tel' || name.includes('telefono') || id.includes('telefono') || placeholder.includes('telefono') || placeholder.includes('+58'))) {
        let val = target.value.replace(/[^0-9+]/g, '');
        if (val.includes('+')) {
          const hasLeadingPlus = val.startsWith('+');
          val = (hasLeadingPlus ? '+' : '') + val.replace(/\+/g, '');
        }
        val = val.slice(0, 15);
        if (target.value !== val) target.value = val;
      }

      // 4. Cédula / Documento: máx. 12 dígitos y solo números
      else if (tagName === 'INPUT' && (name.includes('documento') || name.includes('cedula') || id.includes('documento') || id.includes('cedula') || placeholder.includes('cédula') || placeholder.includes('cedula') || placeholder.includes('documento'))) {
        let val = target.value.replace(/\D/g, '').slice(0, 12);
        if (target.value !== val) target.value = val;
      }

      // 5. Código de Referido: máx. 12 caracteres y acepta '-' después de los primeros 3 caracteres
      else if (tagName === 'INPUT' && (name.includes('referido') || id.includes('referido') || placeholder.includes('referido') || placeholder.includes('emb-') || placeholder.includes('ref-'))) {
        let val = target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        let prefix = val.slice(0, 3).replace(/-/g, '');
        let rest = val.slice(prefix.length);
        let combined = (prefix + rest).slice(0, 12);
        if (target.value !== combined) target.value = combined;
      }

      // 6. Límites generales de texto de 50 a 3500 según contexto
      else if (tagName === 'INPUT' && type === 'text') {
        const currentMax = target.maxLength > 0 ? target.maxLength : 255;
        const clampedMax = Math.min(3500, Math.max(50, currentMax));
        if (target.value && target.value.length > clampedMax) {
          target.value = target.value.slice(0, clampedMax);
        }
      } else if (tagName === 'TEXTAREA') {
        const currentMax = target.maxLength > 0 ? target.maxLength : 3500;
        const clampedMax = Math.min(3500, Math.max(50, currentMax));
        if (target.value && target.value.length > clampedMax) {
          target.value = target.value.slice(0, clampedMax);
        }
      }
    };

    document.addEventListener('input', handleGlobalInputRules, true);
    return () => {
      document.removeEventListener('input', handleGlobalInputRules, true);
    };
  }, []);;

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
    setActiveRoute('dashboard');
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
      {activeRoute === 'servicios_ubicaciones' && <UbicacionList user={user} />}
      {activeRoute === 'servicios_excursiones' && <ExcursionList user={user} />}
      {activeRoute === 'servicios_paquetes' && <PaqueteList user={user} />}
      {activeRoute === 'servicios_vehiculos' && <VehiculoList user={user} />}
      {activeRoute === 'servicios_traslados' && <TrasladoList user={user} />}
      {activeRoute === 'servicios_aerolineas' && <AerolineaList user={user} />}
      {activeRoute === 'usuarios_agencia' && <UserAgenciaList user={user} />}
      {activeRoute === 'usuarios_freelancer' && <UserFreelancerList user={user} />}
      {activeRoute === 'usuarios_aliados' && <UserAliadoList user={user} />}
      {activeRoute === 'metodos_pago' && <MetodoPagoList user={user} />}
      {hasVisitedCotizador && (
        <div style={{ display: activeRoute === 'nueva_cotizacion' ? 'block' : 'none', width: '100%' }}>
          <NuevaCotizacion user={user} />
        </div>
      )}
      {activeRoute === 'ventas_cotizaciones' && <RegistroCotizaciones user={user} onNuevaCotizacion={() => setActiveRoute('nueva_cotizacion')} />}
      {activeRoute === 'dashboard' && renderDashboard()}

      {activeRoute !== 'servicios_hoteles' && activeRoute !== 'servicios_ubicaciones' && activeRoute !== 'servicios_excursiones' && activeRoute !== 'servicios_paquetes' && activeRoute !== 'servicios_vehiculos' && activeRoute !== 'servicios_traslados' && activeRoute !== 'servicios_aerolineas' && activeRoute !== 'usuarios_agencia' && activeRoute !== 'usuarios_freelancer' && activeRoute !== 'usuarios_aliados' && activeRoute !== 'metodos_pago' && activeRoute !== 'nueva_cotizacion' && activeRoute !== 'ventas_cotizaciones' && activeRoute !== 'dashboard' && (
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
      <ToastContainer />
    </MainLayout>
  );
}

export default App;