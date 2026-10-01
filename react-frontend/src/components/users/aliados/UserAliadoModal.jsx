import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';

export default function UserAliadoModal({ isOpen, onClose, onSave, aliadoToEdit = null }) {
  const [razonSocial, setRazonSocial] = useState('');
  const [rif, setRif] = useState('');
  const [contactoPrincipal, setContactoPrincipal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [status, setStatus] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setErrors({});
      if (aliadoToEdit) {
        setRazonSocial(aliadoToEdit.razon_social || '');
        setRif(aliadoToEdit.rif || '');
        setContactoPrincipal(aliadoToEdit.contacto_principal || '');
        setTelefono(aliadoToEdit.telefono || '');
        setCorreo(aliadoToEdit.correo || '');
        setStatus(aliadoToEdit.status !== undefined ? Boolean(aliadoToEdit.status) : true);
      } else {
        setRazonSocial('');
        setRif('');
        setContactoPrincipal('');
        setTelefono('');
        setCorreo('');
        setStatus(true);
      }
    }
  }, [isOpen, aliadoToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setErrors({});

    const payload = {
      razon_social: razonSocial,
      rif,
      contacto_principal: contactoPrincipal,
      telefono,
      correo,
      status: status ? 1 : 0,
    };

    try {
      if (aliadoToEdit) {
        await axios.put(`/v1/users/aliados/${aliadoToEdit.id}`, payload);
      } else {
        await axios.post('/v1/users/aliados', payload);
      }
      onSave();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
        setErrorMessage('Por favor verifique los campos señalados.');
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error al procesar la solicitud.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={aliadoToEdit ? 'Editar Empresa Aliada' : 'Nueva Empresa Aliada'}
      width="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#FCA5A5', padding: '12px', fontSize: '0.875rem' }}>
            {errorMessage}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>Razón Social <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="erp-input" style={{ width: '100%', borderColor: errors.razon_social ? '#EF4444' : undefined }} />
          {errors.razon_social && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.razon_social[0]}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>RIF / Identificación</label>
            <input type="text" value={rif} onChange={(e) => setRif(e.target.value)} className="erp-input" style={{ width: '100%', borderColor: errors.rif ? '#EF4444' : undefined }} />
            {errors.rif && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.rif[0]}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>Contacto Principal</label>
            <input type="text" value={contactoPrincipal} onChange={(e) => setContactoPrincipal(e.target.value)} className="erp-input" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>Teléfono</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="erp-input" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>Correo Electrónico</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="erp-input" style={{ width: '100%' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0', fontSize: '0.875rem', marginTop: '8px' }}>
            <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#E87217', cursor: 'pointer' }} />
            <span>Habilitado (Activo)</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button type="button" onClick={onClose} disabled={saving} className="btn-form-cancel">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-form-nxt">
            {saving ? 'Guardando...' : (aliadoToEdit ? 'Actualizar Aliado' : 'Crear Aliado')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
