import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import UserAgenciaModal from './UserAgenciaModal';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

const NIVELES = ['Admin', 'Sub Gerente', 'Lider', 'Asesor'];

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
  const [linksModalUser, setLinksModalUser] = useState(null);

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
      return <span style={{ opacity: 0.3, marginLeft: '6px' }}></span>;
    }
    return (
      <span style={{ marginLeft: '6px', color: '#E87217', fontWeight: 'bold' }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };


  const handleCopyLink = (item) => {
    setLinksModalUser(item);
  };

  const copySpecificLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setSuccessBanner('Enlace copiado al portapapeles.');
      setTimeout(() => setSuccessBanner(''), 3000);
    }).catch(err => console.error('Error al copiar: ', err));
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
        return <Badge variant="neutral" style={{ minWidth: '60px' }}>{lvl}</Badge>;
      case 'Sub Gerente':
        return <Badge variant="neutral" style={{ minWidth: '60px' }}>{lvl}</Badge>;
      case 'Lider':
        return <Badge variant="neutral" style={{ minWidth: '60px' }}>{lvl}</Badge>;
      case 'Asesor':
      default:
        return <Badge variant="neutral" style={{ minWidth: '60px' }}>{lvl}</Badge>;
    }
  };

  const getInitials = (first, last) => {
    const f = first ? first.charAt(0).toUpperCase() : '';
    const l = last ? last.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'U';
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#b9c8ddff', marginBottom: '6px', }}>
          <span>Usuarios</span>
          <span>›</span>
          <span style={{ color: '#E87217', fontWeight: 600 }}>Agencia</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
          Usuarios de Agencia
        </h1>
      </div>

      {/* Success Alert Banner */}
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
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-40%)',
              fontSize: '1rem',
            }}>
              <img src={imgSearch} alt="" style={{ width: '20px', height: '20px' }} />
            </span>
            <input
              type="text"
              className="erp-input"
              style={{
                width: '100%',
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '40px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                color: '#FFFFFF'
              }}
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Level Filter */}
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
                color: selectedLevel ? '#FFFFFF' : '#b9c8ddff',
                cursor: 'pointer',
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
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setPage(1);
              }}
            >
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>
                Todos los niveles
              </option>
              {NIVELES.map((lvl) => (
                <option key={lvl} value={lvl} style={{ backgroundColor: '#101c44', color: '#FFF' }}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
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
                color: selectedStatus ? '#FFFFFF' : '#b9c8ddff',
                cursor: 'pointer',
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
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}>
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>
                Todos los estados
              </option>
              <option value="1" style={{ backgroundColor: '#101c44', color: '#FFF' }}>
                Habilitados
              </option>
              <option value="0" style={{ backgroundColor: '#101c44', color: '#FFF' }}>
                Deshabilitados
              </option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
            <button
              className="btn-secondary"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Agregar nuevo usuario">
              <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className='title-input'>Agregar</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{
        background: 'rgba(188, 192, 215, 0.09)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'visible',

        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#e8721726' }}>
              <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', borderTopLeftRadius: '16px' }}>
                Usuario
              </th>
              <th onClick={() => handleSort('first_name')}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', }}>
                Nombre {getSortIndicator('first_name')}
              </th>
              <th onClick={() => handleSort('email')}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', }}>
                Email {getSortIndicator('email')}
              </th>
              <th onClick={() => handleSort('level')}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', }}>
                Nivel / Rol {getSortIndicator('level')}
              </th>
              <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Comisiones
              </th>
              <th onClick={() => handleSort('status')}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', }}>
                Estado {getSortIndicator('status')}
              </th>
              <th onClick={() => handleSort('date_creation')}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', }}>
                Registro {getSortIndicator('date_creation')}
              </th>
              <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', borderTopRightRadius: '16px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
                  <div className="spinner-border" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Cargando usuarios de agencia...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
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
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(157, 175, 206, 0.17)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Avatar Initials */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
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
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px', fontWeight: 600, color: '#FFFFFF', fontSize: '0.875rem' }}>
                    {item.full_name}
                  </td>

                  {/* Email */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px', color: '#b9c8ddff', fontSize: '0.875rem' }}>
                    {item.email}
                  </td>

                  {/* Level */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
                    {getLevelBadge(item.level)}
                  </td>

                  {/* Commissions Preview */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px', position: 'relative' }}>
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
                          backgroundColor: '#001231eb',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
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
                            <span style={{ color: '#b9c8ddff', textTransform: 'capitalize' }}>{key}:</span>
                            <span style={{ color: '#E87217', fontWeight: 600 }}>{val}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Status with Toggle */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
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
                        <Badge variant="error">Deshabilitado</Badge>
                      )}
                    </button>
                  </td>

                  {/* Date Creation */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px', color: '#b9c8ddff', fontSize: '0.8125rem' }}>
                    {item.date_creation ? item.date_creation.split(' ')[0] : '—'}
                  </td>

                  {/* Actions */}
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {/* Edit Button */}

                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item)}
                        title="Copiar enlace de métodos de pago"
                        style={{
                          background: 'rgba(37, 99, 235, 0.1)',
                          border: '1px solid rgba(37, 99, 235, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: '#60A5FA',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        Enlace
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Editar usuario"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: '#F8FAFC',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        Editar
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
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 0 && (
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.8125rem',
              color: '#94A3B8',
            }}
          >
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
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción intentará remover el usuario de la agencia"
        content={
          <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            ¿Está seguro de que desea eliminar a <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.full_name}</strong> (<span style={{ color: '#E87217' }}>{deleteTarget?.email}</span>)?
          </p>
        }
        confirmText="Eliminar Usuario"
      />
      {linksModalUser && (
        <Modal
          isOpen={true}
          onClose={() => setLinksModalUser(null)}
          title="Links para los Métodos de Pago"
          width="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Divisas:</span>
                <span style={{ fontSize: '0.875rem', color: '#60A5FA', wordBreak: 'break-all' }}>
                  https://cotizador.plandeviaje.com.ve/metodo-de-pago/{linksModalUser.id}/divisas
                </span>
              </div>
              <button
                type="button"
                onClick={() => copySpecificLink(`https://cotizador.plandeviaje.com.ve/metodo-de-pago/${linksModalUser.id}/divisas`)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px', color: '#F8FAFC' }}
                title="Copiar"
              >
                📋
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Bolivares:</span>
                <span style={{ fontSize: '0.875rem', color: '#60A5FA', wordBreak: 'break-all' }}>
                  https://cotizador.plandeviaje.com.ve/metodo-de-pago/{linksModalUser.id}/bolivares
                </span>
              </div>
              <button
                type="button"
                onClick={() => copySpecificLink(`https://cotizador.plandeviaje.com.ve/metodo-de-pago/${linksModalUser.id}/bolivares`)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px', color: '#F8FAFC' }}
                title="Copiar"
              >
                📋
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Bolivares Provisional:</span>
                <span style={{ fontSize: '0.875rem', color: '#60A5FA', wordBreak: 'break-all' }}>
                  https://cotizador.plandeviaje.com.ve/metodo-de-pago/{linksModalUser.id}/bolivares/provisional
                </span>
              </div>
              <button
                type="button"
                onClick={() => copySpecificLink(`https://cotizador.plandeviaje.com.ve/metodo-de-pago/${linksModalUser.id}/bolivares/provisional`)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px', color: '#F8FAFC' }}
                title="Copiar"
              >
                📋
              </button>
            </div>

          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn-form-cancel" onClick={() => setLinksModalUser(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}