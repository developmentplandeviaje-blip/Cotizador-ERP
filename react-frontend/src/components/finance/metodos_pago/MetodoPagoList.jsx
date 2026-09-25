import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MetodoPagoModal from './MetodoPagoModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgImprimir from '../../../assets/Imprimir.svg';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

export default function MetodoPagoList({ user }) {
  const isFreelancer = user?.level === 'Freelancer';

  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metodoToEdit, setMetodoToEdit] = useState(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Toggling status
  const [togglingId, setTogglingId] = useState(null);

  // Hovered advisors popover
  const [hoveredAsesores, setHoveredAsesores] = useState(null);

  const fetchMetodos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/finance/metodos-pago', {
        params: {
          search,
          tipo: selectedTipo || undefined,
          status: selectedStatus !== '' ? selectedStatus : undefined,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_order: sortConfig.direction,
        },
      });
      setMetodos(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando métodos de pago:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedTipo, selectedStatus, sortConfig]);

  useEffect(() => {
    fetchMetodos();
  }, [fetchMetodos]);

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
    setMetodoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setMetodoToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setMetodoToEdit(null);
    setSuccessBanner(metodoToEdit ? 'Método de pago actualizado exitosamente.' : 'Método de pago creado exitosamente.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchMetodos();
  };

  const handleToggleStatus = async (item) => {
    if (isFreelancer) return;
    setTogglingId(item.id);
    try {
      await axios.patch(`/v1/finance/metodos-pago/${item.id}/toggle-status`);
      setSuccessBanner(`Estado de "${item.nombre}" actualizado.`);
      setTimeout(() => setSuccessBanner(''), 3000);
      fetchMetodos();
    } catch (err) {
      console.error('Error cambiando estado:', err);
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
      await axios.delete(`/v1/finance/metodos-pago/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner('Método de pago eliminado exitosamente.');
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchMetodos();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors?.metodo_pago) {
        setDeleteError(err.response.data.errors.metodo_pago[0]);
      } else if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar el método de pago seleccionado.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'banco':
        return <Badge variant="info">🏦 Banco</Badge>;
      case 'digital':
        return <Badge variant="purple">💳 Digital / Gateway</Badge>;
      case 'efectivo':
      default:
        return <Badge variant="success">💵 Efectivo</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Success Alert */}
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
          {/* Search */}
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
              placeholder="Buscar por nombre, titular o correo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
            />
          </div>

          {/* Tipo Filter */}
          <div style={{ width: '210px' }}>
            <select
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value);
                setPage(1);
              }}
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '14px',
                paddingRight: '36px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                color: selectedTipo ? '#FFFFFF' : '#b9c8ddff',
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
            >
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Todos los tipos</option>
              <option value="banco" style={{ backgroundColor: '#101c44', color: '#FFF' }}>🏦 Cuentas Bancarias</option>
              <option value="digital" style={{ backgroundColor: '#101c44', color: '#FFF' }}>💳 Digital / Gateway</option>
              <option value="efectivo" style={{ backgroundColor: '#101c44', color: '#FFF' }}>💵 Efectivo</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '180px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="erp-input"
              style={{
                borderRadius: '9999px',
                background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)',
                height: '38px',
                paddingLeft: '14px',
                paddingRight: '36px',
                boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px',
                border: '1px solid rgb(255 255 255 / 56%)',
                color: selectedStatus !== '' ? '#FFFFFF' : '#b9c8ddff',
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
            >
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Todos los estados</option>
              <option value="1" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Habilitados</option>
              <option value="0" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Deshabilitados</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {!isFreelancer && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Imprimir listado">
                <img src={imgImprimir} alt="Imprimir" style={{ width: '20px', height: '20px' }} />
              </button>
              <span className='title-input'>Imprimir</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={handleOpenCreate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Agregar nuevo mǸtodo">
                <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
              </button>
              <span className='title-input'>Agregar</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div style={{
        background: 'rgba(188, 192, 215, 0.09)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#e8721726', borderBottom: '1px solid rgba(255, 255, 255, 0.84)' }}>
                <th
                  onClick={() => handleSort('nombre')}
                  style={{
                    padding: '14px 16px',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Método de Pago {getSortIndicator('nombre')}
                </th>
                <th
                  onClick={() => handleSort('tipo')}
                  style={{
                    padding: '14px 16px',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Tipo {getSortIndicator('tipo')}
                </th>
                <th style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Detalles de la Cuenta
                </th>
                <th style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Asesores
                </th>
                <th
                  onClick={() => handleSort('status')}
                  style={{
                    padding: '14px 16px',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Estado {getSortIndicator('status')}
                </th>
                {!isFreelancer && (
                  <th style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isFreelancer ? 5 : 6} style={{ padding: '40px', textAlign: 'center', color: '#FFFFFF' }}>
                    <div className="spinner-border" style={{ margin: '0 auto 12px auto' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Cargando métodos de pago...</p>
                  </td>
                </tr>
              ) : metodos.length === 0 ? (
                <tr>
                  <td colSpan={isFreelancer ? 5 : 6} style={{ padding: '40px', textAlign: 'center', color: '#FFFFFF' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>💳</span>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: '#E2E8F0' }}>
                      No se encontraron métodos de pago
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                      Ajuste los filtros o registre un nuevo método de pago.
                    </p>
                  </td>
                </tr>
              ) : (
                metodos.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Name & Public Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.875rem' }}>
                        {item.nombre}
                      </div>
                      <div style={{ color: '#FFFFFF', fontSize: '0.8125rem', marginTop: '2px' }}>
                        {item.nombre_publico}
                      </div>
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: '12px 16px' }}>
                      {getTipoBadge(item.tipo)}
                    </td>

                    {/* Account Details */}
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                      {item.tipo === 'banco' && item.banco && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#E2E8F0', fontWeight: 500 }}>
                            {item.banco.titular} ({item.banco.tipo_documento}-{item.banco.documento})
                          </span>
                          {item.banco.numero_cuenta && (
                            <span style={{ color: '#E87217', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                              {item.banco.numero_cuenta}
                            </span>
                          )}
                          {item.banco.pago_movil_telefono && (
                            <span style={{ color: '#FFFFFF' }}>
                              Pago Móvil: {item.banco.pago_movil_telefono}
                            </span>
                          )}
                        </div>
                      )}

                      {item.tipo === 'digital' && item.digital && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#E2E8F0', fontWeight: 500 }}>
                            {item.digital.correo_cuenta}
                          </span>
                          <span style={{ color: '#A855F7' }}>
                            Comisión: {item.digital.comision_valor}% ({item.digital.tipo_comision})
                          </span>
                        </div>
                      )}

                      {item.tipo === 'efectivo' && (
                        <span style={{ color: '#FFFFFF' }}>
                          Recepción en taquilla / sede comercial
                        </span>
                      )}
                    </td>

                    {/* Assigned Advisors */}
                    <td style={{ padding: '12px 16px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setHoveredAsesores(hoveredAsesores === item.id ? null : item.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          color: '#E2E8F0',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>👥 {item.asesores?.length || 0} asesores</span>
                      </button>

                      {hoveredAsesores === item.id && (
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
                            minWidth: '220px',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#E87217', marginBottom: '6px' }}>
                            Asesores Habilitados:
                          </div>
                          {item.asesores && item.asesores.length > 0 ? (
                            item.asesores.map((a) => (
                              <div key={a.id} style={{ color: '#E2E8F0', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                • {a.asesor}
                              </div>
                            ))
                          ) : (
                            <span style={{ color: '#FFFFFF' }}>Sin asesores asignados.</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={isFreelancer || togglingId === item.id}
                        title={isFreelancer ? undefined : 'Click para cambiar estado'}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isFreelancer ? 'default' : 'pointer',
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

                    {/* Actions */}
                    {!isFreelancer && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Editar método"
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

                          <button
                            type="button"
                            onClick={() => handlePromptDelete(item)}
                            title="Eliminar método"
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
                    )}
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
            <span style={{ fontSize: '0.8125rem', color: '#FFFFFF' }}>
              Mostrando {metodos.length} de {total} métodos
            </span>
            <Pagination
              currentPage={page}
              lastPage={lastPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <MetodoPagoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        metodoToEdit={metodoToEdit}
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
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#FFFFFF' }}>
                  Esta acción intentará remover el método de pago del sistema
                </p>
              </div>
            </div>

            <p style={{ color: '#E2E8F0', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              ¿Está seguro de que desea eliminar{' '}
              <strong style={{ color: '#FFFFFF' }}>{deleteTarget.nombre}</strong>?
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
                {isDeleting ? 'Eliminando...' : 'Eliminar Método'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
