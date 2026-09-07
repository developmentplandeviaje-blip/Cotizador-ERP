import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Badge from '../../common/Badge';
import HotelModal from './HotelModal';
import HabitacionDetail from './HabitacionDetail';

export default function HotelList({ user }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [activeMenuHotelId, setActiveMenuHotelId] = useState(null);
  const [showDescuentoMenu, setShowDescuentoMenu] = useState(false);

  // Modals and views state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState(null);
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);

  const isFreelancer = user?.level === 'Freelancer';

  useEffect(() => {
    fetchHotels();
  }, [page, search]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/catalog/hoteles', {
        params: {
          search,
          page,
          per_page: 10,
        }
      });
      setHotels(res.data.data || []);
      if (res.data.meta) {
        setLastPage(res.data.meta.last_page);
      }
    } catch (err) {
      console.error('Error cargando hoteles', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (hotel) => {
    try {
      await axios.patch(`/v1/catalog/hoteles/${hotel.id}/toggle-status`);
      fetchHotels();
    } catch (err) {
      console.error('Error alternando estado', err);
    }
  };

  const handleDelete = async (hotel) => {
    if (!window.confirm(`¿Está seguro de eliminar el hotel "${hotel.nombre}"?`)) return;
    try {
      await axios.delete(`/v1/catalog/hoteles/${hotel.id}`);
      fetchHotels();
    } catch (err) {
      console.error('Error eliminando hotel', err);
      alert('No se pudo eliminar el hotel.');
    }
  };

  // If a hotel was selected to view rooms (Pages 20-21)
  if (selectedHotelForRooms) {
    return (
      <HabitacionDetail
        hotel={selectedHotelForRooms}
        onBack={() => setSelectedHotelForRooms(null)}
        isFreelancer={isFreelancer}
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Top Header & Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#F8FAFC' }}>
          Hoteles
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search bar with magnifying glass (Page 3) */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              className="erp-input"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                paddingLeft: '36px',
                borderRadius: '9999px',
                background: 'rgba(30, 41, 59, 0.6)',
                height: '38px',
              }}
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.875rem' }}>
              🔍
            </span>
          </div>

          {/* Action Buttons: Imprimir, Descuento, Agregar (Page 3 & 16) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <button
              className="btn-secondary"
              title="Imprimir"
              onClick={() => window.print()}
              style={{ padding: '8px 14px', borderRadius: '9999px' }}
            >
              Imprimir
            </button>

            {/* Dropdown Descuento (Page 16) */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowDescuentoMenu(!showDescuentoMenu)}
                style={{ padding: '8px 14px', borderRadius: '9999px' }}
              >
                Descuento ▾
              </button>

              {showDescuentoMenu && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-dropdown)',
                  zIndex: 50,
                  width: '140px',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => { setShowDescuentoMenu(false); alert('Filtro por Descuento Al Contado aplicado'); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Al Contado
                  </button>
                  <button
                    onClick={() => { setShowDescuentoMenu(false); alert('Filtro por Descuento en Divisas aplicado'); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#F8FAFC',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Divisas
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setHotelToEdit(null);
                setIsModalOpen(true);
              }}
              style={{ padding: '8px 18px', borderRadius: '9999px' }}
            >
              + Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Main DataTable Card */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.65)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>#</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Nombre</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Tipo</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Ubicación</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Desc. Contado</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Desc. Divisas</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600' }}>Nota</th>
              <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: '600', textAlign: 'right' }}>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Cargando catálogo de hoteles...
                </td>
              </tr>
            ) : hotels.length > 0 ? (
              hotels.map((hotel, index) => {
                const isExpanded = expandedHotelId === hotel.id;
                const isMenuOpen = activeMenuHotelId === hotel.id;

                return (
                  <React.Fragment key={hotel.id}>
                    <tr style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      background: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      transition: 'background-color 0.15s',
                    }}>
                      <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{index + 1}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#FFFFFF' }}>{hotel.nombre}</td>
                      <td style={{ padding: '14px 16px', color: '#F8FAFC' }}>{hotel.tipo}</td>
                      <td style={{ padding: '14px 16px', color: '#F8FAFC' }}>{hotel.ubicacion_nombre}</td>
                      
                      {/* Desc. Contado Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <Badge variant={hotel.desc_contado.includes('%') ? 'warning' : 'neutral'}>
                          {hotel.desc_contado}
                        </Badge>
                      </td>

                      {/* Desc. Divisas Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <Badge variant={hotel.desc_divisas.includes('%') ? 'warning' : 'neutral'}>
                          {hotel.desc_divisas}
                        </Badge>
                      </td>

                      {/* Estado Badge (Clickable to toggle) */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          onClick={() => handleToggleStatus(hotel)}
                          style={{ cursor: 'pointer' }}
                          title="Haz clic para alternar estado"
                        >
                          <Badge variant={hotel.status ? 'success' : 'error'}>
                            {hotel.estado_label}
                          </Badge>
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {hotel.nota || 'Nota'}
                      </td>

                      {/* Options Column (3-dots and accordion toggle) */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* 3 dots action menu trigger */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setActiveMenuHotelId(isMenuOpen ? null : hotel.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                            >
                              ⋮
                            </button>

                            {/* Dropdown 3 dots menu (Page 17) */}
                            {isMenuOpen && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                boxShadow: 'var(--shadow-dropdown)',
                                zIndex: 60,
                                width: '130px',
                                overflow: 'hidden',
                                textAlign: 'left',
                              }}>
                                <button
                                  onClick={() => { setActiveMenuHotelId(null); window.print(); }}
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.8125rem', cursor: 'pointer' }}
                                >
                                  Imprimir
                                </button>
                                <button
                                  onClick={() => { setActiveMenuHotelId(null); setHotelToEdit(hotel); setIsModalOpen(true); }}
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#F8FAFC', fontSize: '0.8125rem', cursor: 'pointer' }}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => { setActiveMenuHotelId(null); setSelectedHotelForRooms(hotel); }}
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#2563EB', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Habitación
                                </button>
                                <button
                                  onClick={() => { setActiveMenuHotelId(null); handleDelete(hotel); }}
                                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#EF4444', fontSize: '0.8125rem', cursor: 'pointer' }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Accordion expand button (Page 18-19) */}
                          <button
                            onClick={() => setExpandedHotelId(isExpanded ? null : hotel.id)}
                            style={{
                              background: isExpanded ? '#E87217' : 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: '#FFFFFF',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Expanded Sub-Row (Pages 18-19) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="9" style={{ padding: '0 20px 16px 20px', background: 'rgba(15, 23, 42, 0.35)' }}>
                          <div style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            display: 'flex',
                            gap: '30px',
                            alignItems: 'center',
                            fontSize: '0.8125rem',
                            color: '#F8FAFC',
                          }}>
                            <div>
                              <span style={{ color: '#94A3B8' }}>Adolescente: </span>
                              <span style={{ fontWeight: '600' }}>{hotel.edad_adolescentes}</span>
                            </div>
                            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                              <span style={{ color: '#94A3B8' }}>Niño: </span>
                              <span style={{ fontWeight: '600' }}>{hotel.edad_ninos}</span>
                            </div>
                            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                              <span style={{ color: '#94A3B8' }}>Infante: </span>
                              <span style={{ fontWeight: '600' }}>{hotel.edad_infantes}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  No se encontraron hoteles registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.8125rem',
        }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{ background: 'none', border: 'none', color: page === 1 ? '#475569' : '#E87217', cursor: page === 1 ? 'default' : 'pointer' }}
          >
            «
          </button>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ background: 'none', border: 'none', color: page === 1 ? '#475569' : '#E87217', cursor: page === 1 ? 'default' : 'pointer' }}
          >
            ‹
          </button>

          {[...Array(lastPage)].map((_, i) => {
            const pageNum = i + 1;
            const isCurrent = page === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: isCurrent ? '1px solid #E87217' : 'none',
                  background: isCurrent ? 'rgba(232, 114, 23, 0.2)' : 'transparent',
                  color: isCurrent ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isCurrent ? '700' : '400',
                  cursor: 'pointer',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            style={{ background: 'none', border: 'none', color: page === lastPage ? '#475569' : '#E87217', cursor: page === lastPage ? 'default' : 'pointer' }}
          >
            ›
          </button>
          <button
            onClick={() => setPage(lastPage)}
            disabled={page === lastPage}
            style={{ background: 'none', border: 'none', color: page === lastPage ? '#475569' : '#E87217', cursor: page === lastPage ? 'default' : 'pointer' }}
          >
            »
          </button>
        </div>
      </div>

      {/* Hotel Create / Edit Wizard Modal */}
      <HotelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchHotels}
        hotelToEdit={hotelToEdit}
        isFreelancer={isFreelancer}
      />
    </div>
  );
}
