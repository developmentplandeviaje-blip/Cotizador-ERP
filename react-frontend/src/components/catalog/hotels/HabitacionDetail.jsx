import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TarifaModal from './TarifaModal';

export default function HabitacionDetail({ hotel, onBack, isFreelancer = false }) {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [isTarifaModalOpen, setIsTarifaModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [search, setSearch] = useState('');

  const showAdolescentes = hotel?.edad_adolescentes && !hotel.edad_adolescentes.includes('0 - 0');

  useEffect(() => {
    if (hotel?.id) {
      fetchHabitaciones();
    }
  }, [hotel]);

  const fetchHabitaciones = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/v1/catalog/hoteles/${hotel.id}/habitaciones`);
      setHabitaciones(res.data.data || []);
      if (res.data.data?.length > 0 && !expandedRoomId) {
        setExpandedRoomId(res.data.data[0].id);
      }
    } catch (err) {
      console.error('Error cargando habitaciones', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTarifa = (roomId) => {
    setSelectedRoomId(roomId);
    setIsTarifaModalOpen(true);
  };

  const handleSaveTarifa = async (tarifaData) => {
    try {
      await axios.post('/v1/catalog/tarifas', {
        ...tarifaData,
        id_habitacion: selectedRoomId,
      });
      fetchHabitaciones();
    } catch (err) {
      console.error('Error creando tarifa', err);
      alert('Error al guardar tarifa.');
    }
  };

  const [sortConfig, setSortConfig] = useState({ key: 'posicion', direction: 'asc' });
  const [tarifaSortConfig, setTarifaSortConfig] = useState({ key: 'desde', direction: 'asc' });

  const filteredHabitaciones = habitaciones.filter(h =>
    h.habitacion.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortedTarifas = (tarifas) => {
    return [...(tarifas || [])].sort((a, b) => {
      let aValue = a[tarifaSortConfig.key];
      let bValue = b[tarifaSortConfig.key];
      if (aValue < bValue) return tarifaSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return tarifaSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key, isTarifa = false) => {
    if (isTarifa) {
      let direction = 'asc';
      if (tarifaSortConfig.key === key && tarifaSortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setTarifaSortConfig({ key, direction });
    } else {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    }
  };

  const getSortIndicator = (key, isTarifa = false) => {
    const config = isTarifa ? tarifaSortConfig : sortConfig;
    if (config.key !== key) return <span style={{opacity: 0.3, marginLeft: '4px'}}>↕</span>;
    return <span style={{marginLeft: '4px'}}>{config.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#F8FAFC' }}>
          Habitaciones “{hotel?.nombre}”
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              className="erp-input"
              placeholder="Buscar habitación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', borderRadius: '9999px', background: 'rgba(30, 41, 59, 0.6)' }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              🔍
            </span>
          </div>

          <button className="btn-secondary" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>

      {/* Rooms Table */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', userSelect: 'none' }}>
              <th onClick={() => handleSort('posicion')} style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: '600', cursor: 'pointer' }}>Posición{getSortIndicator('posicion')}</th>
              <th onClick={() => handleSort('habitacion')} style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: '600', cursor: 'pointer' }}>Habitación{getSortIndicator('habitacion')}</th>
              <th onClick={() => handleSort('por_defecto')} style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: '600', cursor: 'pointer' }}>Cotizador{getSortIndicator('por_defecto')}</th>
              <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: '600' }}>Nota</th>
              <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: '600', textAlign: 'right' }}>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Cargando habitaciones...
                </td>
              </tr>
            ) : filteredHabitaciones.length > 0 ? (
              filteredHabitaciones.map((hab) => {
                const isExpanded = expandedRoomId === hab.id;
                return (
                  <React.Fragment key={hab.id}>
                    <tr style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    }}>
                      <td style={{ padding: '14px 20px', color: '#94A3B8' }}>{hab.posicion}</td>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#FFFFFF' }}>{hab.habitacion}</td>
                      <td style={{ padding: '14px 20px', color: '#94A3B8' }}>{hab.por_defecto ? 'Por Defecto' : 'N/A'}</td>
                      <td style={{ padding: '14px 20px', color: '#94A3B8' }}>{hab.nota || 'Nota'}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => setExpandedRoomId(isExpanded ? null : hab.id)}
                          style={{
                            background: isExpanded ? '#E87217' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#FFFFFF',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>

                    {/* Accordion: Rates for this room (Page 21) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="5" style={{ padding: '0 20px 20px 20px', background: 'rgba(15, 23, 42, 0.4)' }}>
                          <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '16px',
                            marginTop: '10px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#E87217' }}>
                                Tarifario de la Habitación
                              </span>
                              <button
                                type="button"
                                className="btn-accent"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                onClick={() => handleAddTarifa(hab.id)}
                              >
                                + Agregar Tarifa
                              </button>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', userSelect: 'none' }}>
                                  <th onClick={() => handleSort('desde', true)} style={{ padding: '8px 10px', cursor: 'pointer' }}>Desde - Hasta{getSortIndicator('desde', true)}</th>
                                  <th onClick={() => handleSort('tipo', true)} style={{ padding: '8px 10px', cursor: 'pointer' }}>Tipo{getSortIndicator('tipo', true)}</th>
                                  <th style={{ padding: '8px 10px' }}>Niños gratis</th>
                                  <th style={{ padding: '8px 10px' }}>Noches gratis</th>
                                  <th onClick={() => handleSort('precio_adulto', true)} style={{ padding: '8px 10px', cursor: 'pointer' }}>Precio Adulto{getSortIndicator('precio_adulto', true)}</th>
                                  {showAdolescentes && <th onClick={() => handleSort('precio_adolescente', true)} style={{ padding: '8px 10px', cursor: 'pointer' }}>Precio Adolesc.{getSortIndicator('precio_adolescente', true)}</th>}
                                  <th onClick={() => handleSort('precio_nino', true)} style={{ padding: '8px 10px', cursor: 'pointer' }}>Precio Niño{getSortIndicator('precio_nino', true)}</th>
                                  {!isFreelancer && <th style={{ padding: '8px 10px' }}>Costo Adulto</th>}
                                  {!isFreelancer && showAdolescentes && <th style={{ padding: '8px 10px' }}>Costo Adolesc.</th>}
                                  {!isFreelancer && <th style={{ padding: '8px 10px' }}>Costo Niño</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {(!hab.tarifas || hab.tarifas.length === 0) ? (
                                  <tr>
                                    <td colSpan={4 + (showAdolescentes ? 1 : 0) + (!isFreelancer ? 2 + (showAdolescentes ? 1 : 0) : 0)} style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>
                                      No hay tarifas registradas en esta habitación.
                                    </td>
                                  </tr>
                                ) : (
                                  getSortedTarifas(hab.tarifas).map((t) => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                      <td style={{ padding: '10px', color: '#F8FAFC' }}>{t.desde} al {t.hasta}</td>
                                      <td style={{ padding: '10px', color: '#94A3B8' }}>{t.promocion ? 'Promo' : 'Normal'}</td>
                                      <td style={{ padding: '10px', color: '#94A3B8' }}>{t.ninos_gratis}</td>
                                      <td style={{ padding: '10px', color: '#94A3B8' }}>{t.noches_gratis}</td>
                                      <td style={{ padding: '10px', color: '#E87217', fontWeight: '600' }}>
                                        {t.precio_noche_adulto} {t.moneda}
                                      </td>
                                      {showAdolescentes && (
                                        <td style={{ padding: '10px', color: '#F8FAFC' }}>
                                          {t.precio_noche_adolescente || '0.00'} {t.moneda}
                                        </td>
                                      )}
                                      <td style={{ padding: '10px', color: '#F8FAFC' }}>
                                        {t.precio_noche_nino || '0.00'} {t.moneda}
                                      </td>
                                      {!isFreelancer && (
                                        <td style={{ padding: '10px', color: '#94A3B8' }}>
                                          {t.costo_noche_adulto || '0.00'} {t.moneda}
                                        </td>
                                      )}
                                      {!isFreelancer && showAdolescentes && (
                                        <td style={{ padding: '10px', color: '#94A3B8' }}>
                                          {t.costo_noche_adolescente || '0.00'} {t.moneda}
                                        </td>
                                      )}
                                      {!isFreelancer && (
                                        <td style={{ padding: '10px', color: '#94A3B8' }}>
                                          {t.costo_noche_nino || '0.00'} {t.moneda}
                                        </td>
                                      )}
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  No se encontraron habitaciones para este hotel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TarifaModal
        isOpen={isTarifaModalOpen}
        onClose={() => setIsTarifaModalOpen(false)}
        onSave={handleSaveTarifa}
        isFreelancer={isFreelancer}
        showAdolescentes={showAdolescentes}
      />
    </div>
  );
}
