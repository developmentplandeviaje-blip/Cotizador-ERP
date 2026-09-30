import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import UserFreelancerModal from './UserFreelancerModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';
import { showToast } from '../../../utils/toast';

export default function UserFreelancerList({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Toggling status state
  const [togglingId, setTogglingId] = useState(null);

  // Commissions popover state
  const [hoveredComisiones, setHoveredComisiones] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/users/freelancer', {
        params: {
          search,
          status: selectedStatus !== '' ? selectedStatus : undefined,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_order: sortConfig.direction,
        },
      });
      setUsers(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando usuarios freelancer:', err);
      showToast('Error al cargar la lista de freelancers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedStatus, sortConfig]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <span style={{ opacity: 0.3, marginLeft: '6px' }}></span>;
    }
    return (
      <span style={{ marginLeft: '6px', color: '#E87217', fontWeight: 'bold' }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setUserToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
    fetchUsers();
  };

  const handleToggleStatus = async (item) => {
    setTogglingId(item.id);
    try {
      await axios.patch(`/v1/users/freelancer/${item.id}/toggle-status`);
      showToast(`Estado del usuario '${item.full_name}' actualizado.`, 'success');
      fetchUsers();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      showToast('Error al cambiar el estado del usuario.', 'error');
    } finally {
      setTogglingId(null);
    }
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
      await axios.delete(`/v1/users/freelancer/${deleteTarget.id}`);
      showToast(`Usuario '${deleteTarget.full_name}' eliminado exitosamente.`, 'success');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      const errMsg = err.response?.data?.message || 'No se pudo eliminar el usuario freelancer.';
      setDeleteError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Header Breadcrumb */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#b9c8ddff', marginBottom: '6px' }}>
          <span>Usuarios</span>
          <span>›</span>
          <span style={{ color: '#E87217', fontWeight: '600' }}>Freelancer</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#F8FAFC' }}>
          Usuarios Freelancer
        </h1>
      </div>

      {/* Toolbar Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        padding: '0px 20px',
      }}>
        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
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
              placeholder="Buscar por nombre, correo o RIF..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Select Filter */}
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
                color: selectedStatus !== '' ? '#FFFFFF' : '#b9c8ddff',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'calc(100% - 12px) center',
                backgroundSize: '16px',
              }}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>Todos los estados</option>
              <option value="1" style={{ background: '#101c44', color: '#FFFFFF' }}>Habilitado</option>
              <option value="0" style={{ background: '#101c44', color: '#FFFFFF' }}>Deshabilitado</option>
            </select>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
            <button
              className="btn-secondary"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Agregar nuevo freelancer"
            >
              <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className='title-input'>Agregar</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94A3B8',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
            }}>
              <th style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                USUARIO {getSortIndicator('id')}
              </th>
              <th style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => handleSort('first_name')}>
                NOMBRE / EMAIL {getSortIndicator('first_name')}
              </th>
              <th style={{ padding: '16px 20px' }}>
                DATOS EMPRESA (FREELANCER)
              </th>
              <th style={{ padding: '16px 20px' }}>
                COMISIONES
              </th>
              <th style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                ESTADO {getSortIndicator('status')}
              </th>
              <th style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => handleSort('date_creation')}>
                REGISTRO {getSortIndicator('date_creation')}
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  Cargando usuarios freelancer...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((item) => {
                const freelancerObj = item.freelancer;
                return (
                  <tr key={item.id} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s',
                  }}>
                    {/* ID / Avatar */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: freelancerObj?.color_primario || '#E87217',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.8125rem',
                        }}>
                          {item.first_name ? item.first_name.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>#{item.id}</span>
                      </div>
                    </td>

                    {/* Name / Email */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: '#F8FAFC' }}>
                        {item.full_name}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                        {item.email}
                      </div>
                    </td>

                    {/* Empresa / Freelancer Info */}
                    <td style={{ padding: '16px 20px' }}>
                      {freelancerObj ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#E87217' }}>
                            {freelancerObj.nombre}
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                            {freelancerObj.rif ? `RIF: ${freelancerObj.rif}` : ''} {freelancerObj.telefono_1 ? `• ${freelancerObj.telefono_1}` : ''}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>Sin empresa asociada</span>
                      )}
                    </td>

                    {/* Comisiones Popover */}
                    <td style={{ padding: '16px 20px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setHoveredComisiones(hoveredComisiones === item.id ? null : item.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          color: '#E2E8F0',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Ver Comisiones
                      </button>

                      {hoveredComisiones === item.id && (
                        <div style={{
                          position: 'absolute',
                          left: '20px',
                          top: '45px',
                          backgroundColor: '#001231eb',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          padding: '12px',
                          zIndex: 100,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          minWidth: '220px',
                          fontSize: '0.75rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#E87217' }}>Configuración Comisiones:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoveredComisiones(null);
                              }}
                              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                          {Object.entries(item.comisiones || {}).map(([serv, pct]) => (
                            <div key={serv} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#E2E8F0' }}>
                              <span style={{ textTransform: 'capitalize' }}>{serv}:</span>
                              <span style={{ fontWeight: 'bold', color: '#10B981' }}>{pct}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Click para cambiar estado"
                      >
                        {item.status ? (
                          <Badge variant="success">Habilitado</Badge>
                        ) : (
                          <Badge variant="error">Deshabilitado</Badge>
                        )}
                      </button>
                    </td>

                    {/* Registration Date */}
                    <td style={{ padding: '16px 20px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                      {formatDate(item.date_creation)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleOpenEdit(item)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handlePromptDelete(item)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: '50px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#94A3B8' }}>
                      👤
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#F8FAFC' }}>
                      No se encontraron usuarios
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8', maxWidth: '400px' }}>
                      Intente ajustando los filtros de búsqueda o registre un nuevo freelancer.
                    </div>
                  </div>
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
        }}>
          <Pagination page={page} lastPage={lastPage} setPage={setPage} />
        </div>
      </div>

      {/* Freelancer Create / Edit Modal */}
      <UserFreelancerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        userToEdit={userToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción no se puede deshacer."
        content={
          <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            ¿Está seguro de que desea eliminar al usuario freelancer <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.full_name}</strong>?
          </p>
        }
        confirmText="Sí, Eliminar"
      />
    </div>
  );
}
