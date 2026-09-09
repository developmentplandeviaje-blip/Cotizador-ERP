import React, { useState } from 'react';
import logoinicio from '../../assets/logoinicio.png';

export default function Sidebar({ activeRoute, onNavigate, onLogout, user }) {
  // Track open state of submenus. Defaults to 'servicios' open.
  const [openMenus, setOpenMenus] = useState({
    ventas: activeRoute?.startsWith('ventas'),
    reportes: activeRoute?.startsWith('reportes'),
    servicios: true,
    usuarios: activeRoute?.startsWith('usuarios'),
  });

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Helper to test if a route is active
  const isRouteActive = (routeId) => activeRoute === routeId;
  const isParentActive = (parentKey) => activeRoute?.startsWith(parentKey);

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #101d46 0%, #090e24 100%)',
      borderTopRightRadius: '45px',
      borderBottomRightRadius: '45px',
      borderRight: '1.5px solid rgba(255, 255, 255, 0.35)',
      borderTop: '1.5px solid rgba(255, 255, 255, 0.35)',
      borderBottom: '1.5px solid rgba(255, 255, 255, 0.35)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      boxSizing: 'border-box',
      flexShrink: 0,
      zIndex: 100,
      boxShadow: '4px 0 25px rgba(0, 0, 0, 0.5)',
      overflowY: 'auto',
      maxHeight: '100vh',
    }}>
      {/* Top Logo */}
      <div
        style={{
          padding: '0 24px',
          marginBottom: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
        onClick={() => onNavigate('dashboard')}
      >
        <img
          src={logoinicio}
          alt="Plan de Viaje"
          style={{ width: '65px', height: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 16px', flex: 1 }}>
        
        {/* 1. Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('dashboard') ? '#E87217' : '#FFFFFF',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span style={{ fontWeight: isRouteActive('dashboard') ? '700' : '500' }}>Dashboard</span>
        </button>

        {/* 2. Nueva Cotización */}
        <button
          onClick={() => onNavigate('nueva_cotizacion')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('nueva_cotizacion') ? '#E87217' : '#FFFFFF',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span style={{ fontWeight: isRouteActive('nueva_cotizacion') ? '700' : '500' }}>Nueva Cotización</span>
        </button>

        {/* 3. Ventas (Desplegable) */}
        <div>
          <button
            onClick={() => toggleMenu('ventas')}
            style={{
              ...navButtonStyle,
              color: isParentActive('ventas') ? '#E87217' : '#FFFFFF',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span style={{ fontWeight: isParentActive('ventas') ? '700' : '500' }}>Ventas</span>
          </button>

          {openMenus.ventas && (
            <div style={submenuContainerStyle}>
              <button
                onClick={() => onNavigate('ventas_agencia')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('ventas_agencia') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <span>Agencia</span>
              </button>

              <button
                onClick={() => onNavigate('ventas_freelancer')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('ventas_freelancer') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Freelancer</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Reportes (Desplegable) */}
        <div>
          <button
            onClick={() => toggleMenu('reportes')}
            style={{
              ...navButtonStyle,
              color: isParentActive('reportes') ? '#E87217' : '#FFFFFF',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="14" y2="16" />
              <line x1="8" y1="8" x2="12" y2="8" />
            </svg>
            <span style={{ fontWeight: isParentActive('reportes') ? '700' : '500' }}>Reportes</span>
          </button>

          {openMenus.reportes && (
            <div style={submenuContainerStyle}>
              {[
                { id: 'reportes_operativo', label: 'Operativo' },
                { id: 'reportes_comisiones', label: 'Comisiones' },
                { id: 'reportes_ventas', label: 'Reporte Ventas' },
                { id: 'reportes_gastos', label: 'Gastos' },
                { id: 'reportes_cuentas_cobrar', label: 'Cuentas por Cobrar' },
                { id: 'reportes_cuentas_pagar', label: 'Cuentas por Pagar' },
                { id: 'reportes_pagos_entrantes', label: 'Pagos Entrantes' },
                { id: 'reportes_checkin', label: 'Check-in' },
                { id: 'reportes_estado_venta', label: 'Estado de Venta' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => onNavigate(sub.id)}
                  style={{
                    ...subnavButtonStyle,
                    color: isRouteActive(sub.id) ? '#E87217' : '#FFFFFF',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Servicios (Desplegable) */}
        <div>
          <button
            onClick={() => toggleMenu('servicios')}
            style={{
              ...navButtonStyle,
              color: isParentActive('servicios') ? '#E87217' : '#FFFFFF',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" />
              <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
              <path d="M19 10l3-3-3-3" />
            </svg>
            <span style={{ fontWeight: isParentActive('servicios') ? '700' : '500' }}>Servicios</span>
          </button>

          {openMenus.servicios && (
            <div style={submenuContainerStyle}>
              {/* Hoteles */}
              <button
                onClick={() => onNavigate('servicios_hoteles')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_hoteles') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 7v14M21 7v14M6 3h12a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2zM9 10h2M13 10h2M9 14h2M13 14h2M9 18h2M13 18h2" />
                </svg>
                <span>Hoteles</span>
              </button>

              {/* Excursiones */}
              <button
                onClick={() => onNavigate('servicios_excursiones')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_excursiones') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13" cy="4" r="2" />
                  <path d="M9 20l3-6 2 3 4-8" />
                  <path d="M6 17l4-2" />
                </svg>
                <span>Excursiones</span>
              </button>

              {/* Paquetes */}
              <button
                onClick={() => onNavigate('servicios_paquetes')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_paquetes') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>Paquetes</span>
              </button>

              {/* Traslados */}
              <button
                onClick={() => onNavigate('servicios_traslados')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_traslados') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="11" rx="2" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
                <span>Traslados</span>
              </button>

              {/* Vehículos */}
              <button
                onClick={() => onNavigate('servicios_vehiculos')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_vehiculos') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2M7 17v2M17 17v2" />
                </svg>
                <span>Vehículos</span>
              </button>

              {/* Aerolíneas */}
              <button
                onClick={() => onNavigate('servicios_aerolineas')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_aerolineas') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                <span>Aerolíneas</span>
              </button>

              {/* Ubicaciones */}
              <button
                onClick={() => onNavigate('servicios_ubicaciones')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_ubicaciones') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Ubicaciones</span>
              </button>
            </div>
          )}
        </div>

        {/* 6. Gastos */}
        <button
          onClick={() => onNavigate('gastos')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('gastos') ? '#E87217' : '#FFFFFF',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="14" x2="12" y2="22" />
            <line x1="9" y1="19" x2="15" y2="19" />
          </svg>
          <span style={{ fontWeight: isRouteActive('gastos') ? '700' : '500' }}>Gastos</span>
        </button>

        {/* 7. Métodos de pago */}
        <button
          onClick={() => onNavigate('metodos_pago')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('metodos_pago') ? '#E87217' : '#FFFFFF',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span style={{ fontWeight: isRouteActive('metodos_pago') ? '700' : '500' }}>Métodos de pago</span>
        </button>

        {/* 8. Usuarios (Desplegable) */}
        <div>
          <button
            onClick={() => toggleMenu('usuarios')}
            style={{
              ...navButtonStyle,
              color: isParentActive('usuarios') ? '#E87217' : '#FFFFFF',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style={{ fontWeight: isParentActive('usuarios') ? '700' : '500' }}>Usuarios</span>
          </button>

          {openMenus.usuarios && (
            <div style={submenuContainerStyle}>
              <button
                onClick={() => onNavigate('usuarios_agencia')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('usuarios_agencia') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Agencia</span>
              </button>

              <button
                onClick={() => onNavigate('usuarios_freelancer')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('usuarios_freelancer') ? '#E87217' : '#FFFFFF',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                </svg>
                <span>Freelancer</span>
              </button>
            </div>
          )}
        </div>

      </nav>

      {/* Bottom Logout */}
      <div style={{ padding: '0 16px', marginTop: 'auto', paddingTop: '20px' }}>
        <button
          onClick={onLogout}
          style={{
            ...navButtonStyle,
            color: '#FFFFFF',
            opacity: 0.9,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span style={{ fontWeight: '500' }}>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

// Estilos Reusables para el Sidebar
const navButtonStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.875rem',
  textAlign: 'left',
  transition: 'all 0.15s ease',
};

const submenuContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginLeft: '16px',
  paddingLeft: '14px',
  marginTop: '4px',
  marginBottom: '6px',
  borderLeft: '2px solid rgba(255, 255, 255, 0.4)',
};

const subnavButtonStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '6px 8px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  textAlign: 'left',
  transition: 'all 0.15s ease',
  fontWeight: '500',
};
