import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function ExcursionModal({ isOpen, onClose, onSaveSuccess, excursionToEdit = null }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Form fields
  const [tipoExcursion, setTipoExcursion] = useState('');
  const [idUbicacion, setIdUbicacion] = useState('');

  // Adult pricing
  const [costoAdulto, setCostoAdulto] = useState('');
  const [porcentajeAdulto, setPorcentajeAdulto] = useState('');
  const [precioAdulto, setPrecioAdulto] = useState('');

  // Child pricing
  const [costoNino, setCostoNino] = useState('');
  const [porcentajeNino, setPorcentajeNino] = useState('');
  const [precioNino, setPrecioNino] = useState('');

  // Flags & states
  const [aplicaDescuentoReferidos, setAplicaDescuentoReferidos] = useState(false);
  const [tasaPortuariaStatus, setTasaPortuariaStatus] = useState(false);
  const [tasaPortuariaMonto, setTasaPortuariaMonto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch available ubicaciones for dropdown
  useEffect(() => {
    if (isOpen) {
      setLoadingUbicaciones(true);
      axios.get('/v1/catalog/ubicaciones?all=1')
        .then((res) => {
          setUbicaciones(res.data.data || []);
        })
        .catch((err) => {
          console.error('Error al cargar ubicaciones:', err);
        })
        .finally(() => {
          setLoadingUbicaciones(false);
        });
    }
  }, [isOpen]);

  // Populate data when editing or reset when creating
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (excursionToEdit) {
        setTipoExcursion(excursionToEdit.tipo_excursion || '');
        setIdUbicacion(excursionToEdit.id_ubicacion || '');
        setCostoAdulto(excursionToEdit.costo_adulto !== undefined ? excursionToEdit.costo_adulto : '');
        setPorcentajeAdulto(excursionToEdit.porcentaje_adulto !== undefined && excursionToEdit.porcentaje_adulto !== null ? excursionToEdit.porcentaje_adulto : '');
        setPrecioAdulto(excursionToEdit.precio_adulto !== undefined ? excursionToEdit.precio_adulto : '');

        setCostoNino(excursionToEdit.costo_nino !== undefined ? excursionToEdit.costo_nino : '');
        setPorcentajeNino(excursionToEdit.porcentaje_nino !== undefined && excursionToEdit.porcentaje_nino !== null ? excursionToEdit.porcentaje_nino : '');
        setPrecioNino(excursionToEdit.precio_nino !== undefined ? excursionToEdit.precio_nino : '');

        setAplicaDescuentoReferidos(Boolean(excursionToEdit.aplica_descuento_referidos));
        setTasaPortuariaStatus(Boolean(excursionToEdit.tasa_portuaria_status));
        setTasaPortuariaMonto(excursionToEdit.tasa_portuaria_monto !== undefined && excursionToEdit.tasa_portuaria_monto !== null ? excursionToEdit.tasa_portuaria_monto : '');
      } else {
        setTipoExcursion('');
        setIdUbicacion('');
        setCostoAdulto('');
        setPorcentajeAdulto('');
        setPrecioAdulto('');
        setCostoNino('');
        setPorcentajeNino('');
        setPrecioNino('');
        setAplicaDescuentoReferidos(false);
      }
    }
  }, [isOpen, excursionToEdit]);

  // Reactive price & margin calculations for Adult
  const handleCostoAdultoChange = (val) => {
    setCostoAdulto(val);
    const cost = parseFloat(val);
    const margin = parseFloat(porcentajeAdulto);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = (cost * (1 + margin / 100)).toFixed(2);
      setPrecioAdulto(calculatedPrice);
    }
  };

  const handlePorcentajeAdultoChange = (val) => {
    setPorcentajeAdulto(val);
    const cost = parseFloat(costoAdulto);
    const margin = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = (cost * (1 + margin / 100)).toFixed(2);
      setPrecioAdulto(calculatedPrice);
    }
  };

  const handlePrecioAdultoChange = (val) => {
    setPrecioAdulto(val);
    const cost = parseFloat(costoAdulto);
    const price = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = (((price - cost) / cost) * 100).toFixed(2);
      setPorcentajeAdulto(calculatedMargin);
    }
  };

  // Reactive price & margin calculations for Child
  const handleCostoNinoChange = (val) => {
    setCostoNino(val);
    const cost = parseFloat(val);
    const margin = parseFloat(porcentajeNino);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = (cost * (1 + margin / 100)).toFixed(2);
      setPrecioNino(calculatedPrice);
    }
  };

  const handlePorcentajeNinoChange = (val) => {
    setPorcentajeNino(val);
    const cost = parseFloat(costoNino);
    const margin = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(margin)) {
      const calculatedPrice = (cost * (1 + margin / 100)).toFixed(2);
      setPrecioNino(calculatedPrice);
    }
  };

  const handlePrecioNinoChange = (val) => {
    setPrecioNino(val);
    const cost = parseFloat(costoNino);
    const price = parseFloat(val);
    if (!isNaN(cost) && cost > 0 && !isNaN(price)) {
      const calculatedMargin = (((price - cost) / cost) * 100).toFixed(2);
      setPorcentajeNino(calculatedMargin);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tipoExcursion.trim()) {
      setErrorMessage('El nombre o tipo de excursión es obligatorio.');
      return;
    }

    if (!idUbicacion) {
      setErrorMessage('Debe seleccionar una ubicación para la excursión.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      tipo_excursion: tipoExcursion.trim(),
      id_ubicacion: parseInt(idUbicacion, 10),
      costo_adulto: parseFloat(costoAdulto) || 0,
      precio_adulto: parseFloat(precioAdulto) || 0,
      porcentaje_adulto: porcentajeAdulto !== '' ? parseFloat(porcentajeAdulto) : null,
      costo_nino: parseFloat(costoNino) || 0,
      precio_nino: parseFloat(precioNino) || 0,
      porcentaje_nino: porcentajeNino !== '' ? parseFloat(porcentajeNino) : null,
      aplica_descuento_referidos: Boolean(aplicaDescuentoReferidos),
      tasa_portuaria_status: Boolean(tasaPortuariaStatus),
      tasa_portuaria_monto: tasaPortuariaStatus ? (parseFloat(tasaPortuariaMonto) || 0) : null,
    };

    try {
      if (excursionToEdit) {
        await axios.put(`/v1/catalog/excursiones/${excursionToEdit.id}`, payload);
      } else {
        await axios.post('/v1/catalog/excursiones', payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error guardando excursión:', err);
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        setErrorMessage(errorList.join(' '));
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar la excursión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={excursionToEdit ? 'Editar Excursión' : 'Crear Nueva Excursión'}
      width="680px"
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

        {/* Basic Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="erp-label">
              Nombre / Tipo de Excursión <span className="req">*</span>
            </label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Full Day Coche Catamarán..."
              value={tipoExcursion}
              onChange={(e) => {
                setTipoExcursion(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

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
        </div>

        {/* Tarifa Adulto Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
            Tarifa Adulto (USD)
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
                value={costoAdulto}
                onChange={(e) => handleCostoAdultoChange(e.target.value)}
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
                value={porcentajeAdulto}
                onChange={(e) => handlePorcentajeAdultoChange(e.target.value)}
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
                value={precioAdulto}
                onChange={(e) => handlePrecioAdultoChange(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Tarifa Niño Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
            Tarifa Niño (USD)
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
                value={costoNino}
                onChange={(e) => handleCostoNinoChange(e.target.value)}
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
                value={porcentajeNino}
                onChange={(e) => handlePorcentajeNinoChange(e.target.value)}
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
                value={precioNino}
                onChange={(e) => handlePrecioNinoChange(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Toggle Descuento de Referidos (Estilo Tarifa de Suplemento) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '0.8125rem',
            fontWeight: '500',
            color: aplicaDescuentoReferidos ? '#E87217' : '#b9c8ddff',
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgb(30, 41, 59)',
            transition: 'all 0.2s ease',
            boxShadow: aplicaDescuentoReferidos
              ? 'inset 3px 3px 6px rgb(0 0 0 / 74%), inset -3px -3px 6px rgb(255 255 255 / 22%)'
              : '3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.05)',
            border: aplicaDescuentoReferidos ? '1px solid rgba(232, 114, 23, 0.3)' : '1px solid transparent',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={aplicaDescuentoReferidos}
              onChange={(e) => setAplicaDescuentoReferidos(e.target.checked)}
              style={{ display: 'none' }}
              disabled={isSubmitting}
            />
            <span>Descuento de Referidos (5%)</span>
          </label>
        </div>

        {/* Tasa Portuaria Block */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>¿Incluye Tasa Portuaria?</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="tasa_portuaria_status"
                checked={tasaPortuariaStatus === true}
                onChange={() => setTasaPortuariaStatus(true)}
                disabled={isSubmitting}
              />
              Si
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="tasa_portuaria_status"
                checked={tasaPortuariaStatus === false}
                onChange={() => {
                  setTasaPortuariaStatus(false);
                  setTasaPortuariaMonto('');
                }}
                disabled={isSubmitting}
              />
              No
            </label>
          </div>

          {tasaPortuariaStatus && (
            <div style={{ marginTop: '16px', maxWidth: '200px' }}>
              <label className="erp-label" style={{ fontSize: '0.8125rem' }}>Valor de la Tasa:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="erp-input"
                placeholder="0.00"
                value={tasaPortuariaMonto}
                onChange={(e) => setTasaPortuariaMonto(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn-form-prv"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-form-nxt"
            disabled={isSubmitting || !tipoExcursion.trim() || !idUbicacion}
          >
            {isSubmitting ? 'Guardando...' : (excursionToEdit ? 'Actualizar Excursión' : 'Crear Excursión')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
