import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import CustomSelect from '../../common/CustomSelect';
import CustomNumberInput from '../../common/CustomNumberInput';
import { formatEmail, validateEmail } from '../../../utils/validation';
import imgHoteles from '../../../assets/Hoteles.svg';
import imgAerolineas from '../../../assets/Aerolineas.svg';
import imgTraslados from '../../../assets/Traslados.svg';
import imgExcursiones from '../../../assets/Excursiones.svg';
import imgPaquetes from '../../../assets/Paqueteria.svg';
import imgVehiculos from '../../../assets/Vehiculos.svg';
import imgFerrys from '../../../assets/ferrys-01.svg';
import imgAgregar from '../../../assets/Agregar.svg';

const SERVICIOS = [
  { id: 'hotel', label: 'Hotel', icon: imgHoteles },
  { id: 'ferry', label: 'Ferry', icon: imgFerrys },
  { id: 'vuelo', label: 'Vuelo', icon: imgAerolineas },
  { id: 'excursion', label: 'Excursión', icon: imgExcursiones },
  { id: 'vehiculo', label: 'Vehículo', icon: imgVehiculos },
  { id: 'traslado', label: 'Traslado', icon: imgTraslados },
  { id: 'paquete', label: 'Paquete', icon: imgPaquetes },
  { id: 'otro', label: 'Otro', icon: imgAgregar },
];

const NIVELES = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Administracion', label: 'Administración' },
  { value: 'Contabilidad', label: 'Contabilidad' },
  { value: 'Operativo', label: 'Operativo' },
  { value: 'Tarifas', label: 'Tarifas' },
  { value: 'Lider', label: 'Líder' },
  { value: 'Asesor', label: 'Asesor' },
];

export default function UserAgenciaModal({ isOpen, onClose, onSave, userToEdit = null, currentUser = null }) {
  const activeUser = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
  const isLider = ['lider', 'líder'].includes((activeUser?.level || '').trim().toLowerCase());

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
    let numVal = value === '' ? '' : parseFloat(value);
    if (typeof numVal === 'number' && numVal > 100) numVal = 100;
    if (typeof numVal === 'number' && numVal < 0) numVal = 0;
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

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(`Correo inválido: ${emailCheck.message}`);
      setSaving(false);
      return;
    }

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
      stepStyle="tabs"
      onStepChange={(step) => setCurrentStep(step)}
      width="580px"
    >
      <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
          {errorMessage && (
            <div
              style={{
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* First Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                    Nombre <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    maxLength={50}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value.slice(0, 50))}
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                    Apellido <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    maxLength={50}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.slice(0, 50))}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0px 4px 0px' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: 0 }}>
                    Correo Electrónico <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  {email && (
                    <span style={{ fontSize: '0.7rem', color: validateEmail(email).isValid ? '#10B981' : '#F59E0B' }}>
                      {validateEmail(email).isValid ? '✓ Válido' : validateEmail(email).message}
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  autoComplete="off"
                  required
                  maxLength={50}
                  value={email}
                  onChange={(e) => setEmail(formatEmail(e.target.value))}
                  placeholder="asesor@plandeviaje.com"
                  className="erp-input"
                  style={{
                    width: '100%',
                    borderColor: errors.email || (email && !validateEmail(email).isValid) ? '#EF4444' : undefined,
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                    Nivel / Rol <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  {isLider ? (
                    <div>
                      <CustomSelect
                        value="Asesor"
                        disabled={true}
                        style={{ width: '100%', opacity: 0.85, cursor: 'not-allowed' }}
                      >
                        <option value="Asesor">Asesor</option>
                      </CustomSelect>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                        Como Líder, solo tiene permisos para gestionar Asesores.
                      </span>
                    </div>
                  ) : (
                    <CustomSelect
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {NIVELES.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </option>
                      ))}
                    </CustomSelect>
                  )}
                  {errors.level && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.level[0]}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '8px 0px 0px 0px' }}>
                    Estado de Acceso
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '12px' }}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={status}
                      onClick={() => setStatus((currentStatus) => !currentStatus)}
                      className={`status-toggle-button${status ? ' is-active' : ''}`}
                    >
                      {status ? 'Habilitado' : 'Desactivado'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                  Contraseña {userToEdit ? <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(Dejar en blanco para conservar contraseña actual)</span> : <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  maxLength={50}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 50))}
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
                    <span style={{ fontSize: '0.8125rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={srv.icon} alt={srv.label} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                      <span>{srv.label}</span>
                    </span>
                    <div style={{ position: 'relative' }}>
                      <CustomNumberInput
                        step={0.01}
                        min={0}
                        max={ 100}
                        maxDigits={3}
                        allowDecimals
                        value={comisiones[srv.id] !== undefined ? comisiones[srv.id] : 0}
                        onChange={(e) => handleComisionChange(srv.id, e.target.value)}
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
                type="submit"
                disabled={saving}
                className="btn-form-nxt"
              >
                {saving ? 'Guardando...' : (userToEdit ? 'Actualizar Usuario' : 'Crear Usuario')}
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