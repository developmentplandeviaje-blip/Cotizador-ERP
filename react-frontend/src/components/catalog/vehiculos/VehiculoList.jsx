import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import VehiculoModal from './VehiculoModal';
import VehiculoAgenciaModal from './VehiculoAgenciaModal';
import VehiculoTarifasModal from './VehiculoTarifasModal';
import Badge from '../../common/Badge';
import Pagination from '../../common/Pagination';
import imgImprimir from '../../../assets/Imprimir.svg';
import imgAgregar from '../../../assets/Agregar.svg';
import imgSearch from '../../../assets/lupa.svg';

export default function VehiculoList({ user }) {
  const isFreelancer = user?.level === 'Freelancer';

  const [vehiculos, setVehiculos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'marca', direction: 'asc' });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehiculoToEdit, setVehiculoToEdit] = useState(null);
  const [isAgenciaModalOpen, setIsAgenciaModalOpen] = useState(false);
  const [selectedVehiculoForTarifas, setSelectedVehiculoForTarifas] = useState(null);
  const [lastCreatedAgenciaId, setLastCreatedAgenciaId] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Fetch ubicaciones & agencias for dropdown filters
  const loadFiltersData = useCallback(async () => {
    try {
      const [ubiRes, agRes] = await Promise.all([
        axios.get('/v1/catalog/ubicaciones?all=1'),
        axios.get('/v1/catalog/vehiculo-agencias'),
      ]);
      setUbicaciones(ubiRes.data.data || []);
      setAgencias(agRes.data.data || []);
    } catch (err) {
      console.error('Error cargando filtros de vehículos:', err);
    }
  }, []);

  useEffect(() => {
    loadFiltersData();
  }, [loadFiltersData]);

  // Fetch vehiculos from API
  const fetchVehiculos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/v1/catalog/vehiculos', {
        params: {
          search,
          id_ubicacion: selectedUbicacion || undefined,
          id_vehiculo_agencia: selectedAgencia || undefined,
          page,
          per_page: 10,
          sort_by: sortConfig.key,
          sort_dir: sortConfig.direction,
        },
      });
      setVehiculos(res.data.data || []);
      setPage(res.data.meta?.current_page || 1);
      setLastPage(res.data.meta?.last_page || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedUbicacion, selectedAgencia, sortConfig]);

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

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
    setVehiculoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setVehiculoToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setVehiculoToEdit(null);
    setSuccessBanner(vehiculoToEdit ? 'Vehículo actualizado con éxito.' : 'Vehículo registrado con éxito.');
    setTimeout(() => setSuccessBanner(''), 4000);
    fetchVehiculos();
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
      await axios.delete(`/v1/catalog/vehiculos/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessBanner(`Vehículo '${deleteTarget.marca} ${deleteTarget.vehiculo}' eliminado correctamente.`);
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchVehiculos();
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
      if (err.response?.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('No se pudo eliminar el vehículo debido a registros asociados en ventas.');
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
          <span style={{ color: '#E87217', fontWeight: '600' }}>Vehículos</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#FFFFFF' }}>
          Vehículos (Rent-A-Car)
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
        {/* Search & Location/Agency Filters */}
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
              placeholder="Buscar vehículo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Location Dropdown Filter */}
          <div style={{ width: '190px' }}>
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
              <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>Todas las Ubicaciones</option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id} style={{ background: '#101c44', color: '#FFFFFF' }}>
                  {u.ubicacion}
                </option>
              ))}
            </select>
          </div>

          {/* Agency Dropdown Filter */}
          <div style={{ width: '220px' }}>
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
                color: selectedAgencia ? '#FFFFFF' : '#b9c8ddff',
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
              value={selectedAgencia}
              title={selectedAgencia ? agencias.find(a => String(a.id) === String(selectedAgencia))?.agencia : 'Todas las Agencias'}
              onChange={(e) => {
                setSelectedAgencia(e.target.value);
                setPage(1);
              }}
            >
              <option value="" style={{ background: '#101c44', color: '#b9c8ddff' }}>Todas las Agencias</option>
              {agencias.map((ag) => (
                <option key={ag.id} value={ag.id} style={{ background: '#101c44', color: '#FFFFFF' }}>
                  {ag.agencia}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
            <>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
                <button
                  className="btn-secondary"
                  onClick={handleOpenCreate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  title="Agregar nuevo vehículo"
                >
                  <img src={imgAgregar} alt="Agregar" style={{ width: '20px', height: '20px' }} />
                </button>
                <span className='title-input'>Agregar</span>
              </div>
            </>
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
                onClick={() => handleSort('marca')}
                style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
              >
                Vehículo (Marca / Modelo / Año){getSortIndicator('marca')}
              </th>
              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '150px' }}>
                Agencia
              </th>
              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '140px' }}>
                Ubicación
              </th>
              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '160px' }}>
                Tipo / Transmisión
              </th>
              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', width: '180px' }}>
                {isFreelancer ? 'Tarifa Venta Diaria' : 'Tarifa Diaria (Costo / Venta)'}
              </th>
              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', textAlign: 'center', width: '110px' }}>
                Promoción
              </th>
              <th style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '600', textAlign: 'right', width: '170px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
                  Cargando catálogo de vehículos...
                </td>
              </tr>
            ) : vehiculos.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#b9c8ddff' }}>
                  {search || selectedUbicacion || selectedAgencia
                    ? 'No se encontraron vehículos que coincidan con los filtros aplicados.'
                    : 'No hay vehículos registrados en el catálogo.'}
                </td>
              </tr>
            ) : (
              vehiculos.map((item, index) => (
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
                    <div>{item.marca} {item.vehiculo}</div>
                    <div style={{ fontSize: '0.75rem', color: '#b9c8ddff', fontWeight: '400' }}>
                      Año: {item.ano} {item.nota ? `• ${item.nota}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#F8FAFC' }}>
                    {item.nombre_agencia || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant="primary" style={{ fontSize: '0.75rem' }}>
                      {item.nombre_ubicacion || '—'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#b9c8ddff', fontSize: '0.8125rem' }}>
                    <div>{item.tipo_vehiculo}</div>
                    <div style={{ color: '#b9c8ddff', fontSize: '0.75rem' }}>{item.tipo_transmision}</div>
                  </td>

                  {/* Pricing Column (Protected for US-03) */}
                  <td style={{ padding: '14px 16px' }}>
                    {item.tarifa_activa ? (
                      <div>
                        {!isFreelancer && (
                          <div style={{ fontSize: '0.75rem', color: '#b9c8ddff' }}>
                            Costo: ${parseFloat(item.tarifa_activa.costo || 0).toFixed(2)}
                            {item.tarifa_activa.porcentaje !== undefined && (
                              <span style={{ color: '#10B981', marginLeft: '6px' }}>
                                ({parseFloat(item.tarifa_activa.porcentaje).toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ color: '#E87217', fontWeight: '700' }}>
                          ${parseFloat(item.tarifa_activa.precio || 0).toFixed(2)} / día
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#b9c8ddff', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Sin tarifa activa
                      </span>
                    )}
                  </td>

                  {/* Promotion Badge */}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {item.has_promocion ? (
                      <Badge variant="warning">Promo Activa</Badge>
                    ) : (
                      <Badge variant="neutral">Estándar</Badge>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedVehiculoForTarifas(item)}
                        style={{
                          background: 'rgba(232, 114, 23, 0.15)',
                          border: '1px solid rgba(232, 114, 23, 0.4)',
                          color: '#E87217',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Ver y gestionar tarifas por día/temporada"
                      >
                        Tarifas
                      </button>

                      {!isFreelancer && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#F8FAFC',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
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
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
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
          color: '#b9c8ddff',
        }}>
          <Pagination
            currentPage={page}
            lastPage={lastPage}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      {/* Vehiculo Create/Edit Modal */}
      <VehiculoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setVehiculoToEdit(null);
          setLastCreatedAgenciaId(null);
        }}
        onSaveSuccess={handleSaveSuccess}
        vehiculoToEdit={vehiculoToEdit}
        onOpenAgenciaModal={() => {
          setIsAgenciaModalOpen(true);
        }}
        agencias={agencias}
        lastCreatedAgenciaId={lastCreatedAgenciaId}
      />

      {/* Agencia Modal */}
      <VehiculoAgenciaModal
        isOpen={isAgenciaModalOpen}
        zIndex={1100}
        onClose={() => {
          setIsAgenciaModalOpen(false);
          loadFiltersData();
        }}
        onSaveSuccess={async (newAgencia) => {
          await loadFiltersData();
          if (newAgencia?.id) {
            setLastCreatedAgenciaId(newAgencia.id);
          }
        }}
      />

      {/* Tarifas Modal */}
      <VehiculoTarifasModal
        isOpen={Boolean(selectedVehiculoForTarifas)}
        onClose={() => {
          setSelectedVehiculoForTarifas(null);
          fetchVehiculos();
        }}
        vehiculo={selectedVehiculoForTarifas}
        isFreelancer={isFreelancer}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#FFFFFF' }}>
              Confirmar Eliminación
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#b9c8ddff', fontSize: '0.875rem', lineHeight: '1.5' }}>
              ¿Está seguro de que desea eliminar el vehículo <strong style={{ color: '#FFFFFF' }}>{deleteTarget.marca} {deleteTarget.vehiculo} ({deleteTarget.ano})</strong>? Esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                marginBottom: '16px',
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn-form-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  background: '#ef4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
