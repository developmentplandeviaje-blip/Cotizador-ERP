import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';

const SERVICIOS = [
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'ferry', label: 'Ferry', icon: '⛴️' },
  { id: 'vuelo', label: 'Vuelo', icon: '✈️' },
  { id: 'excursion', label: 'Excursión', icon: '🧗' },
  { id: 'vehiculo', label: 'Vehículo', icon: '🚗' },
  { id: 'traslado', label: 'Traslado', icon: '🚐' },
  { id: 'paquete', label: 'Paquete', icon: '📦' },
  { id: 'otro', label: 'Otro', icon: '🧩' },
];

const NIVELES = ['Administrador', 'Sub Gerente', 'Lider', 'Asesor'];

export default function UserAgenciaModal({ isOpen, onClose, onSave, userToEdit = null }) {
  const [currentStep, setCurrentStep] = useState(1); // 'general' | 'comisiones'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('Asesor');
  const [status, setStatus] = useState(true);

  // Commissions state
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

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setErrors({});
      setCurrentStep(1);

      if (userToEdit) {
        setFirstName(userToEdit.first_name || '');
        setLastName(userToEdit.last_name || '');
        setEmail(userToEdit.email || '');
        setPassword('');
        setLevel(userToEdit.level || 'Asesor');
        setStatus(userToEdit.status !== undefined ? Boolean(userToEdit.status) : true);

        // Pre-fill commissions
        const initialComms = { ...comisiones };
        if (userToEdit.comisiones && typeof userToEdit.comisiones === 'object') {
          Object.keys(initialComms).forEach((key) => {
            initialComms[key] = userToEdit.comisiones[key] !== undefined ? userToEdit.comisiones[key] : 0;
          });
        }
        setComisiones(initialComms);
      } else {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setLevel('Asesor');
        setStatus(true);
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

  if (!isOpen) return null;

  const handleComisionChange = (servicioKey, value) => {
    const numVal = value === '' ? '' : parseFloat(value);
    setComisiones((prev) => ({
      ...prev,
      [servicioKey]: numVal,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setErrors({});

    // Prepare payload
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      level,
      status: status ? 1 : 0,
      comisiones,
    };

    if (password.trim() !== '') {
      payload.password = password;
    } else if (!userToEdit) {
      setErrorMessage('La contraseña es requerida para nuevos usuarios.');
      setSaving(false);
      return;
    }

    try {
      if (userToEdit) {
        await axios.put(`/v1/users/agencia/${userToEdit.id}`, payload);
      } else {
        await axios.post('/v1/users/agencia', payload);
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
      title={userToEdit ? 'Editar Usuario de Agencia' : 'Nuevo Usuario de Agencia'}
      steps={['Datos Generales', 'Comisiones por Servicio (%)']}
      currentStep={currentStep}
      width="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#FCA5A5',
                  fontSize: '0.875rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Tab: General */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* First Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                      Nombre <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Carlos"
                      className="erp-input"
                      style={{
                        width: '100%',
                        borderColor: errors.first_name ? '#EF4444' : undefined,
                      }}
                    />
                    {errors.first_name && (
                      <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.first_name[0]}
                      </span>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                      Apellido <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej. Pérez"
                      className="erp-input"
                      style={{
                        width: '100%',
                        borderColor: errors.last_name ? '#EF4444' : undefined,
                      }}
                    />
                    {errors.last_name && (
                      <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.last_name[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                    Correo Electrónico <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="asesor@plandeviaje.com"
                    className="erp-input"
                    style={{
                      width: '100%',
                      borderColor: errors.email ? '#EF4444' : undefined,
                    }}
                  />
                  {errors.email && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.email[0]}
                    </span>
                  )}
                </div>

                {/* Level & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Level */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                      Nivel / Rol <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="erp-input"
                      style={{ width: '100%' }}
                    >
                      {NIVELES.map((lvl) => (
                        <option key={lvl} value={lvl} style={{ backgroundColor: '#1E293B', color: '#FFF' }}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                    {errors.level && (
                      <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                        {errors.level[0]}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                      Estado de Acceso
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={status}
                          onChange={(e) => setStatus(e.target.checked)}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: '#E87217',
                            cursor: 'pointer',
                          }}
                        />
                        <span>{status ? 'Habilitado (Activo)' : 'Deshabilitado (Bloqueado)'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '6px' }}>
                    Contraseña {userToEdit ? <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(dejar en blanco para conservar actual)</span> : <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={userToEdit ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="erp-input"
                    style={{
                      width: '100%',
                      borderColor: errors.password ? '#EF4444' : undefined,
                    }}
                  />
                  {errors.password && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.password[0]}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Comisiones */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Indique el porcentaje de comisión (%) que recibe el usuario por cada rubro cotizado y vendido:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  {SERVICIOS.map((srv) => (
                    <div
                      key={srv.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{srv.icon}</span>
                        <span>{srv.label}</span>
                      </span>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={comisiones[srv.id] !== undefined ? comisiones[srv.id] : 0}
                          onChange={(e) => handleComisionChange(srv.id, e.target.value)}
                          className="erp-input"
                          style={{
                            width: '100%',
                            paddingRight: '28px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: '#E87217',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94A3B8',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                          }}
                        >
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '16px'
          }}
        >
          {currentStep === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-form-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-form-nxt"
                onClick={() => setCurrentStep(2)}
              >
                Siguiente
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-form-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-form-prv"
                onClick={() => setCurrentStep(1)}
                disabled={saving}
              >
                Anterior
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-form-nxt"
              >
                {saving ? 'Guardando...' : (userToEdit ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}