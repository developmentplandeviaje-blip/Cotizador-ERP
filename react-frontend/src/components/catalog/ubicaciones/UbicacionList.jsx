import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UbicacionModal from './UbicacionModal';
import Badge from '../../common/Badge';
import imgImprimir from '../../../assets/Imprimir.svg';
import imgAgregar from '../../../assets/Agregar.svg';

export default function UbicacionList({ user }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'ubicacion', direction: 'asc' });

  // Modals and operations state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ubicacionToEdit, setUbicacionToEdit] = useState(null);

  // Delete confirmation / warning state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const fetchUbicaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/catalog/ubicaciones', {
        params: {
          search,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_dir: sortConfig.direction,
        },
      });
      setUbicaciones(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando ubicaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortConfig]);

  useEffect(() => {
    fetchUbicaciones();
  }, [fetchUbicaciones]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <span style={{ opacity: 0.35, marginLeft: '6px' }}>↕</span>;
    }
    return (
      <span style={{ marginLeft: '6px', color: '#E87217', fontWeight: 'bold' }}>
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const handleOpenCreate = () => {
    setUbicacionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ubicacion) => {
    setUbicacionToEdit(ubicacion);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setUbicacionToEdit(null);
    setSuccessBanner(ubicacionToEdit ? 'Ubicación actualizada con éxito.' : 'Ubicación creada con éxito.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchUbicaciones();
  };

  const handlePromptDelete = (ubicacion) => {
    setDeleteError('');
    setDeleteTarget(ubicacion);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`/v1/catalog/ubicaciones/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner(`Ubicación '${deleteTarget.ubicacion}' eliminada correctamente.`);
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchUbicaciones();
    } catch (err) {
      console.error('Error al eliminar ubicación:', err);
      if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar la ubicación debido a dependencias asociadas.');
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
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '6px' }}>
          <span>Servicios</span>
          <span>›</span>
          <span style={{ color: '#E87217', fontWeight: '600' }}>Ubicaciones</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF' }}>
          Ubicaciones
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
          Catálogo maestro de destinos y ubicaciones geográficas asignadas a hoteles, traslados y servicios.
        </p>
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
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <span style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94A3B8',
            fontSize: '1rem',
          }}>
            🔍
          </span>
          <input
            type="text"
            className="input-search"
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px',
              boxSizing: 'border-box',
              fontSize: '0.875rem',
            }}
            placeholder="Buscar por nombre de ubicación..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Buttons Action Group */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-print"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <img src={imgImprimir} alt="Imprimir" style={{ width: '16px', height: '16px' }} />
            <span>Imprimir</span>
          </button>

          <button
            className="btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <img src={imgAgregar} alt="Agregar" style={{ width: '16px', height: '16px' }} />
            <span>+ Agregar Ubicación</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#e8721726', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', userSelect: 'none' }}>
              <th
                onClick={() => handleSort('id')}
                style={{ padding: '14px 18px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '80px' }}
              >
                #{getSortIndicator('id')}
              </th>
              <th
                onClick={() => handleSort('ubicacion')}
                style={{ padding: '14px 18px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
              >
                Nombre de la Ubicación{getSortIndicator('ubicacion')}
              </th>
              <th
                onClick={() => handleSort('hoteles_count')}
                style={{ padding: '14px 18px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', textAlign: 'center', width: '170px' }}
              >
                Hoteles Asociados{getSortIndicator('hoteles_count')}
              </th>
              <th
                onClick={() => handleSort('date_creation')}
                style={{ padding: '14px 18px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer', width: '200px' }}
              >
                Fecha de Creación{getSortIndicator('date_creation')}
              </th>
              <th style={{ padding: '14px 18px', color: '#FFFFFF', fontWeight: '600', textAlign: 'right', width: '140px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  Cargando ubicaciones...
                </td>
              </tr>
            ) : ubicaciones.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  {search ? 'No se encontraron ubicaciones que coincidan con la búsqueda.' : 'No hay ubicaciones registradas en el catálogo.'}
                </td>
              </tr>
            ) : (
              ubicaciones.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(232, 114, 23, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: '500' }}>
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#F8FAFC', fontWeight: '600' }}>
                    {item.ubicacion}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                    <Badge variant={item.hoteles_count > 0 ? 'success' : 'neutral'}>
                      {item.hoteles_count} {item.hoteles_count === 1 ? 'hotel' : 'hoteles'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#b9c8dd' }}>
                    {item.date_creation || '—'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
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
          <div>
            Mostrando {ubicaciones.length} de {total} ubicaciones registradas
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: page <= 1 ? '#64748B' : '#FFFFFF',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ‹ Anterior
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: '#F8FAFC' }}>
              Página {page} de {lastPage || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: page >= lastPage ? '#64748B' : '#FFFFFF',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: page >= lastPage ? 'not-allowed' : 'pointer',
              }}
            >
              Siguiente ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <UbicacionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        ubicacionToEdit={ubicacionToEdit}
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
              {deleteTarget.hoteles_count > 0 ? 'Acción no permitida' : 'Confirmar Eliminación'}
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

            {deleteTarget.hoteles_count > 0 ? (
              <div>
                <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  La ubicación <strong style={{ color: '#E87217' }}>{deleteTarget.ubicacion}</strong> no puede ser eliminada porque tiene <strong style={{ color: '#10B981' }}>{deleteTarget.hoteles_count} hotel(es) asociado(s)</strong>.
                </p>
                <p style={{ color: '#94A3B8', fontSize: '0.8125rem', marginTop: '8px' }}>
                  Para eliminar esta ubicación, primero debes reasignar o eliminar los hoteles que dependen de ella en el catálogo.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  ¿Estás seguro de que deseas eliminar la ubicación <strong style={{ color: '#E87217' }}>{deleteTarget.ubicacion}</strong>?
                </p>
                <p style={{ color: '#94A3B8', fontSize: '0.8125rem', marginTop: '8px' }}>
                  Esta acción eliminará el registro de forma permanente.
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
