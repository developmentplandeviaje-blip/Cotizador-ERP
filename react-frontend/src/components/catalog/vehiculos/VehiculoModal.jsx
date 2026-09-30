import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import { showToast } from '../../../utils/toast';

export default function VehiculoModal({
  isOpen,
  onClose,
  onSaveSuccess,
  vehiculoToEdit = null,
  onOpenAgenciaModal,
  agencias = [],
  lastCreatedAgenciaId = null,
}) {
  const [idVehiculoAgencia, setIdVehiculoAgencia] = useState('');
  const [marca, setMarca] = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [ano, setAno] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [tipoTransmision, setTipoTransmision] = useState('Automático');
  const [nota, setNota] = useState('');

  // Initial tariff fields (only for new vehicles)
  const [includeTarifa, setIncludeTarifa] = useState(false);
  const [costo, setCosto] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [precio, setPrecio] = useState('');
  const [promocion, setPromocion] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [desdeVenta, setDesdeVenta] = useState('');
  const [hastaVenta, setHastaVenta] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const tiposVehiculoOptions = [
    'Sedan',
    'SUV',
    'Compacto',
    'Camioneta',
    'Van',
    'Ejecutivo',
    'Pick-Up',
    'Hatchback',
    'Crossover',
    'Lujo',
  ];

  const marcasPopulares = [
    'Toyota',
    'Hyundai',
    'Chevrolet',
    'Ford',
    'Honda',
    'Nissan',
    'Kia',
    'Jeep',
    'Mitsubishi',
    'Volkswagen',
    'Renault',
    'Chery',
    'Suzuki',
  ];

  // Populate data when editing or reset when creating
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (vehiculoToEdit) {
        setIdVehiculoAgencia(vehiculoToEdit.id_vehiculo_agencia || '');
        setMarca(vehiculoToEdit.marca || '');
        setVehiculo(vehiculoToEdit.vehiculo || '');
        setAno(vehiculoToEdit.ano || '');
        setTipoVehiculo(vehiculoToEdit.tipo_vehiculo || '');
        setTipoTransmision(vehiculoToEdit.tipo_transmision || 'Automático');
        setNota(vehiculoToEdit.nota || '');
        setIncludeTarifa(false);
      } else {
        setIdVehiculoAgencia(lastCreatedAgenciaId ? String(lastCreatedAgenciaId) : (agencias.length > 0 ? String(agencias[0].id) : ''));
        setMarca('');
        setVehiculo('');
        setAno(new Date().getFullYear().toString());
        setTipoVehiculo('Sedan');
        setTipoTransmision('Automático');
        setNota('');
        setIncludeTarifa(false);
        setCosto('');
        setPorcentaje('');
        setPrecio('');
        setPromocion(false);
        setDesde('');
        setHasta('');
        setDesdeVenta('');
        setHastaVenta('');
      }
    }
  }, [isOpen, vehiculoToEdit, lastCreatedAgenciaId, agencias]);

  // Update agency selection if lastCreatedAgenciaId changes
  useEffect(() => {
    if (lastCreatedAgenciaId && isOpen && !vehiculoToEdit) {
      setIdVehiculoAgencia(String(lastCreatedAgenciaId));
    }
  }, [lastCreatedAgenciaId, isOpen, vehiculoToEdit]);

  // Pricing calculations
  const handleCostoChange = (val) => {
    setCosto(val);
    const costVal = parseFloat(val);
    const marginVal = parseFloat(porcentaje);
    if (!isNaN(costVal) && costVal > 0 && !isNaN(marginVal)) {
      const calculatedPrice = (costVal * (1 + marginVal / 100)).toFixed(2);
      setPrecio(calculatedPrice);
    }
  };

  const handlePorcentajeChange = (val) => {
    setPorcentaje(val);
    const costVal = parseFloat(costo);
    const marginVal = parseFloat(val);
    if (!isNaN(costVal) && costVal > 0 && !isNaN(marginVal)) {
      const calculatedPrice = (costVal * (1 + marginVal / 100)).toFixed(2);
      setPrecio(calculatedPrice);
    }
  };

  const handlePrecioChange = (val) => {
    setPrecio(val);
    const costVal = parseFloat(costo);
    const priceVal = parseFloat(val);
    if (!isNaN(costVal) && costVal > 0 && !isNaN(priceVal)) {
      const calculatedMargin = (((priceVal - costVal) / costVal) * 100).toFixed(2);
      setPorcentaje(calculatedMargin);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idVehiculoAgencia) {
      setErrorMessage('Debe seleccionar una agencia de alquiler.');
      return;
    }
    if (!marca.trim()) {
      setErrorMessage('Debe ingresar la marca del vehículo.');
      return;
    }
    if (!vehiculo.trim()) {
      setErrorMessage('Debe ingresar el modelo / nombre del vehículo.');
      return;
    }
    if (!ano.trim()) {
      setErrorMessage('Debe ingresar el año del vehículo.');
      return;
    }
    if (!tipoVehiculo.trim()) {
      setErrorMessage('Debe seleccionar o ingresar el tipo de vehículo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        id_vehiculo_agencia: parseInt(idVehiculoAgencia, 10),
        marca: marca.trim(),
        vehiculo: vehiculo.trim(),
        ano: ano.trim(),
        tipo_vehiculo: tipoVehiculo.trim(),
        tipo_transmision: tipoTransmision.trim(),
        nota: nota.trim() || null,
      };

      if (!vehiculoToEdit && includeTarifa && (costo || precio)) {
        payload.costo = parseFloat(costo) || 0;
        payload.precio = parseFloat(precio) || 0;
        payload.porcentaje = parseFloat(porcentaje) || 0;
        payload.promocion = promocion;
        if (desde) payload.desde = desde;
        if (hasta) payload.hasta = hasta;
        if (desdeVenta) payload.desde_venta = desdeVenta;
        if (hastaVenta) payload.hasta_venta = hastaVenta;
      }

      if (vehiculoToEdit) {
        await axios.put(`/v1/catalog/vehiculos/${vehiculoToEdit.id}`, payload);
        showToast('Vehículo actualizado exitosamente.', 'success');
      } else {
        await axios.post('/v1/catalog/vehiculos', payload);
        showToast('Vehículo registrado exitosamente.', 'success');
      }

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Error guardando vehículo:', err);
      const errors = err.response?.data?.errors;
      let errorMsg = 'Error al guardar el vehículo. Verifique los datos ingresados.';
      if (errors) {
        errorMsg = Object.values(errors).flat().join('\n');
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setErrorMessage(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehiculoToEdit ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
      size="lg"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            whiteSpace: 'pre-line',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Agency Selection Row */}
        <div>
          <label className="erp-label">
            Agencia de Alquiler <span className="req">*</span>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="erp-input"
              value={idVehiculoAgencia}
              onChange={(e) => setIdVehiculoAgencia(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ flex: 1, cursor: 'pointer', color: idVehiculoAgencia ? '#FFFFFF' : '#94A3B8' }}
            >
              <option value="" style={{ background: '#1e293b', color: '#94A3B8' }}>
                Seleccione una agencia...
              </option>
              {agencias.map((ag) => (
                <option key={ag.id} value={ag.id} style={{ background: '#1e293b', color: '#FFFFFF' }}>
                  {ag.agencia} {ag.nombre_ubicacion ? `(${ag.nombre_ubicacion})` : ''}
                </option>
              ))}
            </select>
            {onOpenAgenciaModal && (
              <button
                type="button"
                className="btn-secondary-form"
                onClick={onOpenAgenciaModal}
                style={{ whiteSpace: 'nowrap', padding: '0 14px', fontSize: '0.8125rem' }}
                title="Gestión de Agencias de Alquiler"
              >
                + Crear Agencia
              </button>
            )}
          </div>
        </div>

        {/* Brand & Model Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label className="erp-label">
              Marca <span className="req">*</span>
            </label>
            <input
              type="text"
              className="erp-input"
              list="marcas-list"
              placeholder="Ej: Toyota, Hyundai, Chevrolet"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <datalist id="marcas-list">
              {marcasPopulares.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="erp-label">
              Modelo / Vehículo <span className="req">*</span>
            </label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Yaris, Tucson, Spark"
              value={vehiculo}
              onChange={(e) => setVehiculo(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Year, Type & Transmission Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label className="erp-label">
              Año <span className="req">*</span>
            </label>
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

          <div>
            <label className="erp-label">
              Tipo de Vehículo <span className="req">*</span>
            </label>
            <select
              className="erp-input"
              value={tipoVehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ cursor: 'pointer', color: tipoVehiculo ? '#FFFFFF' : '#94A3B8' }}
            >
              <option value="" style={{ background: '#1e293b', color: '#94A3B8' }}>
                Seleccione tipo...
              </option>
              {tiposVehiculoOptions.map((t) => (
                <option key={t} value={t} style={{ background: '#1e293b', color: '#FFFFFF' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="erp-label">
              Transmisión <span className="req">*</span>
            </label>
            <select
              className="erp-input"
              value={tipoTransmision}
              onChange={(e) => setTipoTransmision(e.target.value)}
              required
              disabled={isSubmitting}
              style={{ cursor: 'pointer', color: '#FFFFFF' }}
            >
              <option value="Automático" style={{ background: '#1e293b', color: '#FFFFFF' }}>Automático</option>
              <option value="Sincrónico" style={{ background: '#1e293b', color: '#FFFFFF' }}>Sincrónico / Manual</option>
            </select>
          </div>
        </div>

        {/* Notes Row */}
        <div>
          <label className="erp-label">Observación / Notas (Opcional)</label>
          <textarea
            className="erp-input"
            rows={2}
            placeholder="Ej: Aire acondicionado, capacidad 5 pasajeros, sin límite de kilometraje"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            disabled={isSubmitting}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Optional Initial Tariff Section (Only on create) */}
        {!vehiculoToEdit && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: includeTarifa ? '12px' : '0' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '500',
                color: includeTarifa ? '#E87217' : '#b9c8ddff',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgb(30, 41, 59)',
                transition: 'all 0.2s ease',
                boxShadow: includeTarifa
                  ? 'inset 3px 3px 6px rgb(0 0 0 / 74%), inset -3px -3px 6px rgb(255 255 255 / 22%)'
                  : '3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.05)',
                border: includeTarifa ? '1px solid rgba(232, 114, 23, 0.3)' : '1px solid transparent',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={includeTarifa}
                  onChange={(e) => setIncludeTarifa(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span>Asignar  Tarifa</span>
              </label>
            </div>

            {includeTarifa && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="erp-label">Costo ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="erp-input"
                      placeholder="0.00"
                      value={costo}
                      onChange={(e) => handleCostoChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="erp-label">Ganancia (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="erp-input"
                      placeholder="%"
                      value={porcentaje}
                      onChange={(e) => handlePorcentajeChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="erp-label">Precio ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="erp-input"
                      placeholder="0.00"
                      value={precio}
                      onChange={(e) => handlePrecioChange(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="erp-label">Válido Desde (Viaje)</label>
                    <input
                      type="date"
                      className="erp-input"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="erp-label">Válido Hasta (Viaje)</label>
                    <input
                      type="date"
                      className="erp-input"
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <label htmlFor="promocion-check" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    color: promocion ? '#E87217' : '#b9c8ddff',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgb(30, 41, 59)',
                    transition: 'all 0.2s ease',
                    boxShadow: promocion
                      ? 'inset 3px 3px 6px rgb(0 0 0 / 74%), inset -3px -3px 6px rgb(255 255 255 / 22%)'
                      : '3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.05)',
                    border: promocion ? '1px solid rgba(232, 114, 23, 0.3)' : '1px solid transparent',
                    userSelect: 'none'
                  }}>
                    <input
                      type="checkbox"
                      id="promocion-check"
                      checked={promocion}
                      onChange={(e) => setPromocion(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    Tarifa en Promoción
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
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
            {isSubmitting
              ? 'Guardando...'
              : vehiculoToEdit
                ? 'Actualizar Vehículo'
                : 'Guardar Vehículo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
