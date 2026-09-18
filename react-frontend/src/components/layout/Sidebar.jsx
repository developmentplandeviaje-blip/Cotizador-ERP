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
  const [hoveredMenu, setHoveredMenu] = useState(null);

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
        overflowY: isCollapsed ? 'visible' : 'auto',
        overflowX: isCollapsed ? 'visible' : 'hidden',
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
        <div style={{ display: isCollapsed ? 'none' : 'block', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <img
            src={logoinicio}
            alt="Plan de Viaje"
            style={{ width: '80px', height: 'auto', objectFit: 'contain' }}
          />
        </div>
        <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
          onClick={() => onNavigate('nueva_cotizacion')}
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
        <div className="nav-item-wrapper" onMouseEnter={() => isCollapsed && setHoveredMenu('ventas')} onMouseLeave={() => isCollapsed && setHoveredMenu(null)}>
          <button
            onClick={() => toggleMenu('ventas')}
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

          {(!isCollapsed && openMenus.ventas) && (
            <div style={submenuContainerStyle}>
              <button
                onClick={() => onNavigate('ventas_agencia')}
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
                onClick={() => onNavigate('ventas_freelancer')}
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

          {isCollapsed && hoveredMenu === 'ventas' && (
            <div className="flyout-menu">

              <button
                onClick={() => onNavigate('ventas_agencia')}
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
                onClick={() => onNavigate('ventas_freelancer')}
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
        <div className="nav-item-wrapper" onMouseEnter={() => isCollapsed && setHoveredMenu('reportes')} onMouseLeave={() => isCollapsed && setHoveredMenu(null)}>
          <button
            onClick={() => toggleMenu('reportes')}
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

          {(!isCollapsed && openMenus.reportes) && (
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
                  <img
                    src={reportes}
                    style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                  />
                  <span className="nav-text">{sub.label}</span>
                </button>
              ))}
            </div>
          )}

          {isCollapsed && hoveredMenu === 'reportes' && (
            <div className="flyout-menu">

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
        <div className="nav-item-wrapper" onMouseEnter={() => isCollapsed && setHoveredMenu('servicios')} onMouseLeave={() => isCollapsed && setHoveredMenu(null)}>
          <button
            onClick={() => toggleMenu('servicios')}
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

          {(!isCollapsed && openMenus.servicios) && (
            <div style={submenuContainerStyle}>
              {/* Hoteles */}
              <button
                onClick={() => onNavigate('servicios_hoteles')}
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
                onClick={() => onNavigate('servicios_excursiones')}
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
                onClick={() => onNavigate('servicios_paquetes')}
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
                onClick={() => onNavigate('servicios_traslados')}
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
                onClick={() => onNavigate('servicios_vehiculos')}
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
                onClick={() => onNavigate('servicios_aerolineas')}
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
                onClick={() => onNavigate('servicios_ubicaciones')}
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

          {isCollapsed && hoveredMenu === 'servicios' && (
            <div className="flyout-menu">

              {/* Hoteles */}
              <button
                onClick={() => onNavigate('servicios_hoteles')}
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
                onClick={() => onNavigate('servicios_excursiones')}
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
                onClick={() => onNavigate('servicios_paquetes')}
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
                onClick={() => onNavigate('servicios_traslados')}
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
                onClick={() => onNavigate('servicios_vehiculos')}
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
                onClick={() => onNavigate('servicios_aerolineas')}
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
                onClick={() => onNavigate('servicios_ubicaciones')}
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
          onClick={() => onNavigate('gastos')}
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
          onClick={() => onNavigate('metodos_pago')}
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
        <div className="nav-item-wrapper" onMouseEnter={() => isCollapsed && setHoveredMenu('usuarios')} onMouseLeave={() => isCollapsed && setHoveredMenu(null)}>
          <button
            onClick={() => toggleMenu('usuarios')}
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

          {(!isCollapsed && openMenus.usuarios) && (
            <div style={submenuContainerStyle}>
              <button
                onClick={() => onNavigate('usuarios_agencia')}
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
                onClick={() => onNavigate('usuarios_freelancer')}
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

          {isCollapsed && hoveredMenu === 'usuarios' && (
            <div className="flyout-menu">

              <button
                onClick={() => onNavigate('usuarios_agencia')}
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
                onClick={() => onNavigate('usuarios_freelancer')}
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
          onClick={onLogout}
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
        .sidebar-container.collapsed button {
          justify-content: center !important;
          padding: 10px 0 !important;
        }
        .nav-item-wrapper {
          position: relative;
        }
        .flyout-menu {
          position: absolute;
          left: 80px;
          top: 0;
          width: 200px;
          background: linear-gradient(260deg, rgb(17 46 139) 0%, rgb(28 39 85) 100%);
          border-radius: 8px;
          padding: 8px;
          z-index: 1000;
          box-shadow: 4px 4px 15px rgba(0,0,0,0.5);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .flyout-menu button {
          justify-content: flex-start !important;
          padding: 6px 8px !important;
        }
        .flyout-menu .nav-text {
          display: inline !important;
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
