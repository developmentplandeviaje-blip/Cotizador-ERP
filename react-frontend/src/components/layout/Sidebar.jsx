import React, { useState } from 'react';
import logoinicio from '../../assets/logo_blanc_naranja.png';
import nuevacotizacion from '../../assets/NuevaCotizacion.svg';
import ventas from '../../assets/Ventas.svg';
import ventasagencia from '../../assets/VentasAgencia.svg';
import ventasfreelancer from '../../assets/Ventasfreelance.svg';
import reportes from '../../assets/reportes.svg';
import servicios from '../../assets/Servicios.svg';
import hoteles from '../../assets/Hoteles.svg';
import excursiones from '../../assets/Excursiones.svg';
import paquetes from '../../assets/Paqueteria.svg';
import traslado from '../../assets/Traslados.svg';
import vehiculos from '../../assets/Vehiculos.svg';
import aerolinea from '../../assets/Aerolineas.svg';
import ubicacion from '../../assets/Ubicaciones.svg';
import gastos from '../../assets/Gastos.svg';
import Metodosdepago from '../../assets/Metodosdepago.svg';
import usuarios from '../../assets/Usuario.svg';
import cerrarsesion from '../../assets/Cerrarsesion.svg';


export default function Sidebar({ activeRoute, onNavigate, onLogout, user }) {
  // Track open state of submenus. Defaults to 'servicios' open.

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem("sidebar_collapsed", newVal);
      return newVal;
    });
  };

  const sidebarWidth = isCollapsed ? "80px" : "240px";

  const [openMenus, setOpenMenus] = useState({
    ventas: activeRoute?.startsWith('ventas'),
    reportes: activeRoute?.startsWith('reportes'),
    servicios: true,
    usuarios: activeRoute?.startsWith('usuarios'),
  });

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => {
      const isCurrentlyOpen = prev[menuKey];
      if (!isCurrentlyOpen) {
        // Close all others and open the requested one
        return {
          ventas: menuKey === 'ventas',
          reportes: menuKey === 'reportes',
          servicios: menuKey === 'servicios',
          usuarios: menuKey === 'usuarios',
        };
      } else {
        // Just close the current one
        return {
          ...prev,
          [menuKey]: false
        };
      }
    });
  };

  // Helper to test if a route is active
  const isRouteActive = (routeId) => activeRoute === routeId;
  const isParentActive = (parentKey) => activeRoute?.startsWith(parentKey);

  return (
    <aside
      className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: sidebarWidth,
        transition: 'width 0.3s ease, padding 0.3s ease',
        minHeight: '100vh',
        background: 'linear-gradient(260deg, rgb(17 46 139 / 55%) 0%, rgb(28 39 85 / 55%) 100%)',
        //background: 'linear-gradient(45deg, rgba(220deg, 3, 65, 232, 0.2) 0%, rgb(28 39 85 / 55%) 100%)',
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

      <div
        style={{
          padding: isCollapsed ? '0' : '0 24px',
          marginBottom: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: isCollapsed ? '10px' : '0',
        }}
      >
        <div style={{ display: isCollapsed ? 'none' : 'block', cursor: 'pointer' }} title={isCollapsed ? 'Dashboard' : undefined} onClick={() => onNavigate('dashboard')}>
          <img
            src={logoinicio}
            alt="Plan de Viaje"
            style={{ width: '80px', height: 'auto', objectFit: 'contain' }}
          />
        </div>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Alternar Menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
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
          <span className="nav-text" style={{ fontWeight: isRouteActive('dashboard') ? '700' : '500' }}>Dashboard</span>
        </button>

        {/* 2. Nueva Cotización */}
        <button
          title={isCollapsed ? 'Nueva Cotización' : undefined} onClick={() => onNavigate('nueva_cotizacion')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('nueva_cotizacion') ? '#E87217' : '#FFFFFF',
          }}
        >
          <img
            src={nuevacotizacion}
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
          <span className="nav-text" style={{ fontWeight: isRouteActive('nueva_cotizacion') ? '700' : '500' }}>Nueva Cotización</span>
        </button>

        {/* 3. Ventas (Desplegable) */}
        <div>
          <button
            title={isCollapsed ? 'Ventas' : undefined} onClick={() => toggleMenu('ventas')}
            style={{
              ...navButtonStyle,
              color: isParentActive('ventas') ? '#E87217' : '#FFFFFF',
            }}
          >
            <img
              src={ventas}
              style={{ width: '25px', height: '25px', objectFit: 'contain' }}
            />
            <span className="nav-text" style={{ fontWeight: isParentActive('ventas') ? '700' : '500' }}>Ventas</span>
          </button>

          {openMenus.ventas && (
            <div className="submenu-container" style={submenuContainerStyle}>
              <button
                title={isCollapsed ? 'Ventas Agencia' : undefined} onClick={() => onNavigate('ventas_agencia')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('ventas_agencia') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={ventasagencia}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Agencia</span>
              </button>

              <button
                title={isCollapsed ? 'Ventas Freelancer' : undefined} onClick={() => onNavigate('ventas_freelancer')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('ventas_freelancer') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={ventasfreelancer}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Freelancer</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Reportes (Desplegable) */}
        <div>
          <button
            title={isCollapsed ? 'Reportes' : undefined} onClick={() => toggleMenu('reportes')}
            style={{
              ...navButtonStyle,
              color: isParentActive('reportes') ? '#E87217' : '#FFFFFF',
            }}
          >
            <img
              src={reportes}
              style={{ width: '25px', height: '25px', objectFit: 'contain' }}
            />
            <span className="nav-text" style={{ fontWeight: isParentActive('reportes') ? '700' : '500' }}>Reportes</span>
          </button>

          {openMenus.reportes && (
            <div className="submenu-container" style={submenuContainerStyle}>
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
                  title={isCollapsed ? sub.label : undefined} onClick={() => onNavigate(sub.id)}
                  style={{
                    ...subnavButtonStyle,
                    color: isRouteActive(sub.id) ? '#E87217' : '#FFFFFF',
                  }}
                >
                  <img
                    src={reportes}
                    style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                  />
                  <span className="nav-text">{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Servicios (Desplegable) */}
        <div>
          <button
            title={isCollapsed ? 'Servicios' : undefined} onClick={() => toggleMenu('servicios')}
            style={{
              ...navButtonStyle,
              color: isParentActive('servicios') ? '#E87217' : '#FFFFFF',
            }}
          >
            <img
              src={servicios}
              style={{ width: '25px', height: '25px', objectFit: 'contain' }}
            />
            <span className="nav-text" style={{ fontWeight: isParentActive('servicios') ? '700' : '500' }}>Servicios</span>
          </button>

          {openMenus.servicios && (
            <div className="submenu-container" style={submenuContainerStyle}>
              {/* Hoteles */}
              <button
                title={isCollapsed ? 'Hoteles' : undefined} onClick={() => onNavigate('servicios_hoteles')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_hoteles') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={hoteles}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Hoteles</span>
              </button>

              {/* Excursiones */}
              <button
                title={isCollapsed ? 'Excursiones' : undefined} onClick={() => onNavigate('servicios_excursiones')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_excursiones') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={excursiones}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Excursiones</span>
              </button>

              {/* Paquetes */}
              <button
                title={isCollapsed ? 'Paquetes' : undefined} onClick={() => onNavigate('servicios_paquetes')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_paquetes') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={paquetes}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Paquetes</span>
              </button>

              {/* Traslados */}
              <button
                title={isCollapsed ? 'Traslados' : undefined} onClick={() => onNavigate('servicios_traslados')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_traslados') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={traslado}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Traslados</span>
              </button>

              {/* Vehículos */}
              <button
                title={isCollapsed ? 'Vehículos' : undefined} onClick={() => onNavigate('servicios_vehiculos')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_vehiculos') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={vehiculos}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Vehículos</span>
              </button>

              {/* Aerolíneas */}
              <button
                title={isCollapsed ? 'Aerolíneas' : undefined} onClick={() => onNavigate('servicios_aerolineas')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_aerolineas') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={aerolinea}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Aerolíneas</span>
              </button>

              {/* Ubicaciones */}
              <button
                title={isCollapsed ? 'Ubicaciones' : undefined} onClick={() => onNavigate('servicios_ubicaciones')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('servicios_ubicaciones') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={ubicacion}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Ubicaciones</span>
              </button>
            </div>
          )}
        </div>

        {/* 6. Gastos */}
        <button
          title={isCollapsed ? 'Gastos' : undefined} onClick={() => onNavigate('gastos')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('gastos') ? '#E87217' : '#FFFFFF',
          }}
        >
          <img
            src={gastos}
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
          <span className="nav-text" style={{ fontWeight: isRouteActive('gastos') ? '700' : '500' }}>Gastos</span>
        </button>

        {/* 7. Métodos de pago */}
        <button
          title={isCollapsed ? 'Métodos de pago' : undefined} onClick={() => onNavigate('metodos_pago')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('metodos_pago') ? '#E87217' : '#FFFFFF',
          }}
        >
          <img
            src={Metodosdepago}
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
          <span className="nav-text" style={{ fontWeight: isRouteActive('metodos_pago') ? '700' : '500' }}>Métodos de pago</span>
        </button>

        {/* 8. Usuarios (Desplegable) */}
        <div>
          <button
            title={isCollapsed ? 'Usuarios' : undefined} onClick={() => toggleMenu('usuarios')}
            style={{
              ...navButtonStyle,
              color: isParentActive('usuarios') ? '#E87217' : '#FFFFFF',
            }}
          >
            <img
              src={usuarios}
              style={{ width: '25px', height: '25px', objectFit: 'contain' }}
            />
            <span className="nav-text" style={{ fontWeight: isParentActive('usuarios') ? '700' : '500' }}>Usuarios</span>
          </button>

          {openMenus.usuarios && (
            <div className="submenu-container" style={submenuContainerStyle}>
              <button
                title={isCollapsed ? 'Usuarios Agencia' : undefined} onClick={() => onNavigate('usuarios_agencia')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('usuarios_agencia') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={usuarios}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Agencia</span>
              </button>

              <button
                title={isCollapsed ? 'Usuarios Freelancer' : undefined} onClick={() => onNavigate('usuarios_freelancer')}
                style={{
                  ...subnavButtonStyle,
                  color: isRouteActive('usuarios_freelancer') ? '#E87217' : '#FFFFFF',
                }}
              >
                <img
                  src={usuarios}
                  style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                />
                <span className="nav-text">Freelancer</span>
              </button>
            </div>
          )}
        </div>

      </nav>

      {/* Bottom Logout */}
      <div style={{ padding: '0 16px', marginTop: 'auto', paddingTop: '20px' }}>
        <button
          title={isCollapsed ? 'Cerrar Sesión' : undefined} onClick={onLogout}
          style={{
            ...navButtonStyle,
            color: '#FFFFFF',
            opacity: 0.9,
          }}
        >
          <img
            src={cerrarsesion}
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
          <span className="nav-text" style={{ fontWeight: '500' }}>Cerrar Sesión</span>
        </button>
      </div>

      <style>{`
        .sidebar-container.collapsed .nav-text {
          display: none;
        }
        .sidebar-container.collapsed > nav > button,
        .sidebar-container.collapsed > nav > div > button {
          justify-content: center !important;
          padding: 10px 0 !important;
        }
        /* For submenus in collapsed mode */
        .sidebar-container.collapsed .submenu-container {
          /* Keep the line, but adjust padding to center the icon */
          margin-left: 20px !important;
          padding-left: 10px !important;
        }
        .sidebar-container.collapsed .submenu-container button {
          justify-content: center !important;
          padding: 6px 0 !important;
        }
      `}</style>
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
