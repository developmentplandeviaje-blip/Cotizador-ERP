import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UserAgenciaModal from './UserAgenciaModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgImprimir from '../../../assets/Imprimir.svg';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

const NIVELES = ['Administrador', 'Sub Gerente', 'Lider', 'Asesor'];

export default function UserAgenciaList({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
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
  const [successBanner, setSuccessBanner] = useState('');

  // Toggling status state
  const [togglingId, setTogglingId] = useState(null);

  // Commissions popover state
  const [hoveredComisiones, setHoveredComisiones] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/users/agencia', {
        params: {
          search,
          level: selectedLevel || undefined,
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
      console.error('Error cargando usuarios de agencia:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedLevel, selectedStatus, sortConfig]);

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
      return <span style={{ opacity: 0.3, marginLeft: '6px' }}>↕</span>;
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

  const handleOpenEdit = (userItem) => {
    setUserToEdit(userItem);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
    setSuccessBanner(userToEdit ? 'Usuario actualizado exitosamente.' : 'Usuario registrado exitosamente.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchUsers();
  };

  const handleToggleStatus = async (userItem) => {
    setTogglingId(userItem.id);
    try {
      await axios.patch(`/v1/users/agencia/${userItem.id}/toggle-status`);
      setSuccessBanner(`Estado de ${userItem.first_name} actualizado.`);
      setTimeout(() => setSuccessBanner(''), 3000);
      fetchUsers();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handlePromptDelete = (userItem) => {
    setDeleteError('');
    setDeleteTarget(userItem);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`/v1/users/agencia/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner('Usuario eliminado exitosamente.');
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors?.user) {
        setDeleteError(err.response.data.errors.user[0]);
      } else if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar el usuario seleccionado.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getLevelBadge = (lvl) => {
    switch (lvl) {
      case 'Administrador':
      case 'Admin':
        return <Badge variant="purple">{lvl}</Badge>;
      case 'Sub Gerente':
        return <Badge variant="info">{lvl}</Badge>;
      case 'Lider':
        return <Badge variant="warning">{lvl}</Badge>;
      case 'Asesor':
      default:
        return <Badge variant="success">{lvl}</Badge>;
    }
  };

  const getInitials = (first, last) => {
    const f = first ? first.charAt(0).toUpperCase() : '';
    const l = last ? last.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'U';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Success Alert Banner */}
      {successBanner && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '10px',
            color: '#86EFAC',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successBanner}</span>
          <button
            onClick={() => setSuccessBanner('')}
            style={{ background: 'none', border: 'none', color: '#86EFAC', cursor: 'pointer', fontSize: '1rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: '#94A3B8',
              marginBottom: '4px',
            }}
          >
            <span>Usuarios</span>
            <span>›</span>
            <span style={{ color: '#E87217', fontWeight: 600 }}>Agencia</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
            Usuarios de Agencia
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94A3B8' }}>
            Administración de asesores, comisiones y personal interno del ERP ({total} registrados)
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-toolbar"
            onClick={() => window.print()}
            title="Imprimir listado"
          >
            <img src={imgImprimir} alt="Imprimir" style={{ width: '18px', height: '18px' }} />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img src={imgAgregar} alt="Agregar" style={{ width: '18px', height: '18px' }} />
            <span>Agregar Usuario</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'rgba(30, 41, 59, 0.5)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="erp-input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
          <img
            src={imgSearch}
            alt="Buscar"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              opacity: 0.5,
            }}
          />
        </div>

        {/* Level Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(e.target.value);
              setPage(1);
            }}
            className="erp-input"
            style={{ width: '100%' }}
          >
            <option value="" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
              Todos los niveles
            </option>
            {NIVELES.map((lvl) => (
              <option key={lvl} value={lvl} style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="erp-input"
            style={{ width: '100%' }}
          >
            <option value="" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
              Todos los estados
            </option>
            <option value="1" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
              Habilitados
            </option>
            <option value="0" style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
              Deshabilitados
            </option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.75)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Usuario
                </th>
                <th
                  onClick={() => handleSort('first_name')}
                  style={{
                    padding: '14px 16px',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Nombre {getSortIndicator('first_name')}
                </th>
                <th
                  onClick={() => handleSort('email')}
                  style={{
                    padding: '14px 16px',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Email {getSortIndicator('email')}
                </th>
                <th
                  onClick={() => handleSort('level')}
                  style={{
                    padding: '14px 16px',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Nivel / Rol {getSortIndicator('level')}
                </th>
                <th style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Comisiones
                </th>
                <th
                  onClick={() => handleSort('status')}
                  style={{
                    padding: '14px 16px',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Estado {getSortIndicator('status')}
                </th>
                <th
                  onClick={() => handleSort('date_creation')}
                  style={{
                    padding: '14px 16px',
                    color: '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Registro {getSortIndicator('date_creation')}
                </th>
                <th style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    <div className="spinner-border" style={{ margin: '0 auto 12px auto' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Cargando usuarios de agencia...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>👤</span>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: '#E2E8F0' }}>
                      No se encontraron usuarios
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                      Intente ajustando los filtros de búsqueda o registre un nuevo usuario.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Avatar Initials */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#E87217',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        {getInitials(item.first_name, item.last_name)}
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FFFFFF', fontSize: '0.875rem' }}>
                      {item.full_name}
                    </td>

                    {/* Email */}
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.875rem' }}>
                      {item.email}
                    </td>

                    {/* Level */}
                    <td style={{ padding: '12px 16px' }}>
                      {getLevelBadge(item.level)}
                    </td>

                    {/* Commissions Preview */}
                    <td style={{ padding: '12px 16px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setHoveredComisiones(hoveredComisiones === item.id ? null : item.id)}
                        style={{
                          background: 'rgba(232, 114, 23, 0.1)',
                          border: '1px solid rgba(232, 114, 23, 0.3)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          color: '#E87217',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Ver %</span>
                      </button>

                      {hoveredComisiones === item.id && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '16px',
                            top: '40px',
                            backgroundColor: '#0F172A',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            padding: '12px',
                            zIndex: 100,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            minWidth: '200px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '6px',
                            fontSize: '0.75rem',
                          }}
                        >
                          {Object.entries(item.comisiones || {}).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ color: '#94A3B8', textTransform: 'capitalize' }}>{key}:</span>
                              <span style={{ color: '#E87217', fontWeight: 600 }}>{val}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status with Toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        title="Haga click para cambiar el estado"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          opacity: togglingId === item.id ? 0.5 : 1,
                        }}
                      >
                        {item.status ? (
                          <Badge variant="success">Habilitado</Badge>
                        ) : (
                          <Badge variant="danger">Deshabilitado</Badge>
                        )}
                      </button>
                    </td>

                    {/* Date Creation */}
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                      {item.date_creation ? item.date_creation.split(' ')[0] : '—'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar usuario"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: '#E2E8F0',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          ✎ Editar
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handlePromptDelete(item)}
                          title="Eliminar usuario"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            color: '#F87171',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              Mostrando {users.length} de {total} usuarios
            </span>
            <Pagination
              currentPage={page}
              lastPage={lastPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      <UserAgenciaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        userToEdit={userToEdit}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.75rem' }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#FFFFFF', fontWeight: 600 }}>
                  Confirmar Eliminación
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Esta acción intentará remover el usuario de la agencia
                </p>
              </div>
            </div>

            <p style={{ color: '#E2E8F0', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              ¿Está seguro de que desea eliminar a{' '}
              <strong style={{ color: '#FFFFFF' }}>{deleteTarget.full_name}</strong> (
              <span style={{ color: '#E87217' }}>{deleteTarget.email}</span>)?
            </p>

            {deleteError && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#FCA5A5',
                  fontSize: '0.8125rem',
                  lineHeight: '1.4',
                  marginBottom: '16px',
                }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#E2E8F0',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#DC2626',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
