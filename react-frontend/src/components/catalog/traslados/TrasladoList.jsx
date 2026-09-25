import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TrasladoModal from './TrasladoModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgImprimir from '../../../assets/Imprimir.svg';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

export default function TrasladoList({ user }) {
  const isFreelancer = user?.level === 'Freelancer';

  const [traslados, setTraslados] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState('');
  const [selectedTipoServicio, setSelectedTipoServicio] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'ruta_origen', direction: 'asc' });

  // Modals & Operations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trasladoToEdit, setTrasladoToEdit] = useState(null);

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

  // Fetch traslados from API
  const fetchTraslados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/catalog/traslados', {
        params: {
          search,
          id_ubicacion: selectedUbicacion || undefined,
          tipo_servicio: selectedTipoServicio || undefined,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_dir: sortConfig.direction,
        },
      });
      setTraslados(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando traslados:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedUbicacion, selectedTipoServicio, sortConfig]);

  useEffect(() => {
    fetchTraslados();
  }, [fetchTraslados]);

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
        {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
      </span>
    );
  };

  const handleOpenCreate = () => {
    setTrasladoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setTrasladoToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setTrasladoToEdit(null);
    setSuccessBanner(trasladoToEdit ? 'Traslado actualizado con éxito.' : 'Traslado creado con éxito.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchTraslados();
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
      await axios.delete(`/v1/catalog/traslados/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner(`Traslado '${deleteTarget.ruta_origen} - ${deleteTarget.ruta_destino}' eliminado correctamente.`);
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchTraslados();
    } catch (err) {
      console.error('Error al eliminar traslado:', err);
      if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar el traslado debido a registros asociados en ventas.');
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
          <span style={{ color: '#E87217', fontWeight: '600' }}>Traslados</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF' }}>
          Traslados
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
            style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: '1.1rem' }}>
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
        {/* Search & Dropdown Filters */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
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
              placeholder="Buscar origen o destino..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Location Dropdown Filter */}
          <div style={{ width: '210px' }}>
            <select
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '14px',
                paddingRight: '36px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                cursor: 'pointer',
                color: selectedUbicacion ? '#FFFFFF' : '#b9c8ddff',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 12px) center',
                backgroundSize: '16px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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

          {/* Service Type Filter */}
          <div style={{ width: '180px' }}>
            <select
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '14px',
                paddingRight: '36px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                cursor: 'pointer',
                color: selectedTipoServicio ? '#FFFFFF' : '#b9c8ddff',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 12px) center',
                backgroundSize: '16px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              value={selectedTipoServicio}
              onChange={(e) => {
                setSelectedTipoServicio(e.target.value);
                setPage(1);
              }}
            >
              <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>
                Todos los Servicios
              </option>
              <option value="privado" style={{ background: '#101c44', color: '#FFFFFF' }}>
                Privado
              </option>
              <option value="compartido" style={{ background: '#101c44', color: '#FFFFFF' }}>
                Compartido
              </option>
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
                title="Agregar nuevo traslado"
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
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '50px' }}
              >
                #{getSortIndicator('id')}
              </th>
              <th
                onClick={() => handleSort('ruta_origen')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
              >
                Ruta (Origen → Destino){getSortIndicator('ruta_origen')}
              </th>
              <th
                onClick={() => handleSort('id_ubicacion')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '160px' }}
              >
                Ubicación{getSortIndicator('id_ubicacion')}
              </th>
              <th
                onClick={() => handleSort('tipo_servicio')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '130px', textAlign: 'center' }}
              >
                Tipo Servicio{getSortIndicator('tipo_servicio')}
              </th>

              {/* Costos Netos y Margen: Ocultos estrictamente para Freelancers per US-03 */}
              {!isFreelancer && (
                <>
                  <th
                    onClick={() => handleSort('costo')}
                    style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '120px' }}
                  >
                    Costo Neto{getSortIndicator('costo')}
                  </th>
                  <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '100px', textAlign: 'center' }}>
                    Margen %
                  </th>
                </>
              )}

              <th
                onClick={() => handleSort('precio_publico')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '140px' }}
              >
                {isFreelancer ? 'Tarifa Venta (USD)' : 'Precio Público'}{getSortIndicator('precio_publico')}
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
                  Cargando catálogo de traslados...
                </td>
              </tr>
            ) : traslados.length === 0 ? (
              <tr>
                <td colSpan={isFreelancer ? 5 : 7} style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
                  {search || selectedUbicacion || selectedTipoServicio
                    ? 'No se encontraron traslados que coincidan con los filtros aplicados.'
                    : 'No hay traslados registrados en el catálogo.'}
                </td>
              </tr>
            ) : (
              traslados.map((item, index) => (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{item.ruta_origen}</span>
                      <span style={{ color: '#E87217', fontWeight: 'bold' }}>→</span>
                      <span>{item.ruta_destino}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant="primary" style={{ fontSize: '0.75rem' }}>
                      {item.nombre_ubicacion || '—'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <Badge
                      variant={item.tipo_servicio === 'privado' ? 'success' : 'neutral'}
                      style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                    >
                      {item.tipo_servicio}
                    </Badge>
                  </td>

                  {/* Columnas protegidas US-03 */}
                  {!isFreelancer && (
                    <>
                      <td style={{ padding: '14px 16px', color: '#F8FAFC' }}>
                        ${parseFloat(item.costo || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ color: '#10B981', fontWeight: '600', fontSize: '0.85rem' }}>
                          {item.porcentaje !== null && item.porcentaje !== undefined
                            ? `${parseFloat(item.porcentaje).toFixed(1)}%`
                            : '—'}
                        </span>
                      </td>
                    </>
                  )}

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: '#E87217', fontWeight: '700', fontSize: '0.95rem' }}>
                      ${parseFloat(item.precio_publico || 0).toFixed(2)}
                    </span>
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
      <TrasladoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        trasladoToEdit={trasladoToEdit}
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
                ¿Estás seguro de que deseas eliminar el traslado <strong style={{ color: '#E87217' }}>{deleteTarget.ruta_origen} → {deleteTarget.ruta_destino}</strong>?
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
