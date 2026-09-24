import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function VehiculoModal({
  isOpen,
  onClose,
  onSaveSuccess,
  vehiculoToEdit = null,
  onOpenAgenciaModal,
  agencias: propAgencias = [],
  lastCreatedAgenciaId = null,
}) {
  const [internalAgencias, setInternalAgencias] = useState([]);
  const [loadingAgencias, setLoadingAgencias] = useState(false);

  const agencias = propAgencias.length > 0 ? propAgencias : internalAgencias;

  // Form fields
  const [idVehiculoAgencia, setIdVehiculoAgencia] = useState('');
  const [marca, setMarca] = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('Sedán');
  const [tipoTransmision, setTipoTransmision] = useState('Automático');
  const [nota, setNota] = useState('');

  // Initial tariff fields (when creating)
  const [costo, setCosto] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [precio, setPrecio] = useState('');
  const [promocion, setPromocion] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && propAgencias.length === 0) {
      setLoadingAgencias(true);
      axios.get('/v1/catalog/vehiculo-agencias')
        .then((res) => {
          setInternalAgencias(res.data.data || []);
        })
        .catch((err) => {
          console.error('Error cargando agencias:', err);
        })
        .finally(() => {
          setLoadingAgencias(false);
        });
    }
  }, [isOpen, propAgencias.length]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (vehiculoToEdit) {
        setIdVehiculoAgencia(vehiculoToEdit.id_vehiculo_agencia || '');
        setMarca(vehiculoToEdit.marca || '');
        setVehiculo(vehiculoToEdit.vehiculo || '');
        setAno(vehiculoToEdit.ano || '');
        setTipoVehiculo(vehiculoToEdit.tipo_vehiculo || 'Sedán');
        setTipoTransmision(vehiculoToEdit.tipo_transmision || 'Automático');
        setNota(vehiculoToEdit.nota || '');
        setCosto('');
        setPorcentaje('');
        setPrecio('');
        setPromocion(false);
      } else {
        setAno((prev) => prev || new Date().getFullYear().toString());
        setTipoVehiculo((prev) => prev || 'Sedán');
        setTipoTransmision((prev) => prev || 'Automático');
      }
    } else {
      setIdVehiculoAgencia('');
      setMarca('');
      setVehiculo('');
      setAno('');
      setTipoVehiculo('Sedán');
      setTipoTransmision('Automático');
      setNota('');
      setCosto('');
      setPorcentaje('');
      setPrecio('');
      setPromocion(false);
      setErrorMessage('');
    }
  }, [isOpen, vehiculoToEdit]);

  useEffect(() => {
    if (lastCreatedAgenciaId) {
      setIdVehiculoAgencia(lastCreatedAgenciaId);
    }
  }, [lastCreatedAgenciaId]);

  useEffect(() => {
    if (!idVehiculoAgencia && agencias.length > 0 && !vehiculoToEdit) {
      setIdVehiculoAgencia(agencias[0].id);
    }
  }, [agencias, idVehiculoAgencia, vehiculoToEdit]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idVehiculoAgencia) {
      setErrorMessage('Debe seleccionar una agencia de alquiler.');
      return;
    }

    if (!marca.trim() || !vehiculo.trim() || !ano.trim()) {
      setErrorMessage('Marca, modelo y año son campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      id_vehiculo_agencia: parseInt(idVehiculoAgencia, 10),
      marca: marca.trim(),
      vehiculo: vehiculo.trim(),
      ano: ano.trim(),
      tipo_vehiculo: tipoVehiculo,
      tipo_transmision: tipoTransmision,
      nota: nota.trim() || null,
    };

    if (!vehiculoToEdit && precio) {
      payload.costo = parseFloat(costo) || 0;
      payload.precio = parseFloat(precio) || 0;
      payload.porcentaje = porcentaje !== '' ? parseFloat(porcentaje) : null;
      payload.promocion = Boolean(promocion);
    }

    try {
      if (vehiculoToEdit) {
        await axios.put(`/v1/catalog/vehiculos/${vehiculoToEdit.id}`, payload);
      } else {
        await axios.post('/v1/catalog/vehiculos', payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error guardando vehículo:', err);
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        setErrorMessage(errorList.join(' '));
      } else {
        setErrorMessage(err.response?.data?.message || 'Error al procesar la solicitud.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehiculoToEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.875rem',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Agency Selection */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="erp-label" style={{ margin: 0 }}>
              Agencia de Alquiler <span className="req">*</span>
            </label>
            {onOpenAgenciaModal && (
              <button
                type="button"
                onClick={onOpenAgenciaModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E87217',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                + Nueva Agencia
              </button>
            )}
          </div>
          <select
            className="erp-input"
            value={idVehiculoAgencia}
            onChange={(e) => setIdVehiculoAgencia(e.target.value)}
            required
            disabled={isSubmitting || loadingAgencias}
            style={{ cursor: 'pointer', color: idVehiculoAgencia ? '#FFFFFF' : '#94A3B8' }}
          >
            <option value="" style={{ background: '#1e293b', color: '#94A3B8' }}>
              {loadingAgencias ? 'Cargando agencias...' : 'Seleccione una agencia...'}
            </option>
            {agencias.map((ag) => (
              <option key={ag.id} value={ag.id} style={{ background: '#1e293b', color: '#FFFFFF' }}>
                {ag.agencia} {ag.nombre_ubicacion ? `(${ag.nombre_ubicacion})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Specs: Marca, Modelo, Año */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '14px' }}>
          <div>
            <label className="erp-label">Marca <span className="req">*</span></label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Toyota"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="erp-label">Modelo / Vehículo <span className="req">*</span></label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Corolla Cross"
              value={vehiculo}
              onChange={(e) => setVehiculo(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="erp-label">Año <span className="req">*</span></label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: 2024"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Vehicle Classification: Tipo & Transmisión */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label className="erp-label">Tipo de Vehículo <span className="req">*</span></label>
            <select
              className="erp-input"
              value={tipoVehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ cursor: 'pointer', color: '#FFFFFF' }}
            >
              <option value="Sedán" style={{ background: '#1e293b' }}>Sedán</option>
              <option value="SUV / Camioneta" style={{ background: '#1e293b' }}>SUV / Camioneta</option>
              <option value="Compacto" style={{ background: '#1e293b' }}>Compacto</option>
              <option value="Rústico / 4x4" style={{ background: '#1e293b' }}>Rústico / 4x4</option>
              <option value="Van / Minivan" style={{ background: '#1e293b' }}>Van / Minivan</option>
              <option value="Hatchback" style={{ background: '#1e293b' }}>Hatchback</option>
            </select>
          </div>

          <div>
            <label className="erp-label">Tipo de Transmisión <span className="req">*</span></label>
            <select
              className="erp-input"
              value={tipoTransmision}
              onChange={(e) => setTipoTransmision(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ cursor: 'pointer', color: '#FFFFFF' }}
            >
              <option value="Automático" style={{ background: '#1e293b' }}>Automático</option>
              <option value="Sincrónico / Manual" style={{ background: '#1e293b' }}>Sincrónico / Manual</option>
            </select>
          </div>
        </div>

        {/* Nota */}
        <div>
          <label className="erp-label">Observaciones / Notas (Opcional)</label>
          <input
            type="text"
            className="erp-input"
            placeholder="Ej: Aire acondicionado, 5 plazas, kilometraje ilimitado"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Initial Tariff Card (Only shown when creating new vehicle) */}
        {!vehiculoToEdit && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '4px',
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
              Tarifa Base Diaria Inicial (Opcional)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="erp-label">Costo Neto (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input"
                  placeholder="0.00"
                  value={costo}
                  onChange={(e) => handleCostoChange(e.target.value)}
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
                <label className="erp-label">Precio Venta (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => handlePrecioChange(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
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
                <span>Marcar como Tarifa Promocional (US-09)</span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            className="btn-form-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-form-nxt"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : vehiculoToEdit ? 'Actualizar Vehículo' : 'Guardar Vehículo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
