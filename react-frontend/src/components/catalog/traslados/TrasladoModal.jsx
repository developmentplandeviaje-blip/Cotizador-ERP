import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function TrasladoModal({ isOpen, onClose, onSaveSuccess, trasladoToEdit = null }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Form fields
  const [idUbicacion, setIdUbicacion] = useState('');
  const [rutaOrigen, setRutaOrigen] = useState('');

  const [tipoServicio, setTipoServicio] = useState('Solo Ida');

  // Pricing & margins
  const [costo, setCosto] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [precioPublico, setPrecioPublico] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch locations
  useEffect(() => {
    if (isOpen) {
      setLoadingUbicaciones(true);
      axios.get('/v1/catalog/ubicaciones?all=1')
        .then((res) => {
          setUbicaciones(res.data.data || []);
        })
        .catch((err) => {
          console.error('Error cargando ubicaciones:', err);
        })
        .finally(() => {
          setLoadingUbicaciones(false);
        });
    }
  }, [isOpen]);

  // Reset or populate fields
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (trasladoToEdit) {
        setIdUbicacion(trasladoToEdit.id_ubicacion || '');
        setRutaOrigen(trasladoToEdit.ruta_origen || '');
        setTipoServicio(trasladoToEdit.tipo_servicio || 'Solo Ida');
        setCosto(trasladoToEdit.costo !== undefined && trasladoToEdit.costo !== null ? trasladoToEdit.costo : '');
        setPorcentaje(trasladoToEdit.porcentaje !== undefined && trasladoToEdit.porcentaje !== null ? trasladoToEdit.porcentaje : '');
        setPrecioPublico(trasladoToEdit.precio_publico !== undefined && trasladoToEdit.precio_publico !== null ? trasladoToEdit.precio_publico : '');
      } else {
        setIdUbicacion('');
        setRutaOrigen('');
        setTipoServicio('Solo Ida');
        setCosto('');
        setPorcentaje('');
        setPrecioPublico('');
      }
    }
  }, [isOpen, trasladoToEdit]);

  // Reactive price & margin calculations
  const handleCostoChange = (val) => {
    setCosto(val);
    const cost = parseFloat(val);
    const margin = parseFloat(porcentaje);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = (cost * (1 + margin / 100)).toFixed(2);
      setPrecioPublico(calculatedPrice);
    }
  };

  const handlePorcentajeChange = (val) => {
    setPorcentaje(val);
    const cost = parseFloat(costo);
    const margin = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = (cost * (1 + margin / 100)).toFixed(2);
      setPrecioPublico(calculatedPrice);
    }
  };

  const handlePrecioPublicoChange = (val) => {
    setPrecioPublico(val);
    const cost = parseFloat(costo);
    const price = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = (((price - cost) / cost) * 100).toFixed(2);
      setPorcentaje(calculatedMargin);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idUbicacion) {
      setErrorMessage('Debe seleccionar una ubicación geográfica.');
      return;
    }
    if (!rutaOrigen.trim()) {
      setErrorMessage('La ruta o punto de origen es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      id_ubicacion: parseInt(idUbicacion, 10),
      ruta_origen: rutaOrigen.trim(),
      tipo_servicio: tipoServicio,
      costo: parseFloat(costo) || 0,
      precio_publico: parseFloat(precioPublico) || 0,
    };

    try {
      if (trasladoToEdit) {
        await axios.put(`/v1/catalog/traslados/${trasladoToEdit.id}`, payload);
      } else {
        await axios.post('/v1/catalog/traslados', payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error guardando traslado:', err);
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        setErrorMessage(errorList.join(' '));
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar el traslado.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trasladoToEdit ? 'Editar Traslado' : 'Crear Nuevo Traslado'}
      width="640px"
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '18px',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Location & Service Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="erp-label">
              Ubicación Geográfica <span className="req">*</span>
            </label>
            <select
              className="erp-input"
              value={idUbicacion}
              onChange={(e) => {
                setIdUbicacion(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              disabled={isSubmitting || loadingUbicaciones}
              style={{
                cursor: 'pointer',
                color: idUbicacion ? '#FFFFFF' : '#94A3B8',
                paddingLeft: '14px',
                paddingRight: '36px',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="" style={{ background: '#1e293b', color: '#94A3B8' }}>
                {loadingUbicaciones ? 'Cargando ubicaciones...' : 'Seleccione una ubicación...'}
              </option>
              {ubicaciones.map((u) => (
                <option key={u.id} value={u.id} style={{ background: '#1e293b', color: '#FFFFFF' }}>
                  {u.ubicacion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="erp-label">
              Tipo de Servicio <span className="req">*</span>
            </label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#F8FAFC',
              }}>
                <input
                  type="radio"
                  name="tipo_servicio"
                  value="Solo Ida"
                  checked={tipoServicio === 'Solo Ida'}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  disabled={isSubmitting}
                />
                Solo Ida
              </label>

              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#F8FAFC',
              }}>
                <input
                  type="radio"
                  name="tipo_servicio"
                  value="Ida y Vuelta"
                  checked={tipoServicio === 'Ida y Vuelta'}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  disabled={isSubmitting}
                />
                Ida y Vuelta
              </label>
            </div>
          </div>
        </div>

        {/* Origin & Destination */}
        <div style={{ marginBottom: '16px' }}>
          <div>
            <label className="erp-label">
              Descripción del Traslado (Ruta) <span className="req">*</span>
            </label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Aeropuerto / Hotel 15- 20 Pax-- Hotel / Aeropuerto"
              value={rutaOrigen}
              onChange={(e) => {
                setRutaOrigen(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>


        </div>

        {/* Tarifa y Margen Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
            Tarifas y Márgenes (USD)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
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
              <label className="erp-label">% Margen Ganancia</label>
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
              <label className="erp-label">Precio Público (USD) <span className="req">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="erp-input"
                placeholder="0.00"
                value={precioPublico}
                onChange={(e) => handlePrecioPublicoChange(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
            disabled={isSubmitting || !rutaOrigen.trim() || !idUbicacion}
          >
            {isSubmitting ? 'Guardando...' : (trasladoToEdit ? 'Actualizar Traslado' : 'Crear Traslado')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
