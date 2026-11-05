import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Badge from '../common/Badge';
import ConfirmationModal from '../common/ConfirmationModal';
import CustomSelect from '../common/CustomSelect';
import { DetalleVentaModal, RegistrarPagoModal } from './modals';
import EditarCotizacion from './EditarCotizacion';
import { showToast } from '../../utils/toast';
import imgSearch from '../../assets/lupa.svg';

export default function VentasList({ tipo = 'agencia', user }) {
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos'); // 'todos' | 'Confirmada' | 'Cotizacion'
  const [filterPago, setFilterPago] = useState('todos'); // 'todos' | 'pagado' | 'pendiente'
  const [filterAliadoId, setFilterAliadoId] = useState('');

  // Modales y Edición
  const [editingVentaId, setEditingVentaId] = useState(null);
  const [selectedVentaDetalle, setSelectedVentaDetalle] = useState(null);
  const [selectedVentaPago, setSelectedVentaPago] = useState(null);
  const [confirmingVenta, setConfirmingVenta] = useState(null);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);

  // Título e información según el tipo
  const infoConfig = useMemo(() => {
    switch (tipo) {
      case 'freelancer':
        return {
          title: 'Ventas Freelancer',
          subtitle: 'Control de operaciones, cotizaciones y comisiones generadas por asesores independientes.',
          icon: '👤',
        };
      case 'aliados':
        return {
          title: 'Ventas Aliados Comerciales',
          subtitle: 'Consolidación de ventas, ingresos y recaudos agrupados por Empresa Aliada.',
          icon: '🏢',
        };
      case 'agencia':
      default:
        return {
          title: 'Ventas Agencia',
          subtitle: 'Gestión y seguimiento de ventas realizadas por el equipo interno de la agencia.',
          icon: '💼',
        };
    }
  }, [tipo]);

  // Carga de ventas desde el backend
  const fetchVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterEstado !== 'todos') {
        params.estado = filterEstado;
      }
      if (tipo === 'aliados' && filterAliadoId) {
        params.id_aliado = filterAliadoId;
      }

      const res = await axios.get(`/v1/ventas/${tipo}`, { params });
      const data = res.data || {};
      setVentas(Array.isArray(data.ventas) ? data.ventas : []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(`Error al cargar ventas (${tipo}):`, err);
      setError('No se pudieron cargar las ventas. Intente nuevamente.');
      showToast.error('Error al cargar ventas.');
    } finally {
      setLoading(false);
    }
  }, [tipo, filterEstado, filterAliadoId]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Confirmar Venta
  const handleConfirmSale = async () => {
    if (!confirmingVenta) return;
    setIsConfirmingSale(true);
    try {
      await axios.patch(`/v1/ventas/${confirmingVenta.id}/confirmar`);
      showToast.success(`Venta ${confirmingVenta.numero_ficha || confirmingVenta.id} confirmada con éxito.`);
      setConfirmingVenta(null);
      fetchVentas();
    } catch (err) {
      console.error('Error al confirmar venta:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudo confirmar la venta.';
      showToast.error(msg);
    } finally {
      setIsConfirmingSale(false);
    }
  };

  // Filtrado reactivo en memoria
  const filteredVentas = useMemo(() => {
    return ventas.filter((v) => {
      // Filtro por Estado de Pago
      if (filterPago === 'pagado') {
        if ((v.saldo_pendiente || 0) > 0.01) return false;
      } else if (filterPago === 'pendiente') {
        if ((v.saldo_pendiente || 0) <= 0.01) return false;
      }

      // Filtro de Búsqueda
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const ficha = String(v.numero_ficha || '').toLowerCase();
      const cliente = (v.cliente?.nombre_completo || '').toLowerCase();
      const doc = (v.cliente?.documento || '').toLowerCase();
      const asesor = (v.asesor?.name || '').toLowerCase();
      const aliado = (v.aliado?.razon_social || '').toLowerCase();

      return (
        ficha.includes(term) ||
        cliente.includes(term) ||
        doc.includes(term) ||
        asesor.includes(term) ||
        aliado.includes(term)
      );
    });
  }, [ventas, filterPago, searchTerm]);

  // Lista de aliados únicos para el filtro desplegable
  const aliadosList = useMemo(() => {
    if (tipo !== 'aliados' || !stats?.aliados_resumen) return [];
    return stats.aliados_resumen;
  }, [tipo, stats]);

  // Si se está editando una cotización o venta, renderizar la vista de edición inteligente
  if (editingVentaId) {
    return (
      <EditarCotizacion
        ventaId={editingVentaId}
        user={user}
        tipoScope={tipo}
        onVolver={() => {
          setEditingVentaId(null);
          fetchVentas();
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1380px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '40px',
      }}
    >
      {/* Cabecera Principal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          background: 'rgba(16, 28, 68, 0.72)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF' }}>
              {infoConfig.title}
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              {infoConfig.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchVentas}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            title="Recargar lista de ventas"
          >
            <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: tipo === 'aliados' ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Total Ventas */}
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Facturado USD
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#E87217', marginTop: '4px' }}>
            ${Number(stats?.total_ventas_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Pagado */}
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Recaudado / Pagado
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4ADE80', marginTop: '4px' }}>
            ${Number(stats?.total_pagado_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Saldo Pendiente */}
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Saldo Pendiente por Cobrar
          </span>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: '800',
              color: (stats?.total_saldo_pendiente_usd || 0) > 0 ? '#F87171' : '#94A3B8',
              marginTop: '4px',
            }}
          >
            ${Number(stats?.total_saldo_pendiente_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Cantidad Ventas */}
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Operaciones / Ventas
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FFFFFF', marginTop: '4px' }}>
            {stats?.cantidad_ventas || ventas.length}
          </div>
        </div>

        {/* Métrica adicional para Aliados */}
        {tipo === 'aliados' && (
          <div
            style={{
              background: 'rgb(6, 18, 81)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Empresas Aliadas
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38BDF8', marginTop: '4px' }}>
              {stats?.empresas_aliadas_count || 0}
            </div>
          </div>
        )}
      </div>

      {/* Resumen Consolidado de Empresas Aliadas (Solo para Aliados) */}
      {tipo === 'aliados' && stats?.aliados_resumen && stats.aliados_resumen.length > 0 && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Consolidado por Empresa Aliada
            </h3>
            {filterAliadoId && (
              <button
                type="button"
                onClick={() => setFilterAliadoId('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Limpiar filtro de aliado
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {stats.aliados_resumen.map((al) => {
              const isSelected = String(filterAliadoId) === String(al.id);
              return (
                <div
                  key={al.id}
                  onClick={() => setFilterAliadoId(isSelected ? '' : String(al.id))}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title="Haga clic para filtrar ventas de esta empresa"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.9rem' }}>
                      {al.razon_social}
                    </div>
                    <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>{al.rif}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Ventas: </span>
                      <strong style={{ color: '#CBD5E1' }}>{al.cantidad_ventas}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Total: </span>
                      <strong style={{ color: '#E87217' }}>${Number(al.total_ventas_usd).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Saldo: </span>
                      <strong style={{ color: al.total_saldo_usd > 0 ? '#F87171' : '#4ADE80' }}>
                        ${Number(al.total_saldo_usd).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '0 4px',
        }}
      >
        {/* Barra de Búsqueda */}
        <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#b9c8ddff',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img src={imgSearch} alt="" style={{ width: '18px', height: '18px' }} />
          </span>
          <input
            type="text"
            className="erp-input"
            placeholder="Buscar por ficha, cliente o asesor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: searchTerm ? '34px' : '16px',
              borderRadius: '9999px',
              background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
              height: '38px',
              boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
              border: '1px solid rgb(255 255 255 / 56%)',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
              }}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pestañas de Filtro (Estado y Pago) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Pestañas Estado Venta */}
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'Confirmada', label: 'Confirmadas' },
            { id: 'Cotizacion', label: 'Cotizaciones' },
          ].map((tab) => {
            const active = filterEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterEstado(tab.id)}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  borderRadius: '9999px',
                  border: active ? '1px solid rgb(201, 201, 201)' : '1px solid rgb(255 255 255 / 56%)',
                  background: active
                    ? 'linear-gradient(150deg, rgb(255 255 255 / 15%) 1%, rgb(182 183 185 / 20%) 73%, rgb(255 255 255 / 45%) 108%)'
                    : 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                  color: active ? '#FFFFFF' : '#b9c8ddff',
                  fontSize: '0.8125rem',
                  fontWeight: active ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 4px' }} />

          {/* Filtro Estado de Pago */}
          <CustomSelect
            value={filterPago}
            onChange={(e) => setFilterPago(e.target.value)}
            options={[
              { value: 'todos', label: 'Todos los pagos' },
              { value: 'pagado', label: 'Totalmente Pagado' },
              { value: 'pendiente', label: 'Con Saldo Pendiente' },
            ]}
            style={{ width: '190px' }}
          />

          {/* Dropdown de Aliado si aplica */}
          {tipo === 'aliados' && aliadosList.length > 0 && (
            <CustomSelect
              value={filterAliadoId}
              onChange={(e) => setFilterAliadoId(e.target.value)}
              options={[
                { value: '', label: 'Todas las Empresas' },
                ...aliadosList.map((al) => ({
                  value: String(al.id),
                  label: al.razon_social,
                })),
              ]}
              style={{ width: '210px' }}
            />
          )}
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div
        className="custom-scrollbar"
        style={{
          background: 'rgba(188, 192, 215, 0.09)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(232, 114, 23, 0.15)',
                  color: '#fff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
                  fontSize: '0.735rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '14px 18px' }}>N° Ficha</th>
                <th style={{ padding: '14px 18px' }}>Fecha</th>
                <th style={{ padding: '14px 18px' }}>Cliente Principal</th>
                <th style={{ padding: '14px 18px' }}>Asesor</th>
                {tipo === 'aliados' && <th style={{ padding: '14px 18px' }}>Empresa Aliada</th>}
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Pax</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Total Venta</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Pagado / Saldo</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tipo === 'aliados' ? 10 : 9} style={{ padding: '60px', textAlign: 'center', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span className="spinner" />
                      <span>Cargando listado de ventas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={tipo === 'aliados' ? 10 : 9} style={{ padding: '60px', textAlign: 'center', color: '#FFFFFF' }}>
                    No se encontraron ventas para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredVentas.map((v) => {
                  const isConfirmed = v.estado === 'Confirmada';
                  const saldo = v.saldo_pendiente || 0;
                  const isPaid = saldo <= 0.01 && (v.total_pagado || 0) > 0;

                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.22)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Número de ficha */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '700', color: '#FFFFFF', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {v.numero_ficha || v.id}
                        </div>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1', fontSize: '0.825rem' }}>
                        {v.fecha_creacion ? new Date(v.fecha_creacion).toLocaleDateString('es-VE') : 'N/A'}
                      </td>

                      {/* Cliente Principal */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {v.cliente?.nombre_completo || 'Cliente General'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {v.cliente?.documento ? `${v.cliente.tipo_documento || 'V'}-${v.cliente.documento}` : 'Sin documento'}
                        </div>
                      </td>

                      {/* Asesor */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#CBD5E1', fontWeight: '500' }}>
                          {v.asesor?.name || 'Asesor'}
                        </div>
                        {v.freelancer && (
                          <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>
                            {v.freelancer.nombre}
                          </div>
                        )}
                      </td>

                      {/* Empresa Aliada (si tipo === 'aliados') */}
                      {tipo === 'aliados' && (
                        <td style={{ padding: '14px 18px' }}>
                          {v.aliado ? (
                            <div>
                              <div style={{ fontWeight: '600', color: '#38BDF8', fontSize: '0.825rem' }}>
                                {v.aliado.razon_social}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{v.aliado.rif}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                      )}

                      {/* Pasajeros (Pax) */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', color: '#CBD5E1' }}>
                        {v.pax_total || 1}
                      </td>

                      {/* Total Venta */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: '700', color: '#E87217', fontSize: '0.925rem' }}>
                        ${Number(v.total_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Pagado / Saldo */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#4ADE80', fontWeight: '600' }}>
                          Pagado: ${Number(v.total_pagado || 0).toFixed(2)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: saldo > 0.01 ? '#F87171' : '#94A3B8',
                            marginTop: '2px',
                          }}
                        >
                          Saldo: ${Number(saldo).toFixed(2)}
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.725rem',
                              fontWeight: '700',
                              background: isConfirmed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(232, 114, 23, 0.2)',
                              color: isConfirmed ? '#4ADE80' : '#FB923C',
                              border: `1px solid ${isConfirmed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(232, 114, 23, 0.4)'}`,
                            }}
                          >
                            {isConfirmed ? 'Venta' : v.estado}
                          </span>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '6px',
                              fontSize: '0.675rem',
                              fontWeight: '600',
                              background: isPaid ? 'rgba(59, 130, 246, 0.2)' : (v.total_pagado > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.15)'),
                              color: isPaid ? '#60A5FA' : (v.total_pagado > 0 ? '#FBBF24' : '#94A3B8'),
                            }}
                          >
                            {v.estado_pago || 'Pendiente'}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* Editar Cotización / Venta */}
                          <button
                            type="button"
                            onClick={() => setEditingVentaId(v.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s',
                            }}
                            title="Editar cotización / venta"
                          >
                            👁️
                          </button>

                          {/* Registrar Pago */}
                          <button
                            type="button"
                            onClick={() => setSelectedVentaPago(v)}
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.35)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              color: '#4ADE80',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s',
                            }}
                            title="Registrar abono o liquidación"
                          >
                            💵
                          </button>

                          {/* Confirmar Venta (si no está confirmada) */}
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() => setConfirmingVenta(v)}
                              style={{
                                background: 'rgba(232, 114, 23, 0.15)',
                                border: '1px solid rgba(232, 114, 23, 0.35)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                color: '#FB923C',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s',
                              }}
                              title="Confirmar venta formalmente"
                            >
                              ✅
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Venta */}
      {selectedVentaDetalle && (
        <DetalleVentaModal
          isOpen={true}
          venta={selectedVentaDetalle}
          onClose={() => setSelectedVentaDetalle(null)}
          onRegistrarPago={(v) => {
            setSelectedVentaDetalle(null);
            setSelectedVentaPago(v);
          }}
        />
      )}

      {/* Modal de Registro de Pago */}
      {selectedVentaPago && (
        <RegistrarPagoModal
          isOpen={true}
          venta={selectedVentaPago}
          onClose={() => setSelectedVentaPago(null)}
          onSuccess={fetchVentas}
        />
      )}

      {/* Modal de Confirmación de Venta */}
      {confirmingVenta && (
        <ConfirmationModal
          isOpen={true}
          type="success"
          title="Confirmar Venta"
          subtitle={`¿Desea confirmar formalmente la ficha ${confirmingVenta.numero_ficha || confirmingVenta.id}?`}
          content="Al confirmar esta cotización como venta formal, quedará habilitada para seguimiento operativo y facturación definitiva."
          confirmText="Sí, Confirmar Venta"
          isConfirming={isConfirmingSale}
          onConfirm={handleConfirmSale}
          onClose={() => setConfirmingVenta(null)}
        />
      )}
    </div>
  );
}
