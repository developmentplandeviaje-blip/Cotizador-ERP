import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import UserAliadoModal from './UserAliadoModal';
import AliadoVendedoresModal from './AliadoVendedoresModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

export default function UserAliadoList({ user: currentUser }) {
  const [aliados, setAliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aliadoToEdit, setAliadoToEdit] = useState(null);

  const [isVendedoresModalOpen, setIsVendedoresModalOpen] = useState(false);
  const [selectedAliadoForVendedores, setSelectedAliadoForVendedores] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchAliados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/users/aliados', {
        params: {
          search,
          status: selectedStatus !== '' ? selectedStatus : undefined,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_order: sortConfig.direction,
        },
      });
      setAliados(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando aliados:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedStatus, sortConfig]);

  useEffect(() => {
    fetchAliados();
  }, [fetchAliados]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: '6px' }}></span>;
    return (
      <span style={{ marginLeft: '6px', color: '#E87217', fontWeight: 'bold' }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const handleOpenCreate = () => {
    setAliadoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (aliado) => {
    setAliadoToEdit(aliado);
    setIsModalOpen(true);
  };

  const handleManageVendedores = (aliado) => {
    setSelectedAliadoForVendedores(aliado);
    setIsVendedoresModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setAliadoToEdit(null);
    setSuccessBanner(aliadoToEdit ? 'Empresa Aliada actualizada exitosamente.' : 'Empresa Aliada registrada exitosamente.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchAliados();
  };

  const handleToggleStatus = async (aliado) => {
    setTogglingId(aliado.id);
    try {
      await axios.patch(`/v1/users/aliados/${aliado.id}/toggle-status`);
      setSuccessBanner(`Estado de ${aliado.razon_social} actualizado.`);
      setTimeout(() => setSuccessBanner(''), 3000);
      fetchAliados();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handlePromptDelete = (aliado) => {
    setDeleteError('');
    setDeleteTarget(aliado);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`/v1/users/aliados/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner('Empresa Aliada eliminada exitosamente.');
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchAliados();
    } catch (err) {
      if (err.response?.status === 422) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar el aliado seleccionado.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#b9c8ddff', marginBottom: '6px', }}>
          <span>Usuarios</span>
          <span>›</span>
          <span style={{ color: '#E87217', fontWeight: 600 }}>Aliados</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
          Empresas Aliadas
        </h1>
      </div>

      {successBanner && (
        <div style={{
          background: 'rgba(21, 128, 61, 0.2)', border: '1px solid #16a34a', color: '#86efac',
          padding: '12px 18px', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner('')} style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', padding: '0px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-40%)', fontSize: '1rem' }}>
              <img src={imgSearch} alt="" style={{ width: '20px', height: '20px' }} />
            </span>
            <input
              type="text"
              className="erp-input"
              style={{ width: '100%', borderRadius: '9999px', background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)', height: '38px', paddingLeft: '40px', boxShadow: 'rgba(0, 0, 0, 0.4) 3px 3px 6px, rgba(255, 255, 255, 0.05) -3px -3px 6px', border: '1px solid rgb(255 255 255 / 56%)', color: '#FFFFFF' }}
              placeholder="Buscar aliado..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="erp-input"
              style={{ borderRadius: '9999px', background: 'linear-gradient(150deg, rgb(255 255 255 / 8%) 1%, rgb(0 17 89 / 65%) 73%, rgb(255 255 255 / 39%) 108%)', height: '38px', paddingLeft: '14px', paddingRight: '36px', border: '1px solid rgb(255 255 255 / 56%)', color: selectedStatus ? '#FFFFFF' : '#b9c8ddff', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 12px) center', backgroundSize: '16px' }}
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}>
              <option value="" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Todos los estados</option>
              <option value="1" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Habilitados</option>
              <option value="0" style={{ backgroundColor: '#101c44', color: '#FFF' }}>Deshabilitados</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
            <button
              className="btn-secondary"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="Agregar empresa aliada">
              <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className='title-input'>Agregar</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(188, 192, 215, 0.09)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', overflow: 'visible', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#e8721726' }}>
              <th onClick={() => handleSort('razon_social')} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', borderTopLeftRadius: '16px', cursor: 'pointer' }}>
                Razón Social {getSortIndicator('razon_social')}
              </th>
              <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Contacto / Teléfono
              </th>
              <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Vendedores
              </th>
              <th onClick={() => handleSort('status')} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
                Estado {getSortIndicator('status')}
              </th>
              <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.84)', padding: '14px 16px', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', borderTopRightRadius: '16px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>Cargando aliados...</td></tr>
            ) : aliados.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>No se encontraron aliados</td></tr>
            ) : (
              aliados.map((item) => (
                <tr key={item.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(157, 175, 206, 0.17)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.875rem' }}>{item.razon_social}</div>
                    {item.rif && <div style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>RIF: {item.rif}</div>}
                  </td>
                  
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
                    <div style={{ color: '#E2E8F0', fontSize: '0.875rem' }}>{item.contacto_principal || '—'}</div>
                    <div style={{ color: '#b9c8ddff', fontSize: '0.8125rem' }}>{item.telefono || '—'}</div>
                  </td>
                  
                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
                    <button
                      onClick={() => handleManageVendedores(item)}
                      style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)', borderRadius: '6px', padding: '4px 10px', color: '#60A5FA', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {item.usuarios_count || 0} Vendedores
                    </button>
                  </td>

                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px' }}>
                    <button onClick={() => handleToggleStatus(item)} disabled={togglingId === item.id} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: togglingId === item.id ? 0.5 : 1 }}>
                      {item.status ? <Badge variant="success">Habilitado</Badge> : <Badge variant="error">Deshabilitado</Badge>}
                    </button>
                  </td>

                  <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.51)', padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => handleOpenEdit(item)} title="Editar Aliado" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '6px 10px', color: '#F8FAFC', fontSize: '0.8125rem', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => handlePromptDelete(item)} title="Eliminar Aliado" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '6px 10px', color: '#F87171', fontSize: '0.8125rem', cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {total > 0 && (
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Pagination page={page} lastPage={lastPage} setPage={setPage} />
          </div>
        )}
      </div>

      <UserAliadoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        aliadoToEdit={aliadoToEdit}
      />

      {isVendedoresModalOpen && selectedAliadoForVendedores && (
        <AliadoVendedoresModal
          isOpen={isVendedoresModalOpen}
          onClose={() => {
            setIsVendedoresModalOpen(false);
            fetchAliados(); // refresh counts
          }}
          aliado={selectedAliadoForVendedores}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción eliminará la empresa aliada"
        content={<p style={{ color: '#F8FAFC', margin: 0 }}>¿Desea eliminar a <strong>{deleteTarget?.razon_social}</strong>?</p>}
        confirmText="Eliminar Aliado"
      />
    </div>
  );
}
