import React, { useState } from 'react';
import Modal from '../../common/Modal';

export default function TarifaModal({ isOpen, onClose, onSave, isFreelancer = false }) {
  const [formData, setFormData] = useState({
    desde: '',
    hasta: '',
    ninos_gratis: 0,
    noches_gratis: 0,
    moneda: 'USD',
    costo_noche_adulto: '',
    precio_noche_adulto: '',
    porcentaje_adulto: 0,
    costo_noche_adolescente: '',
    precio_noche_adolescente: '',
    porcentaje_adolescente: 0,
    costo_noche_nino: '',
    precio_noche_nino: '',
    porcentaje_nino: 0,
    suplemento: false,
    has_fecha_venta: false,
    desde_venta: '',
    hasta_venta: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculatePercent = (costoKey, precioKey, percentKey, newCosto, newPrecio) => {
    const c = parseFloat(newCosto);
    const p = parseFloat(newPrecio);
    if (!isNaN(c) && !isNaN(p) && c > 0) {
      const margin = (((p - c) / c) * 100).toFixed(2);
      handleChange(percentKey, margin);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.desde || !formData.hasta || !formData.precio_noche_adulto) {
      alert('Por favor complete las fechas y al menos el precio del adulto.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Tarifa" width="580px">
      <form onSubmit={handleSubmit}>
        {/* Dates Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="erp-label">Desde: <span className="req">*</span></label>
            <input
              type="date"
              className="erp-input"
              value={formData.desde}
              onChange={(e) => handleChange('desde', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="erp-label">Hasta: <span className="req">*</span></label>
            <input
              type="date"
              className="erp-input"
              value={formData.hasta}
              onChange={(e) => handleChange('hasta', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Free kids & nights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="erp-label">Cantidad de Niños Gratis</label>
            <input
              type="number"
              min="0"
              className="erp-input"
              value={formData.ninos_gratis}
              onChange={(e) => handleChange('ninos_gratis', e.target.value)}
            />
          </div>
          <div>
            <label className="erp-label">Cantidad de Noches Gratis</label>
            <input
              type="number"
              min="0"
              className="erp-input"
              value={formData.noches_gratis}
              onChange={(e) => handleChange('noches_gratis', e.target.value)}
            />
          </div>
        </div>

        {/* Currency */}
        <div style={{ marginBottom: '16px' }}>
          <label className="erp-label">Moneda <span className="req">*</span></label>
          <select
            className="erp-select"
            value={formData.moneda}
            onChange={(e) => handleChange('moneda', e.target.value)}
          >
            <option value="USD">USD ($)</option>
            <option value="VES">VES (Bs.)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Adult Rates */}
        <div style={{ display: 'grid', gridTemplateColumns: isFreelancer ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          {!isFreelancer && (
            <div>
              <label className="erp-label">Costo Adulto <span className="req">*</span></label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                placeholder="0.00"
                value={formData.costo_noche_adulto}
                onChange={(e) => {
                  handleChange('costo_noche_adulto', e.target.value);
                  handleCalculatePercent('costo_noche_adulto', 'precio_noche_adulto', 'porcentaje_adulto', e.target.value, formData.precio_noche_adulto);
                }}
              />
            </div>
          )}
          <div>
            <label className="erp-label">Precio Adulto <span className="req">*</span></label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              placeholder="0.00"
              value={formData.precio_noche_adulto}
              onChange={(e) => {
                handleChange('precio_noche_adulto', e.target.value);
                handleCalculatePercent('costo_noche_adulto', 'precio_noche_adulto', 'porcentaje_adulto', formData.costo_noche_adulto, e.target.value);
              }}
              required
            />
          </div>
          {!isFreelancer && (
            <div>
              <label className="erp-label">Porcentaje Adulto %</label>
              <input
                type="text"
                readOnly
                className="erp-input"
                style={{ opacity: 0.7 }}
                value={`${formData.porcentaje_adulto}%`}
              />
            </div>
          )}
        </div>

        {/* Adolescent Rates */}
        <div style={{ display: 'grid', gridTemplateColumns: isFreelancer ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          {!isFreelancer && (
            <div>
              <label className="erp-label">Costo Adolesc.</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                placeholder="0.00"
                value={formData.costo_noche_adolescente}
                onChange={(e) => {
                  handleChange('costo_noche_adolescente', e.target.value);
                  handleCalculatePercent('costo_noche_adolescente', 'precio_noche_adolescente', 'porcentaje_adolescente', e.target.value, formData.precio_noche_adolescente);
                }}
              />
            </div>
          )}
          <div>
            <label className="erp-label">Precio Adolesc.</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              placeholder="0.00"
              value={formData.precio_noche_adolescente}
              onChange={(e) => {
                handleChange('precio_noche_adolescente', e.target.value);
                handleCalculatePercent('costo_noche_adolescente', 'precio_noche_adolescente', 'porcentaje_adolescente', formData.costo_noche_adolescente, e.target.value);
              }}
            />
          </div>
          {!isFreelancer && (
            <div>
              <label className="erp-label">Porcentaje Adolesc. %</label>
              <input
                type="text"
                readOnly
                className="erp-input"
                style={{ opacity: 0.7 }}
                value={`${formData.porcentaje_adolescente}%`}
              />
            </div>
          )}
        </div>

        {/* Children Rates */}
        <div style={{ display: 'grid', gridTemplateColumns: isFreelancer ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          {!isFreelancer && (
            <div>
              <label className="erp-label">Costo Niño</label>
              <input
                type="number"
                step="0.01"
                className="erp-input"
                placeholder="0.00"
                value={formData.costo_noche_nino}
                onChange={(e) => {
                  handleChange('costo_noche_nino', e.target.value);
                  handleCalculatePercent('costo_noche_nino', 'precio_noche_nino', 'porcentaje_nino', e.target.value, formData.precio_noche_nino);
                }}
              />
            </div>
          )}
          <div>
            <label className="erp-label">Precio Niño</label>
            <input
              type="number"
              step="0.01"
              className="erp-input"
              placeholder="0.00"
              value={formData.precio_noche_nino}
              onChange={(e) => {
                handleChange('precio_noche_nino', e.target.value);
                handleCalculatePercent('costo_noche_nino', 'precio_noche_nino', 'porcentaje_nino', formData.costo_noche_nino, e.target.value);
              }}
            />
          </div>
          {!isFreelancer && (
            <div>
              <label className="erp-label">Porcentaje Niño %</label>
              <input
                type="text"
                readOnly
                className="erp-input"
                style={{ opacity: 0.7 }}
                value={`${formData.porcentaje_nino}%`}
              />
            </div>
          )}
        </div>

        {/* Toggles (Suplemento & Fecha de Venta) */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={formData.suplemento}
              onChange={(e) => handleChange('suplemento', e.target.checked)}
            />
            <span>Tarifa de Suplemento</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem' }}>
            <input
              type="checkbox"
              checked={formData.has_fecha_venta}
              onChange={(e) => handleChange('has_fecha_venta', e.target.checked)}
            />
            <span>Definir Fecha de Venta (Promoción)</span>
          </label>
        </div>

        {formData.has_fecha_venta && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
            <div>
              <label className="erp-label">Fecha Venta Desde:</label>
              <input
                type="date"
                className="erp-input"
                value={formData.desde_venta}
                onChange={(e) => handleChange('desde_venta', e.target.value)}
              />
            </div>
            <div>
              <label className="erp-label">Fecha Venta Hasta:</label>
              <input
                type="date"
                className="erp-input"
                value={formData.hasta_venta}
                onChange={(e) => handleChange('hasta_venta', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Guardar Tarifa
          </button>
        </div>
      </form>
    </Modal>
  );
}
