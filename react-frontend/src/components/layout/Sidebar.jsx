import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showToast } from '../../utils/toast';
import logoinicio from '../../assets/logo-pdv-sin-letras.png';
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
import dashboard from '../../assets/home.svg';


export default function Sidebar({ activeRoute, onNavigate, onLogout, user }) {
  // Track open state of submenus.

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

  // Datos para visualización de usuario
  const displayName = user
    ? (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.username || user.email || 'Usuario')
    : 'Usuario';
  const displayLevel = user?.level || 'Asesor';
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  const userLevel = (user?.level || '').trim().toLowerCase();
  const isAdmin = ['administrador', 'admin'].includes(userLevel);
  const isAdministracion = ['administracion', 'administración', 'sub gerente', 'gerente'].includes(userLevel);
  const isContabilidad = userLevel === 'contabilidad';
  const isOperativo = userLevel === 'operativo';
  const isTarifas = userLevel === 'tarifas';
  const isLider = userLevel === 'lider' || userLevel === 'líder';
  const isAsesor = userLevel === 'asesor';
  const isFreelancer = userLevel === 'freelancer';
  const isAliado = Boolean(user?.id_aliado) || userLevel === 'aliado';

  const canViewVentas = !isTarifas;
  const canViewAgenciaVentas = isAdmin || isAdministracion || isContabilidad || isOperativo || isLider || isAsesor;
  const canViewReportes = isAdmin || isAdministracion || isOperativo || isLider || isAsesor || isFreelancer || isAliado;
  const canViewMetodosPago = isAdmin || isAdministracion;
  const canViewGastos = isAdmin;
  const canViewAgenciaUsers = isAdmin || isAdministracion || isContabilidad || isOperativo || isLider || isAsesor;
  const canViewFreelancerUsers = isAdmin || isTarifas || isFreelancer;
  const canViewAliadosUsers = isAdmin || isAliado;

  const isAdminOrLeader = isAdmin || isAdministracion || isLider;

  const [dailyCodeData, setDailyCodeData] = useState(null);
  const [copiedDailyCode, setCopiedDailyCode] = useState(false);

  useEffect(() => {
    if (!isAdminOrLeader) return;
    axios.get('/v1/ventas/autorizacion/codigo-diario')
      .then((res) => {
        if (res.data?.codigo) setDailyCodeData(res.data);
      })
      .catch((err) => console.warn('No se pudo cargar el código de autorización diario:', err));
  }, [isAdminOrLeader]);

  const handleCopyDailyCode = (e) => {
    e?.stopPropagation();
    if (!dailyCodeData?.codigo) return;
    navigator.clipboard.writeText(dailyCodeData.codigo);
    setCopiedDailyCode(true);
    showToast(`Código copiado al portapapeles: ${dailyCodeData.codigo}`, 'success');
    setTimeout(() => setCopiedDailyCode(false), 2500);
  };

  const [openMenus, setOpenMenus] = useState({
    ventas: Boolean(activeRoute?.startsWith('ventas')),
    reportes: Boolean(activeRoute?.startsWith('reportes')),
    servicios: Boolean(activeRoute?.startsWith('servicios')),
    usuarios: Boolean(activeRoute?.startsWith('usuarios')),
  });

  useEffect(() => {
    if (activeRoute?.startsWith('servicios')) {
      setOpenMenus(prev => ({ ...prev, servicios: true }));
    } else if (activeRoute?.startsWith('ventas')) {
      setOpenMenus(prev => ({ ...prev, ventas: true }));
    } else if (activeRoute?.startsWith('reportes')) {
      setOpenMenus(prev => ({ ...prev, reportes: true }));
    } else if (activeRoute?.startsWith('usuarios')) {
      setOpenMenus(prev => ({ ...prev, usuarios: true }));
    }
  }, [activeRoute]);

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

      {/* User profile card in Sidebar */}
      {/* <div
        style={{
          margin: isCollapsed ? '8px auto 14px auto' : '6px 16px 14px 16px',
          padding: isCollapsed ? '4px' : '9px 12px',
          borderRadius: '12px',
          background: isCollapsed ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
          border: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        title={isCollapsed ? `${displayName} (${displayLevel})` : undefined}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: isCollapsed ? '36px' : '38px',
              height: isCollapsed ? '36px' : '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E87217 0%, #FF9248 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(232, 114, 23, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {userInitial}
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '9px',
              height: '9px',
              backgroundColor: '#10B981',
              border: '2px solid #090e24',
              borderRadius: '50%',
            }}
            title="En línea"
          />
        </div>

        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}
              title={displayName}
            >
              {displayName}
            </span>
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background:
                    displayLevel.toLowerCase() === 'freelancer'
                      ? 'rgba(6, 182, 212, 0.2)'
                      : displayLevel.toLowerCase() === 'administrador'
                      ? 'rgba(232, 114, 23, 0.22)'
                      : 'rgba(37, 99, 235, 0.22)',
                  color:
                    displayLevel.toLowerCase() === 'freelancer'
                      ? '#67E8F9'
                      : displayLevel.toLowerCase() === 'administrador'
                      ? '#FDBA74'
                      : '#93C5FD',
                  border:
                    displayLevel.toLowerCase() === 'freelancer'
                      ? '1px solid rgba(6, 182, 212, 0.4)'
                      : displayLevel.toLowerCase() === 'administrador'
                      ? '1px solid rgba(232, 114, 23, 0.45)'
                      : '1px solid rgba(37, 99, 235, 0.4)',
                }}
              >
                {displayLevel}
              </span>
            </div>
          </div>
        )}
      </div>*/}

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 16px', flex: 1 }}>

        {/* 1. Dashboard */}
        <button
          className={`liquid-glass-btn ${isRouteActive('dashboard') ? 'active-route' : ''}`}
          onClick={() => onNavigate('dashboard')}
          style={{
            ...navButtonStyle,
            color: isRouteActive('dashboard') ? '#E87217' : '#FFFFFF',
          }}
        >
          <img
            src={dashboard}
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
          <span className="nav-text" style={{ fontWeight: isRouteActive('dashboard') ? '700' : '500' }}>Dashboard</span>
        </button>

        {/* 2. Nueva Cotización */}
        <button
          className={`liquid-glass-btn ${isRouteActive('nueva_cotizacion') ? 'active-route' : ''}`}
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
        {canViewVentas && (
          <div>
            <button
              className={`liquid-glass-btn ${isParentActive('ventas') ? 'active-parent' : ''}`}
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
                {canViewAgenciaVentas && (
                  <button
                    className={`liquid-glass-sub-btn ${isRouteActive('ventas_agencia') ? 'active-route' : ''}`}
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
                )}

                {(isAdmin || isFreelancer) && (
                  <button
                    className={`liquid-glass-sub-btn ${isRouteActive('ventas_freelancer') ? 'active-route' : ''}`}
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
                )}

                {(isAdmin || isAliado) && (
                  <button
                    className={`liquid-glass-sub-btn ${isRouteActive('ventas_aliados') ? 'active-route' : ''}`}
                    title={isCollapsed ? 'Ventas Aliados' : undefined} onClick={() => onNavigate('ventas_aliados')}
                    style={{
                      ...subnavButtonStyle,
                      color: isRouteActive('ventas_aliados') ? '#E87217' : '#FFFFFF',
                    }}
                  >
                    <img
                      src={usuarios}
                      style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                    />
                    <span className="nav-text">Aliados</span>
                  </button>
                )}

                <button
                  className={`liquid-glass-sub-btn ${isRouteActive('ventas_cotizaciones') ? 'active-route' : ''}`}
                  title={isCollapsed ? 'Registro de Cotizaciones' : undefined} onClick={() => onNavigate('ventas_cotizaciones')}
                  style={{
                    ...subnavButtonStyle,
                    color: isRouteActive('ventas_cotizaciones') ? '#E87217' : '#FFFFFF',
                  }}
                >
                  <img
                    src={nuevacotizacion}
                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                  />
                  <span className="nav-text">Cotizaciones</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Reportes (Desplegable) */}
        {canViewReportes && (
          <div>
            <button
              className={`liquid-glass-btn ${isParentActive('reportes') ? 'active-parent' : ''}`}
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
                  { id: 'reportes_operativo', label: 'Operativo', allowed: isAdmin },
                  { id: 'reportes_comisiones', label: 'Comisiones', allowed: isAdmin },
                  { id: 'reportes_ventas', label: 'Reporte Ventas', allowed: isAdmin },
                  { id: 'reportes_gastos', label: 'Gastos', allowed: isAdmin },
                  { id: 'reportes_cuentas_cobrar', label: 'Cuentas por Cobrar', allowed: true },
                  { id: 'reportes_cuentas_pagar', label: 'Cuentas por Pagar', allowed: isAdmin || isAdministracion || isOperativo },
                  { id: 'reportes_pagos_entrantes', label: 'Pagos Entrantes', allowed: isAdmin },
                  { id: 'reportes_checkin', label: 'Check-in', allowed: isAdmin || isLider || isAsesor || isFreelancer || isAliado },
                  { id: 'reportes_estado_venta', label: 'Estado de Venta', allowed: isAdmin },
                ]
                  .filter(sub => sub.allowed)
                  .map(sub => (
                  <button
                    key={sub.id}
                    className="liquid-glass-sub-btn"
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
        )}

        {/* 5. Servicios (Desplegable) */}
        <div>
          <button
            className="liquid-glass-btn"
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
                className="liquid-glass-sub-btn"
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
              {!isOperativo && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}

              {/* Paquetes */}
              {!isOperativo && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}

              {/* Traslados */}
              <button
                className="liquid-glass-sub-btn"
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
              {!isOperativo && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}

              {/* Aerolíneas */}
              {!isOperativo && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}

              {/* Ubicaciones */}
              {!isOperativo && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}
            </div>
          )}
        </div>

        {/* 6. Gastos (Solo Administrador) */}
        {canViewGastos && (
          <button
            className="liquid-glass-btn"
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
        )}

        {/* 7. Métodos de pago (Solo Administrador y Administración) */}
        {canViewMetodosPago && (
          <button
            className="liquid-glass-btn"
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
        )}

        {/* 8. Usuarios (Desplegable) */}
        <div>
          <button
            className="liquid-glass-btn"
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
              {canViewAgenciaUsers && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}

              {canViewFreelancerUsers && (
                <button
                  className="liquid-glass-sub-btn"
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
              )}

              {canViewAliadosUsers && (
                <button
                  className="liquid-glass-sub-btn"
                  title={isCollapsed ? 'Usuarios Aliados' : undefined} onClick={() => onNavigate('usuarios_aliados')}
                  style={{
                    ...subnavButtonStyle,
                    color: isRouteActive('usuarios_aliados') ? '#E87217' : '#FFFFFF',
                  }}
                >
                  <img
                    src={usuarios}
                    style={{ width: '25px', height: '25px', objectFit: 'contain' }}
                  />
                  <span className="nav-text">Aliados</span>
                </button>
              )}
            </div>
          )}
        </div>

      </nav>

      {/* Widget Código Diario (Solo para Administradores / Líderes) */}
      {isAdminOrLeader && dailyCodeData && !isCollapsed && (
        <div
          style={{
            margin: '12px 14px 4px 14px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'rgba(11, 209, 245, 0.1)',
            border: '1px solid rgba(11, 204, 245, 0.41)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgb(77 213 252)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Código del Día
            </span>
            <span style={{ fontSize: '0.65rem', color: '#CBD5E1', opacity: 0.85 }}>
              24h
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '1px',
                fontFamily: 'monospace',
                background: 'rgb(44, 113, 191, 0.35)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              title="Código de autorización diario para desbloquear ventas"
            >
              {dailyCodeData.codigo}
            </span>

            <button
              type="button"
              onClick={handleCopyDailyCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #2563eb',
                background: copiedDailyCode ? '#10B981' : 'linear-gradient(135deg, rgb(11, 88, 245), rgb(6, 61, 217))',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Copiar código para compartirlo"
            >
              {copiedDailyCode ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '6px' }}>
            Cambia cada 24h a medianoche.
          </div>
        </div>
      )}

      {/* Versión compacta para Sidebar Colapsado */}
      {isAdminOrLeader && dailyCodeData && isCollapsed && (
        <div style={{ padding: '0 8px', margin: '8px 0', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleCopyDailyCode}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              border: '1px solid rgba(11, 204, 245, 0.3)',
              background: '#0bd1f51a',
              color: '#FCD34D',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              margin: '0 auto',
            }}
            title={`Código del Día: ${dailyCodeData.codigo} (Haga clic para copiar)`}
          >
          </button>
        </div>
      )}

      {/* Bottom Logout */}
      <div style={{ padding: '0 16px', marginTop: 'auto', paddingTop: '20px' }}>
        <button
          className="liquid-glass-btn"
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
        /* Liquid Glass Navigation & Submenu Buttons */
        .liquid-glass-btn,
        .liquid-glass-sub-btn {
          position: relative !important;
          overflow: hidden !important;
          border-radius: 9999px !important;
          border: 1px solid transparent !important;
          background: transparent !important;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          transform: translateZ(0);
          box-sizing: border-box !important;
        }

        /* Glass optical top sheen pseudo-element */
        .liquid-glass-btn::before,
        .liquid-glass-sub-btn::before {
          content: '';
          position: absolute;
          top: 1px;
          left: 8px;
          right: 8px;
          height: 46%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 9999px 9999px 30px 30px;
          pointer-events: none;
          opacity: 0;
          transform: translateY(-2px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          z-index: 2;
        }

        /* Keep icon and text layers above glass sheen */
        .liquid-glass-btn > *,
        .liquid-glass-sub-btn > * {
          position: relative;
          z-index: 3;
        }

        /* LIQUID GLASS HOVER EFFECT (Explore pill style in expanded mode) */
        .sidebar-container:not(.collapsed) .liquid-glass-btn:hover,
        .sidebar-container:not(.collapsed) .liquid-glass-sub-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.16) 100%) !important;
          backdrop-filter: blur(14px) saturate(190%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(190%) !important;
          border: 1px solid rgba(255, 255, 255, 0.48) !important;
          box-shadow: 
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.25),
            inset 0 0 12px 0 rgba(255, 255, 255, 0.1),
            0 8px 20px 0 rgba(0, 0, 0, 0.35),
            0 0 14px 0 rgba(255, 255, 255, 0.18) !important;
          transform: translateX(3px) scale(1.01) !important;
        }

        .sidebar-container:not(.collapsed) .liquid-glass-btn:hover::before,
        .sidebar-container:not(.collapsed) .liquid-glass-sub-btn:hover::before {
          opacity: 1;
          transform: translateY(0);
        }

        .sidebar-container:not(.collapsed) .liquid-glass-btn:active,
        .sidebar-container:not(.collapsed) .liquid-glass-sub-btn:active {
          transform: translateX(1px) scale(0.98) !important;
          box-shadow: 
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 1px 0 rgba(255, 255, 255, 0.15),
            0 3px 8px 0 rgba(0, 0, 0, 0.25) !important;
        }

        /* Active route state in expanded mode */
        .sidebar-container:not(.collapsed) .liquid-glass-btn.active-route,
        .sidebar-container:not(.collapsed) .liquid-glass-sub-btn.active-route {
          background: linear-gradient(135deg, rgba(232, 114, 23, 0.22) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(232, 114, 23, 0.16) 100%) !important;
          border: 1px solid rgba(232, 114, 23, 0.5) !important;
          box-shadow: 
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(232, 114, 23, 0.2) !important;
        }

        .sidebar-container:not(.collapsed) .liquid-glass-btn.active-parent {
          border: 1px solid rgba(232, 114, 23, 0.35) !important;
        }

        /* ========================================================= */
        /* COLLAPSED SIDEBAR ADJUSTMENTS (Perfect Circular Glass Dock)*/
        /* ========================================================= */
        .sidebar-container.collapsed {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .sidebar-container.collapsed .nav-text,
        .sidebar-container.collapsed span.nav-text {
          display: none !important;
        }

        .sidebar-container.collapsed nav {
          padding: 0 10px !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .sidebar-container.collapsed nav > div {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }

        /* Main Navigation Buttons in Collapsed Mode -> PERFECT CIRCLE */
        .sidebar-container.collapsed .liquid-glass-btn {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          max-width: 44px !important;
          max-height: 44px !important;
          border-radius: 50% !important;
          margin: 0 auto !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }

        .sidebar-container.collapsed .liquid-glass-btn img {
          width: 24px !important;
          height: 24px !important;
          object-fit: contain !important;
          margin: 0 !important;
        }

        .sidebar-container.collapsed .liquid-glass-btn::before {
          left: 4px !important;
          right: 4px !important;
          top: 2px !important;
          height: 42% !important;
          border-radius: 50% 50% 35% 35% !important;
        }

        /* Submenu Container in Collapsed Mode:
           Centered vertical capsule, no border-left pushing icons */
        .sidebar-container.collapsed .submenu-container {
          margin: 6px auto !important;
          padding: 6px 0 !important;
          width: 48px !important;
          border-left: none !important;
          background: rgba(0, 0, 0, 0.24) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 26px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          box-sizing: border-box !important;
          box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.35) !important;
        }

        /* Submenu Circular buttons when collapsed (Never clipped) */
        .sidebar-container.collapsed .liquid-glass-sub-btn {
          width: 38px !important;
          height: 38px !important;
          min-width: 38px !important;
          min-height: 38px !important;
          max-width: 38px !important;
          max-height: 38px !important;
          border-radius: 50% !important;
          margin: 0 auto !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        .sidebar-container.collapsed .liquid-glass-sub-btn img {
          width: 22px !important;
          height: 22px !important;
          max-width: 22px !important;
          max-height: 22px !important;
          object-fit: contain !important;
          margin: 0 auto !important;
          display: block !important;
        }



        .sidebar-container.collapsed .liquid-glass-sub-btn::before {
          left: 3px !important;
          right: 3px !important;
          top: 2px !important;
          height: 42% !important;
          border-radius: 50% 50% 35% 35% !important;
        }

        /* Hover Feedback in Collapsed Mode -> PERFECT CIRCLE GLASS */
        .sidebar-container.collapsed .liquid-glass-btn:hover,
        .sidebar-container.collapsed .liquid-glass-sub-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.18) 100%) !important;
          backdrop-filter: blur(14px) saturate(190%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(190%) !important;
          border: 1px solid rgba(255, 255, 255, 0.55) !important;
          border-radius: 50% !important;
          box-shadow: 
            inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.25),
            0 4px 14px rgba(0, 0, 0, 0.35),
            0 0 12px rgba(255, 255, 255, 0.2) !important;
          transform: scale(1.08) !important;
        }

        .sidebar-container.collapsed .liquid-glass-btn:hover::before,
        .sidebar-container.collapsed .liquid-glass-sub-btn:hover::before {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .sidebar-container.collapsed .liquid-glass-btn:active,
        .sidebar-container.collapsed .liquid-glass-sub-btn:active {
          transform: scale(0.96) !important;
          border-radius: 50% !important;
          box-shadow: 
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 1px 0 rgba(255, 255, 255, 0.15),
            0 2px 6px rgba(0, 0, 0, 0.25) !important;
        }

        /* Active Selected State in Collapsed Mode -> CIRCULAR LIQUID GLASS WITH BRAND ACCENT */
        .sidebar-container.collapsed .liquid-glass-btn.active-route,
        .sidebar-container.collapsed .liquid-glass-sub-btn.active-route {
          background: linear-gradient(135deg, rgba(232, 114, 23, 0.3) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(232, 114, 23, 0.24) 100%) !important;
          border: 1px solid rgba(232, 114, 23, 0.7) !important;
          border-radius: 50% !important;
          box-shadow: 
            inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 2px 0 rgba(0, 0, 0, 0.2),
            0 0 14px rgba(232, 114, 23, 0.4) !important;
        }

        .sidebar-container.collapsed .liquid-glass-btn.active-parent {
          border: 1px solid rgba(232, 114, 23, 0.45) !important;
          border-radius: 50% !important;
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
  cursor: 'pointer',
  fontSize: '0.875rem',
  textAlign: 'left',
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
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  textAlign: 'left',
  fontWeight: '500',
};
