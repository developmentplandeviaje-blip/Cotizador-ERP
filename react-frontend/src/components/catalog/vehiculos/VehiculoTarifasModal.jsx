import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import axios from 'axios';

export default function VehiculoTarifasModal({ isOpen, onClose, vehiculo, isFreelancer = false }) {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // New tariff form fields
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [costo, setCosto] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [precio, setPrecio] = useState('');
  const [promocion, setPromocion] = useState(false);

  useEffect(() => {
    if (isOpen && vehiculo) {
      setErrorMessage('');
      resetForm();
      fetchTarifas();
    }
  }, [isOpen, vehiculo]);

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    setDesde(today);
    setHasta(nextYear);
    setCosto('');
    setPorcentaje('');
    setPrecio('');
    setPromocion(false);
  };

  const fetchTarifas = async () => {
    if (!vehiculo) return;
    setLoading(true);
    try {
      const res = await axios.get(`/v1/catalog/vehiculos/${vehiculo.id}/tarifas`);
      setTarifas(res.data.data || []);
    } catch (err) {
      console.error('Error cargando tarifas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCostoChange = (val) => {
    setCosto(val);
    const c = parseFloat(val);
    const m = parseFloat(porcentaje);
    if (!isNaN(c) && c > 0 && !isNaN(m)) {
      setPrecio((c * (1 + m / 100)).toFixed(2));
    }
  };

  const handlePorcentajeChange = (val) => {
    setPorcentaje(val);
    const c = parseFloat(costo);
    const m = parseFloat(val);
    if (!isNaN(c) && c > 0 && !isNaN(m)) {
      setPrecio((c * (1 + m / 100)).toFixed(2));
    }
  };

  const handlePrecioChange = (val) => {
    setPrecio(val);
    const c = parseFloat(costo);
    const p = parseFloat(val);
    if (!isNaN(c) && c > 0 && !isNaN(p)) {
      setPorcentaje((((p - c) / c) * 100).toFixed(2));
    }
  };

  const handleAddTarifa = async (e) => {
    e.preventDefault();
    if (!desde || !hasta || !precio) {
      setErrorMessage('Por favor complete las fechas y el precio diario.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await axios.post(`/v1/catalog/vehiculos/${vehiculo.id}/tarifas`, {
        desde: `${desde} 00:00:00`,
        hasta: `${hasta} 23:59:59`,
        costo: parseFloat(costo) || 0,
        precio: parseFloat(precio) || 0,
        porcentaje: porcentaje !== '' ? parseFloat(porcentaje) : null,
        promocion: Boolean(promocion),
      });
      resetForm();
      fetchTarifas();
    } catch (err) {
      console.error('Error guardando tarifa:', err);
      setErrorMessage(err.response?.data?.message || 'Error al registrar la tarifa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTarifa = async (tarifaId) => {
    if (!window.confirm('¿Desea eliminar esta tarifa?')) return;
    try {
      await axios.delete(`/v1/catalog/tarifas-vehiculo/${tarifaId}`);
      fetchTarifas();
    } catch (err) {
      console.error('Error eliminando tarifa:', err);
      alert(err.response?.data?.message || 'No se pudo eliminar la tarifa.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tarifas — ${vehiculo ? `${vehiculo.marca} ${vehiculo.vehiculo}` : 'Vehículo'}`}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Form to add a new tariff (Hidden for Freelancers) */}
        {!isFreelancer && (
          <form onSubmit={handleAddTarifa} style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
              Nueva Tarifa por Temporada (Diaria)
            </h4>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                marginBottom: '12px',
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="erp-label">Vigencia Desde <span className="req">*</span></label>
                <input
                  type="date"
                  className="erp-input"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Vigencia Hasta <span className="req">*</span></label>
                <input
                  type="date"
                  className="erp-input"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Costo Neto (USD) <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input"
                  placeholder="0.00"
                  value={costo}
                  onChange={(e) => handleCostoChange(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">% Margen</label>
                <input
                  type="number"
                  step="0.01"
                  className="erp-input"
                  placeholder="0.00%"
                  value={porcentaje}
                  onChange={(e) => handlePorcentajeChange(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Precio Venta (USD) <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => handlePrecioChange(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem',
                color: promocion ? '#E87217' : '#94A3B8',
              }}>
                <input
                  type="checkbox"
                  checked={promocion}
                  onChange={(e) => setPromocion(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Tarifa Promocional (Aplica Alerta Preventiva US-09)</span>
              </label>

              <button type="submit" className="btn-form-nxt" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Agregar Tarifa'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Tariffs List */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', color: '#F8FAFC', fontWeight: '600' }}>
            Tarifario Histórico / Vigente ({tarifas.length})
          </h4>
          <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Vigencia</th>
                  {!isFreelancer && <th style={{ padding: '8px 12px', textAlign: 'left' }}>Costo Neto</th>}
                  {!isFreelancer && <th style={{ padding: '8px 12px', textAlign: 'center' }}>% Margen</th>}
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>{isFreelancer ? 'Tarifa Venta Diaria' : 'Precio Venta'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Estado</th>
                  {!isFreelancer && <th style={{ padding: '8px 12px', textAlign: 'right' }}>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isFreelancer ? 3 : 6} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                      Cargando tarifas...
                    </td>
                  </tr>
                ) : tarifas.length === 0 ? (
                  <tr>
                    <td colSpan={isFreelancer ? 3 : 6} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                      No hay tarifas registradas para este vehículo.
                    </td>
                  </tr>
                ) : (
                  tarifas.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '8px 12px', color: '#F8FAFC' }}>
                        {t.desde ? t.desde.substring(0, 10) : '—'} al {t.hasta ? t.hasta.substring(0, 10) : '—'}
                      </td>
                      {!isFreelancer && (
                        <td style={{ padding: '8px 12px', color: '#94A3B8' }}>
                          ${parseFloat(t.costo || 0).toFixed(2)}
                        </td>
                      )}
                      {!isFreelancer && (
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#10B981', fontWeight: '600' }}>
                          {t.porcentaje !== null ? `${parseFloat(t.porcentaje).toFixed(1)}%` : '—'}
                        </td>
                      )}
                      <td style={{ padding: '8px 12px', color: '#E87217', fontWeight: '700' }}>
                        ${parseFloat(t.precio || 0).toFixed(2)} / día
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {t.promocion ? (
                          <Badge variant="warning">Promoción</Badge>
                        ) : (
                          <Badge variant="neutral">Estándar</Badge>
                        )}
                      </td>
                      {!isFreelancer && (
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteTarifa(t.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f87171',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" className="btn-form-cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
