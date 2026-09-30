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

export default function UserFreelancerModal({ isOpen, onClose, onSave, userToEdit = null }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Acceso, 2: Datos Empresa, 3: Comisiones
  
  // Acceso User fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(true);

  // Empresa Freelancer fields
  const [freelancerNombre, setFreelancerNombre] = useState('');
  const [freelancerRif, setFreelancerRif] = useState('');
  const [freelancerTelefono1, setFreelancerTelefono1] = useState('');
  const [freelancerTelefono2, setFreelancerTelefono2] = useState('');
  const [freelancerDireccion, setFreelancerDireccion] = useState('');
  const [freelancerColor, setFreelancerColor] = useState('#E87217');

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
        // Acceso
        setFirstName(userToEdit.first_name || '');
        setLastName(userToEdit.last_name || '');
        setEmail(userToEdit.email || '');
        setPassword('');
        setStatus(userToEdit.status !== undefined ? Boolean(userToEdit.status) : true);

        // Empresa Freelancer
        if (userToEdit.freelancer) {
          setFreelancerNombre(userToEdit.freelancer.nombre || '');
          setFreelancerRif(userToEdit.freelancer.rif || '');
          setFreelancerTelefono1(userToEdit.freelancer.telefono_1 || '');
          setFreelancerTelefono2(userToEdit.freelancer.telefono_2 || '');
          setFreelancerDireccion(userToEdit.freelancer.direccion || '');
          setFreelancerColor(userToEdit.freelancer.color_primario || '#E87217');
        } else {
          setFreelancerNombre('');
          setFreelancerRif('');
          setFreelancerTelefono1('');
          setFreelancerTelefono2('');
          setFreelancerDireccion('');
          setFreelancerColor('#E87217');
        }

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
        setStatus(true);
        setFreelancerNombre('');
        setFreelancerRif('');
        setFreelancerTelefono1('');
        setFreelancerTelefono2('');
        setFreelancerDireccion('');
        setFreelancerColor('#E87217');
        setComisiones({
          hotel: 0, ferry: 0, vuelo: 0, excursion: 0,
          vehiculo: 0, traslado: 0, paquete: 0, otro: 0,
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
      status: status ? 1 : 0,
      freelancer_nombre: freelancerNombre,
      freelancer_rif: freelancerRif,
      freelancer_telefono_1: freelancerTelefono1,
      freelancer_telefono_2: freelancerTelefono2,
      freelancer_direccion: freelancerDireccion,
      freelancer_color_primario: freelancerColor,
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
        await axios.put(`/v1/users/freelancer/${userToEdit.id}`, payload);
      } else {
        await axios.post('/v1/users/freelancer', payload);
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
      title={userToEdit ? 'Editar Freelancer' : 'Nuevo Freelancer'}
      steps={['Datos Acceso', 'Datos Empresa', 'Comisiones (%)']}
      currentStep={currentStep}
      stepStyle="tabs"
      onStepChange={(step) => setCurrentStep(step)}
      width="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#FCA5A5',
                fontSize: '0.875rem',
                marginBottom: '16px',
                padding: '12px'
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Tab 1: Acceso */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* First Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                    Nombre Personal <span style={{ color: '#EF4444' }}>*</span>
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                    Apellido Personal <span style={{ color: '#EF4444' }}>*</span>
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
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                  Correo Electrónico de Acceso <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@freelancer.com"
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

              {/* Password & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                    Contraseña {userToEdit ? <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(en blanco = actual)</span> : <span style={{ color: '#EF4444' }}>*</span>}
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
                
                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '8px 0px 0px 0px' }}>
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
                      <span>{status ? 'Habilitado (Activo)' : 'Deshabilitado'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Empresa Freelancer */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '8px' }}>
                Datos comerciales de la agencia / empresa del Freelancer.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* Nombre de Agencia */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                    Nombre de Empresa / Marca <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={freelancerNombre}
                    onChange={(e) => setFreelancerNombre(e.target.value)}
                    placeholder="Ej. Viajes Carlos"
                    className="erp-input"
                    style={{
                      width: '100%',
                      borderColor: errors.freelancer_nombre ? '#EF4444' : undefined,
                    }}
                  />
                  {errors.freelancer_nombre && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.freelancer_nombre[0]}
                    </span>
                  )}
                </div>

                {/* RIF */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', marginBottom: '4px' }}>
                    RIF / Documento
                  </label>
                  <input
                    type="text"
                    value={freelancerRif}
                    onChange={(e) => setFreelancerRif(e.target.value)}
                    placeholder="J-12345678"
                    className="erp-input"
                    style={{
                      width: '100%',
                      borderColor: errors.freelancer_rif ? '#EF4444' : undefined,
                    }}
                  />
                  {errors.freelancer_rif && (
                    <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                      {errors.freelancer_rif[0]}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Teléfono 1 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                    Teléfono Principal
                  </label>
                  <input
                    type="text"
                    value={freelancerTelefono1}
                    onChange={(e) => setFreelancerTelefono1(e.target.value)}
                    placeholder="+58 412-1234567"
                    className="erp-input"
                    style={{ width: '100%' }}
                  />
                </div>
                {/* Teléfono 2 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                    Teléfono Alternativo
                  </label>
                  <input
                    type="text"
                    value={freelancerTelefono2}
                    onChange={(e) => setFreelancerTelefono2(e.target.value)}
                    placeholder="+58 212-1234567"
                    className="erp-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                  Dirección Comercial
                </label>
                <textarea
                  value={freelancerDireccion}
                  onChange={(e) => setFreelancerDireccion(e.target.value)}
                  placeholder="Dirección fiscal o de oficinas..."
                  className="erp-input"
                  rows={2}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              {/* Color */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0', margin: '6px 0px 4px 0px' }}>
                  Color Primario (Marca)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={freelancerColor}
                    onChange={(e) => setFreelancerColor(e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: '2px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  <span style={{ color: '#E2E8F0', fontSize: '0.875rem' }}>{freelancerColor}</span>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Comisiones */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                Indique el porcentaje de comisión (%) que recibe el freelancer por cada rubro cotizado y vendido:
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
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-form-cancel"
          >
            Cancelar
          </button>
          
          {currentStep < 3 ? (
             <button
             type="button"
             disabled={saving}
             onClick={() => setCurrentStep(currentStep + 1)}
             className="btn-form-nxt"
           >
             Siguiente
           </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="btn-form-nxt"
            >
              {saving ? 'Guardando...' : (userToEdit ? 'Actualizar Freelancer' : 'Crear Freelancer')}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
