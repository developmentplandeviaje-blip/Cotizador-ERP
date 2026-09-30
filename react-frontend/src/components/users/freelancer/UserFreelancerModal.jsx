import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import { showToast } from '../../../utils/toast';

const SERVICIOS = [
  { key: 'hotel', label: 'Hotel' },
  { key: 'ferry', label: 'Ferry' },
  { key: 'vuelo', label: 'Vuelo' },
  { key: 'excursion', label: 'Excursión' },
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'traslado', label: 'Traslado' },
  { key: 'paquete', label: 'Paquete' },
  { key: 'otro', label: 'Otro' },
];

export default function UserFreelancerModal({
  isOpen,
  onClose,
  onSaveSuccess,
  userToEdit = null,
}) {
  // User Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(true);

  // Freelancer Company Info
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [rif, setRif] = useState('');
  const [correoEmpresa, setCorreoEmpresa] = useState('');
  const [telefono1, setTelefono1] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [direccion, setDireccion] = useState('');
  const [colorPrimario, setColorPrimario] = useState('#E87217');

  // Commissions
  const [comisiones, setComisiones] = useState({
    hotel: 0,
    ferry: 0,
    vuelo: 0,
    excursion: 0,
    vehiculo: 0,
    traslado: 0,
    paquete: 0,
    otro: 0,
  });

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'empresa' | 'comisiones'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setActiveTab('info');
      if (userToEdit) {
        setFirstName(userToEdit.first_name || '');
        setLastName(userToEdit.last_name || '');
        setEmail(userToEdit.email || '');
        setPassword('');
        setStatus(userToEdit.status !== undefined ? Boolean(userToEdit.status) : true);

        const f = userToEdit.freelancer;
        setNombreEmpresa(f?.nombre || '');
        setRif(f?.rif || '');
        setCorreoEmpresa(f?.correo || '');
        setTelefono1(f?.telefono_1 || '');
        setTelefono2(f?.telefono_2 || '');
        setDireccion(f?.direccion || '');
        setColorPrimario(f?.color_primario || '#E87217');

        if (userToEdit.comisiones) {
          setComisiones({
            hotel: userToEdit.comisiones.hotel ?? 0,
            ferry: userToEdit.comisiones.ferry ?? 0,
            vuelo: userToEdit.comisiones.vuelo ?? 0,
            excursion: userToEdit.comisiones.excursion ?? 0,
            vehiculo: userToEdit.comisiones.vehiculo ?? 0,
            traslado: userToEdit.comisiones.traslado ?? 0,
            paquete: userToEdit.comisiones.paquete ?? 0,
            otro: userToEdit.comisiones.otro ?? 0,
          });
        }
      } else {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setStatus(true);
        setNombreEmpresa('');
        setRif('');
        setCorreoEmpresa('');
        setTelefono1('');
        setTelefono2('');
        setDireccion('');
        setColorPrimario('#E87217');
        setComisiones({
          hotel: 0,
          ferry: 0,
          vuelo: 0,
          excursion: 0,
          vehiculo: 0,
          traslado: 0,
          paquete: 0,
          otro: 0,
        });
      }
    }
  }, [isOpen, userToEdit]);

  const handleComisionChange = (key, val) => {
    const num = parseFloat(val);
    setComisiones((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMessage('Por favor ingrese el nombre, apellido y correo electrónico.');
      setActiveTab('info');
      return;
    }
    if (!userToEdit && !password) {
      setErrorMessage('La contraseña es obligatoria para nuevos usuarios.');
      setActiveTab('info');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        status,
        nombre_empresa: nombreEmpresa.trim() || null,
        rif: rif.trim() || null,
        correo_empresa: correoEmpresa.trim() || null,
        telefono_1: telefono1.trim() || null,
        telefono_2: telefono2.trim() || null,
        direccion: direccion.trim() || null,
        color_primario: colorPrimario,
        comisiones,
      };

      if (password) {
        payload.password = password;
      }

      if (userToEdit) {
        await axios.put(`/v1/users/freelancer/${userToEdit.id}`, payload);
        showToast('Usuario Freelancer actualizado con éxito.', 'success');
      } else {
        await axios.post('/v1/users/freelancer', payload);
        showToast('Usuario Freelancer registrado con éxito.', 'success');
      }

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Error guardando freelancer:', err);
      const errors = err.response?.data?.errors;
      let errorMsg = 'Error al guardar el usuario freelancer.';
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
      title={userToEdit ? 'Editar Usuario Freelancer' : 'Registrar Usuario Freelancer'}
      size="lg"
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
            whiteSpace: 'pre-line',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', gap: '10px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'info' ? '#E87217' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
          >
            Datos Personales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('empresa')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'empresa' ? '#E87217' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
          >
            Datos Empresa / Marca
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comisiones')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'comisiones' ? '#E87217' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
            }}
          >
            Comisiones (%)
          </button>
        </div>

        {/* TAB 1: Datos Personales */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="erp-label">Nombre <span className="req">*</span></label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="Ej: Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Apellido <span className="req">*</span></label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="Ej: Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="erp-label">Correo Electrónico <span className="req">*</span></label>
                <input
                  type="email"
                  className="erp-input"
                  placeholder="juan.perez@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">
                  Contraseña {userToEdit ? '(Dejar en blanco para conservar)' : <span className="req">*</span>}
                </label>
                <input
                  type="password"
                  className="erp-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!userToEdit}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="freelancer-status"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                style={{ accentColor: '#E87217', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="freelancer-status" style={{ color: '#F8FAFC', cursor: 'pointer', fontSize: '0.875rem' }}>
                Usuario Habilitado / Activo
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: Datos Empresa */}
        {activeTab === 'empresa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="erp-label">Nombre de Empresa / Agencia Freelance</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="Ej: Caribe Tours Freelance"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">RIF / Identificación Fiscal</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="Ej: J-12345678-9 o V-12345678-0"
                  value={rif}
                  onChange={(e) => setRif(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label className="erp-label">Correo de Empresa</label>
                <input
                  type="email"
                  className="erp-input"
                  placeholder="contacto@empresa.com"
                  value={correoEmpresa}
                  onChange={(e) => setCorreoEmpresa(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Teléfono Principal</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="+58 412-0000000"
                  value={telefono1}
                  onChange={(e) => setTelefono1(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Teléfono Secundario</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="+58 212-0000000"
                  value={telefono2}
                  onChange={(e) => setTelefono2(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div>
                <label className="erp-label">Dirección Fiscal / Ubicación</label>
                <input
                  type="text"
                  className="erp-input"
                  placeholder="Ciudad, Estado, Dirección"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="erp-label">Color de Marca</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="erp-input"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Comisiones */}
        {activeTab === 'comisiones' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {SERVICIOS.map((s) => (
              <div key={s.key}>
                <label className="erp-label">Comisión {s.label} (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="erp-input"
                  placeholder="0.0"
                  value={comisiones[s.key] !== undefined ? comisiones[s.key] : 0}
                  onChange={(e) => handleComisionChange(s.key, e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
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
              : userToEdit
                ? 'Actualizar Freelancer'
                : 'Guardar Freelancer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
