import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function PaqueteModal({ isOpen, onClose, onSaveSuccess, paqueteToEdit = null }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Form fields
  const [nombrePaquete, setNombrePaquete] = useState('');
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
      if (paqueteToEdit) {
        setNombrePaquete(paqueteToEdit.paquete || '');
        setIdUbicacion(paqueteToEdit.id_ubicacion || '');
        setCostoAdulto(paqueteToEdit.costo_adulto !== undefined ? paqueteToEdit.costo_adulto : '');
        setPorcentajeAdulto(paqueteToEdit.porcentaje_adulto !== undefined && paqueteToEdit.porcentaje_adulto !== null ? paqueteToEdit.porcentaje_adulto : '');
        setPrecioAdulto(paqueteToEdit.precio_adulto !== undefined ? paqueteToEdit.precio_adulto : '');

        setCostoNino(paqueteToEdit.costo_nino !== undefined ? paqueteToEdit.costo_nino : '');
        setPorcentajeNino(paqueteToEdit.porcentaje_nino !== undefined && paqueteToEdit.porcentaje_nino !== null ? paqueteToEdit.porcentaje_nino : '');
        setPrecioNino(paqueteToEdit.precio_nino !== undefined ? paqueteToEdit.precio_nino : '');

        setAplicaDescuentoReferidos(Boolean(paqueteToEdit.aplica_descuento_referidos));
      } else {
        setNombrePaquete('');
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
  }, [isOpen, paqueteToEdit]);

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

    if (!nombrePaquete.trim()) {
      setErrorMessage('El nombre del paquete es obligatorio.');
      return;
    }

    if (!idUbicacion) {
      setErrorMessage('Debe seleccionar una ubicación para el paquete.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      paquete: nombrePaquete.trim(),
      id_ubicacion: parseInt(idUbicacion, 10),
      costo_adulto: parseFloat(costoAdulto) || 0,
      porcentaje_adulto: porcentajeAdulto !== '' ? parseFloat(porcentajeAdulto) : null,
      precio_adulto: parseFloat(precioAdulto) || 0,
      costo_nino: parseFloat(costoNino) || 0,
      porcentaje_nino: porcentajeNino !== '' ? parseFloat(porcentajeNino) : null,
      precio_nino: parseFloat(precioNino) || 0,
      aplica_descuento_referidos: Boolean(aplicaDescuentoReferidos),
    };

    try {
      if (paqueteToEdit) {
        await axios.put(`/v1/catalog/paquetes/${paqueteToEdit.id}`, payload);
      } else {
        await axios.post('/v1/catalog/paquetes', payload);
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error al guardar paquete:', err);
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        setErrorMessage(errorList.join(' '));
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al procesar la solicitud.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paqueteToEdit ? 'Editar Paquete' : 'Nuevo Paquete'}
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

        {/* Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="erp-label">
              Nombre del Paquete <span className="req">*</span>
            </label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Aventura Canaima 3D/2N"
              value={nombrePaquete}
              onChange={(e) => setNombrePaquete(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="erp-label">
              Ubicación <span className="req">*</span>
            </label>
            <select
              className="erp-input"
              value={idUbicacion}
              onChange={(e) => setIdUbicacion(e.target.value)}
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
          marginBottom: '8px',
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
          marginBottom: '8px',
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

        {/* Toggle Descuento de Referidos (Estilo Tarifa de Suplemento) 
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
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
        */}

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
            {isSubmitting ? 'Guardando...' : paqueteToEdit ? 'Actualizar Paquete' : 'Guardar Paquete'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
