import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { InformeCotizacionRapidaModal } from './modals';
import imgSearch from '../../assets/lupa.svg';
import imgAgregar from '../../assets/Agregar.svg';
import Badge from '../common/Badge';

export default function RegistroCotizaciones({ user, onNuevaCotizacion }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos'); // 'todos' | 'formal' | 'rapida'
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  // Cargar registro de cotizaciones desde el backend
  const fetchCotizaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/v1/cotizaciones');
      setCotizaciones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando registro de cotizaciones:', err);
      setError('No se pudo cargar el registro de cotizaciones. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  // Filtrado reactivo en memoria
  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter(item => {
      // Filtro por tipo
      if (filterTipo !== 'todos' && item.tipo_registro !== filterTipo) {
        return false;
      }

      // Filtro por búsqueda
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const loc = (item.localizador || '').toLowerCase();
      const ficha = String(item.numero_ficha || '').toLowerCase();
      const cliente = (item.cliente?.nombre_completo || item.cliente?.nombres || '').toLowerCase();
      const doc = (item.cliente?.documento || '').toLowerCase();
      const asesor = (item.asesor || '').toLowerCase();

      return (
        loc.includes(term) ||
        ficha.includes(term) ||
        cliente.includes(term) ||
        doc.includes(term) ||
        asesor.includes(term)
      );
    });
  }, [cotizaciones, filterTipo, searchTerm]);

  // Métricas rápidas
  const totalCotizaciones = cotizaciones.length;
  const totalFormales = cotizaciones.filter(c => c.tipo_registro === 'formal').length;
  const totalRapidas = cotizaciones.filter(c => c.tipo_registro === 'rapida').length;
  const montoTotalCotizado = cotizaciones.reduce((acc, c) => acc + (Number(c.total_usd) || 0), 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '30px',
      }}
    >
      {/* Header Bar */}
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
            <h1
              style={{
                margin: 0,
                fontSize: '1.45rem',
                fontWeight: '700',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span>Registro de Cotizaciones Guardadas</span>
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchCotizaciones}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            title="Recargar cotizaciones guardadas"
          >
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Total Cotizaciones</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', marginTop: '4px' }}>
            {totalCotizaciones}
          </div>
        </div>

        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Cotizaciones Formales</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38BDF8', marginTop: '4px' }}>
            {totalFormales}
          </div>
        </div>

        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Cotizaciones Rápidas</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FB923C', marginTop: '4px' }}>
            {totalRapidas}
          </div>
        </div>

        <div
          style={{
            background: 'rgb(6, 18, 81)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Monto Total Cotizado</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4ADE80', marginTop: '4px' }}>
            ${montoTotalCotizado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgb(6, 18, 81)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '12px 18px',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '8px 14px',
            flex: '1 1 320px',
            maxWidth: '500px',
          }}
        >
          <img src={imgSearch} alt="Buscar" style={{ width: '16px', height: '16px', opacity: 0.7 }} />
          <input
            type="text"
            placeholder="Buscar por cliente, cédula, localizador o asesor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              width: '100%',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'formal', label: 'Formales' },
            { id: 'rapida', label: 'Rápidas' },
          ].map(tab => {
            const active = filterTipo === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTipo(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: active ? '1px solid #E87217' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: active ? 'rgba(232, 114, 23, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.8125rem',
                  fontWeight: active ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Table Container */}
      <div
        className="custom-scrollbar"
        style={{
          background: 'rgba(188, 192, 215, 0.09)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(232, 114, 23, 0.2)',
                borderTop: '3px solid #E87217',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 14px auto',
              }}
            />
            <span>Cargando registro de cotizaciones guardadas...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : filteredCotizaciones.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#FFFFFF', fontSize: '1.1rem' }}>
              No se encontraron cotizaciones registradas
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {searchTerm
                ? 'No hay registros que coincidan con la búsqueda actual.'
                : 'Aún no has guardado cotizaciones. Todas las cotizaciones creadas aparecerán automáticamente aquí.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(232, 114, 23, 0.15)',
                    color: '#fff',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
                    textTransform: 'uppercase',
                    fontSize: '0.735rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '14px 18px' }}>Localizador / Ficha</th>
                  <th style={{ padding: '14px 18px' }}>Fecha y Hora</th>
                  <th style={{ padding: '14px 18px' }}>Cliente Principal</th>
                  <th style={{ padding: '14px 18px' }}>Asesor</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Pax</th>
                  <th style={{ padding: '14px 18px' }}>Total Cotizado</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Tipo</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCotizaciones.map((cotiz, idx) => {
                  const clienteNombre = cotiz.cliente?.nombre_completo || cotiz.cliente?.nombres || 'Cliente General';
                  const clienteDoc = cotiz.cliente?.documento ? `${cotiz.cliente?.tipo_documento || 'V'}-${cotiz.cliente.documento}` : '';
                  const totalPax = cotiz.pax?.total || (cotiz.pax?.adultos || 1);
                  const isFormal = cotiz.tipo_registro === 'formal';

                  return (
                    <tr
                      key={cotiz.uid || cotiz.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.22)',
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(232, 114, 23, 0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)'}
                    >
                      {/* Localizador */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: '700',
                              color: '#FFFFFF',
                              fontFamily: 'monospace',
                              fontSize: '0.9rem',
                            }}
                          >
                            {cotiz.localizador}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#b9c8dd' }}>
                          Ficha #{cotiz.numero_ficha || cotiz.id}
                        </div>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1', whiteSpace: 'nowrap' }}>
                        <div>{new Date(cotiz.fecha).toLocaleDateString('es-VE')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#b9c8dd' }}>
                          {new Date(cotiz.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {clienteNombre}
                        </div>
                        {clienteDoc && (
                          <div style={{ fontSize: '0.75rem', color: '#b9c8dd' }}>
                            {clienteDoc}
                          </div>
                        )}
                      </td>

                      {/* Asesor */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1' }}>
                        {cotiz.asesor || 'Asesor'}
                      </td>

                      {/* Pax */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <Badge status="badge-neutral">{totalPax} Pax</Badge>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '800', color: '#E87217', fontSize: '0.95rem' }}>
                          ${Number(cotiz.total_usd || 0).toFixed(2)} USD
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#b9c8dd' }}>
                          Ref. Bs. {(Number(cotiz.total_usd || 0) * 62.5).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: isFormal ? 'rgba(37, 99, 235, 0.2)' : 'rgba(232, 114, 23, 0.2)',
                            color: isFormal ? '#60A5FA' : '#FB923C',
                            border: `1px solid ${isFormal ? 'rgba(37, 99, 235, 0.4)' : 'rgba(232, 114, 23, 0.4)'}`,
                          }}
                        >
                          {isFormal ? 'Formal' : 'Rápida'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCotizacion(cotiz)}
                          title="Generar y visualizar el documento de Cotización Rápida"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            background: 'rgba(232, 114, 23, 0.15)',
                            border: '1px solid rgba(232, 114, 23, 0.45)',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#E87217';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(232, 114, 23, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>Generar Cotización Rápida</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Documento Cotización Rápida */}
      <InformeCotizacionRapidaModal
        isOpen={!!selectedCotizacion}
        onClose={() => setSelectedCotizacion(null)}
        cotizacion={selectedCotizacion}
        tasaReferencialVES={62.50}
      />
    </div>
  );
}
