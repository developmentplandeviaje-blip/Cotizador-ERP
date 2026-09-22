import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ExcursionModal from './ExcursionModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgImprimir from '../../../assets/Imprimir.svg';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

export default function ExcursionList({ user }) {
  const isFreelancer = user?.level === 'Freelancer';

  const [excursiones, setExcursiones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'tipo_excursion', direction: 'asc' });

  // Modals & Operations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [excursionToEdit, setExcursionToEdit] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Fetch ubicaciones for the filter dropdown
  useEffect(() => {
    axios.get('/v1/catalog/ubicaciones?all=1')
      .then((res) => {
        setUbicaciones(res.data.data || []);
      })
      .catch((err) => {
        console.error('Error cargando ubicaciones para filtro:', err);
      });
  }, []);

  // Fetch excursiones from API
  const fetchExcursiones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/catalog/excursiones', {
        params: {
          search,
          id_ubicacion: selectedUbicacion || undefined,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_dir: sortConfig.direction,
        },
      });
      setExcursiones(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando excursiones:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedUbicacion, sortConfig]);

  useEffect(() => {
    fetchExcursiones();
  }, [fetchExcursiones]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <span style={{ opacity: 0.35, marginLeft: '6px' }}></span>;
    }
    return (
      <span style={{ marginLeft: '6px', color: '#E87217', fontWeight: 'bold' }}>
        {sortConfig.direction === 'asc' ? '' : ''}
      </span>
    );
  };

  const handleOpenCreate = () => {
    setExcursionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setExcursionToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setExcursionToEdit(null);
    setSuccessBanner(excursionToEdit ? 'Excursión actualizada con éxito.' : 'Excursión creada con éxito.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchExcursiones();
  };

  const handlePromptDelete = (item) => {
    setDeleteError('');
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`/v1/catalog/excursiones/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner(`Excursión '${deleteTarget.tipo_excursion}' eliminada correctamente.`);
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchExcursiones();
    } catch (err) {
      console.error('Error al eliminar excursión:', err);
      if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar la excursión debido a registros asociados en ventas.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#b9c8ddff', marginBottom: '6px' }}>
          <span>Servicios</span>
          <span>›</span>
          <span style={{ color: '#E87217', fontWeight: '600' }}>Excursiones</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF' }}>
          Excursiones
        </h1>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div style={{
          background: 'rgba(21, 128, 61, 0.2)',
          border: '1px solid #16a34a',
          color: '#86efac',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.875rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{successBanner}</span>
          <button
            onClick={() => setSuccessBanner('')}
            style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Toolbar Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        padding: '0px 20px',
      }}>
        {/* Search & Location Filter */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-40%)',
              color: '#b9c8ddff',
              fontSize: '1rem',
            }}>
              <img src={imgSearch} alt="" style={{ width: '20px', height: '20px' }} />
            </span>
            <input
              type="text"
              className="erp-input"
              style={{
                paddingLeft: '36px',
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
              }}
              placeholder="Buscar excursión..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Location Dropdown Filter */}
          <div style={{ width: '220px' }}>
            <select
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                cursor: 'pointer',
                color: selectedUbicacion ? '#FFFFFF' : '#b9c8ddff',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 10px) center',
                backgroundSize: '16px',
              }}
              value={selectedUbicacion}
              onChange={(e) => {
                setSelectedUbicacion(e.target.value);
                setPage(1);
              }}
            >
              <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>
                Todas las Ubicaciones
              </option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id} style={{ background: '#101c44', color: '#FFFFFF' }}>
                  {u.ubicacion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
            <button
              className="btn-secondary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Imprimir listado"
            >
              <img src={imgImprimir} alt="Imprimir" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className='title-input'>Imprimir</span>
          </div>

          {!isFreelancer && (
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={handleOpenCreate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Agregar nueva excursión"
              >
                <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
              </button>
              <span className='title-input'>Agregar</span>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div style={{
        background: 'rgba(188, 192, 215, 0.09)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#e8721726', borderBottom: '1px solid rgba(255, 255, 255, 0.84)', userSelect: 'none' }}>
              <th
                onClick={() => handleSort('id')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '60px' }}
              >
                #{getSortIndicator('id')}
              </th>
              <th
                onClick={() => handleSort('tipo_excursion')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
              >
                Nombre / Excursión{getSortIndicator('tipo_excursion')}
              </th>
              <th
                onClick={() => handleSort('id_ubicacion')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '150px' }}
              >
                Ubicación{getSortIndicator('id_ubicacion')}
              </th>

              {/* Costos Netos: Ocultos estrictamente para Freelancers per US-03 */}
              {!isFreelancer && (
                <>
                  <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '150px' }}>
                    Costo (Ad / Niñ)
                  </th>
                  <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '130px', textAlign: 'center' }}>
                    Margen %
                  </th>
                </>
              )}

              <th
                onClick={() => handleSort('precio_adulto')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '160px' }}
              >
                {isFreelancer ? 'Tarifa Venta (Ad / Niñ)' : 'Precio Venta'}{getSortIndicator('precio_adulto')}
              </th>

              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', textAlign: 'center', width: '130px' }}>
                Desc. Referidos
              </th>

              {!isFreelancer && (
                <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', textAlign: 'right', width: '150px' }}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isFreelancer ? 5 : 7} style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
                  Cargando catálogo de excursiones...
                </td>
              </tr>
            ) : excursiones.length === 0 ? (
              <tr>
                <td colSpan={isFreelancer ? 5 : 7} style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
                  {search || selectedUbicacion
                    ? 'No se encontraron excursiones que coincidan con los filtros aplicados.'
                    : 'No hay excursiones registradas en el catálogo.'}
                </td>
              </tr>
            ) : (
              excursiones.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.51)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(232, 114, 23, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', color: '#b9c8ddff', fontWeight: '500' }}>
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#F8FAFC', fontWeight: '600' }}>
                    <div style={{ marginBottom: (item.tasa_portuaria_status && item.tasa_portuaria_monto !== null) ? '6px' : '0' }}>{item.tipo_excursion}</div>
                    {item.tasa_portuaria_status && item.tasa_portuaria_monto !== null && (
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          border: '1px solid #10B981',
                          color: '#2bc592ff',
                          fontSize: '0.65rem',
                          fontWeight: '500',
                          backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        }}>
                          Valor Tasa portuaria: {parseFloat(item.tasa_portuaria_monto)} $
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant="primary" style={{ fontSize: '0.75rem' }}>
                      {item.nombre_ubicacion || '—'}
                    </Badge>
                  </td>

                  {/* Columnas protegidas US-03 */}
                  {!isFreelancer && (
                    <>
                      <td style={{ padding: '14px 16px', color: '#F8FAFC' }}>
                        <div><strong style={{ color: '#F8FAFC' }}>Ad:</strong> ${parseFloat(item.costo_adulto || 0).toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#b9c8ddff' }}>Niñ: ${parseFloat(item.costo_nino || 0).toFixed(2)}</div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ color: '#10B981', fontWeight: '600', fontSize: '0.85rem' }}>
                          {item.porcentaje_adulto !== null ? `${parseFloat(item.porcentaje_adulto).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                    </>
                  )}

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ color: '#E87217', fontWeight: '700' }}>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.8rem' }}>Ad:</strong> ${parseFloat(item.precio_adulto || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#b9c8ddff' }}>
                      Niñ: ${parseFloat(item.precio_nino || 0).toFixed(2)}
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <Badge variant={item.aplica_descuento_referidos ? 'success' : 'neutral'} style={{ minWidth: '70px' }}>
                      {item.aplica_descuento_referidos ? 'Aplica (5%)' : 'No Aplica'}
                    </Badge>
                  </td>

                  {!isFreelancer && (
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#F8FAFC',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E87217')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handlePromptDelete(item)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table Footer with Pagination */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.8125rem',
          color: '#94A3B8',
        }}>
          <Pagination page={page} lastPage={lastPage} setPage={setPage} />
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <ExcursionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        excursionToEdit={excursionToEdit}
      />

      {/* Modal de Confirmación de Eliminación Segura */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 20, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px',
        }}>
          <div style={{
            background: '#101c44',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#FFFFFF' }}>
              Confirmar Eliminación
            </h3>

            {deleteError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}>
                {deleteError}
              </div>
            )}

            <div>
              <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar la excursión <strong style={{ color: '#E87217' }}>{deleteTarget.tipo_excursion}</strong>?
              </p>
              <p style={{ color: '#b9c8ddff', fontSize: '0.8125rem', marginTop: '8px' }}>
                Esta acción eliminará el registro del catálogo de forma permanente.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-form-prv"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    background: '#DC2626',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
