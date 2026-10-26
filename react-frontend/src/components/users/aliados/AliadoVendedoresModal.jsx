import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import { formatEmail, validateEmail } from '../../../utils/validation';

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

const DEFAULT_COMISIONES = {
  hotel: 0,
  ferry: 0,
  vuelo: 0,
  excursion: 0,
  vehiculo: 0,
  traslado: 0,
  paquete: 0,
  otro: 0,
};

export default function AliadoVendedoresModal({ isOpen, onClose, aliado }) {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredComisiones, setHoveredComisiones] = useState(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Datos Acceso, 2: Comisiones (%)
  const [vendedorToEdit, setVendedorToEdit] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(true);
  const [comisiones, setComisiones] = useState({ ...DEFAULT_COMISIONES });

  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  const fetchVendedores = useCallback(async () => {
    if (!aliado) return;
    setLoading(true);
    try {
      const res = await axios.get(`/v1/users/aliados/${aliado.id}/vendedores`);
      setVendedores(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [aliado]);

  useEffect(() => {
    if (isOpen) {
      fetchVendedores();
      setIsFormOpen(false);
      setHoveredComisiones(null);
    }
  }, [isOpen, fetchVendedores]);

  const handleOpenCreate = () => {
    setVendedorToEdit(null);
    setFormStep(1);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setStatus(true);
    setComisiones({ ...DEFAULT_COMISIONES });
    setErrorMessage('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v) => {
    setVendedorToEdit(v);
    setFormStep(1);
    setFirstName(v.first_name || '');
    setLastName(v.last_name || '');
    setEmail(v.email || '');
    setPassword('');
    setStatus(Boolean(v.status));
    
    // Fill commissions
    const comms = { ...DEFAULT_COMISIONES };
    if (v.comisiones && typeof v.comisiones === 'object') {
      Object.keys(comms).forEach((key) => {
        comms[key] = v.comisiones[key] !== undefined ? v.comisiones[key] : 0;
      });
    }
    setComisiones(comms);

    setErrorMessage('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleComisionChange = (servicioId, value) => {
    const num = parseFloat(value);
    setComisiones((prev) => ({
      ...prev,
      [servicioId]: isNaN(num) ? 0 : Math.max(0, Math.min(100, num)),
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setErrors({});

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(`Correo inválido: ${emailCheck.message}`);
      setSaving(false);
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      status: status ? 1 : 0,
      comisiones,
    };
    if (password) payload.password = password;

    try {
      if (vendedorToEdit) {
        await axios.put(`/v1/users/aliados/${aliado.id}/vendedores/${vendedorToEdit.id}`, payload);
      } else {
        await axios.post(`/v1/users/aliados/${aliado.id}/vendedores`, payload);
      }
      setIsFormOpen(false);
      fetchVendedores();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrorMessage(err.response?.data?.message || 'Error al guardar.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`¿Eliminar al vendedor ${v.first_name}?`)) return;
    try {
      await axios.delete(`/v1/users/aliados/${aliado.id}/vendedores/${v.id}`);
      fetchVendedores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleToggleStatus = async (v) => {
    setTogglingId(v.id);
    try {
      const res = await axios.patch(`/v1/users/aliados/${aliado.id}/vendedores/${v.id}/toggle-status`);
      const newStatus = res.data?.data?.status !== undefined ? res.data.data.status : !v.status;
      setVendedores((prev) =>
        prev.map((item) => (item.id === v.id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error('Error al cambiar estado del vendedor:', err);
      alert(err.response?.data?.message || 'Error al cambiar estado del vendedor.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vendedores de: ${aliado?.razon_social}`} width="780px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>

        {!isFormOpen ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleOpenCreate} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
                + Agregar Vendedor
              </button>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'visible' }}>
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(232, 114, 23, 0.1)' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}>Nombre</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}>Email</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}>Comisiones</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}>Estado</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>Cargando vendedores...</td></tr>
                  ) : vendedores.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>No hay vendedores asociados.</td></tr>
                  ) : (
                    vendedores.map((v) => (
                      <tr key={v.id} style={{ transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#FFFFFF', fontWeight: 500 }}>
                          {v.first_name} {v.last_name}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94A3B8' }}>
                          {v.email}
                        </td>

                        {/* Commissions Preview */}
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setHoveredComisiones(hoveredComisiones === v.id ? null : v.id)}
                            style={{
                              background: 'rgba(232, 114, 23, 0.1)',
                              border: '1px solid rgba(232, 114, 23, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              color: '#E87217',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Ver %</span>
                          </button>

                          {hoveredComisiones === v.id && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '16px',
                                top: '40px',
                                backgroundColor: '#001231eb',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '10px',
                                padding: '12px',
                                zIndex: 100,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                                minWidth: '220px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px',
                                fontSize: '0.75rem',
                              }}
                            >
                              {Object.entries(v.comisiones || DEFAULT_COMISIONES).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                  <span style={{ color: '#b9c8ddff', textTransform: 'capitalize' }}>{key}:</span>
                                  <span style={{ color: '#E87217', fontWeight: 600 }}>{val}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(v)}
                            disabled={togglingId === v.id}
                            title="Haz clic para alternar estado"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              opacity: togglingId === v.id ? 0.5 : 1,
                              transition: 'opacity 0.2s',
                            }}
                          >
                            {v.status ? <Badge variant="success">Activo</Badge> : <Badge variant="error">Inactivo</Badge>}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEdit(v)}
                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#FFF', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(v)}
                              style={{ background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#FCA5A5', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={onClose} className="btn-form-cancel">Cerrar</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              {vendedorToEdit ? `Editar Vendedor: ${vendedorToEdit.first_name} ${vendedorToEdit.last_name}` : 'Nuevo Vendedor'}
            </h3>

            {/* Stepper / Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setFormStep(1)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: formStep === 1 ? '2px solid #2563EB' : '2px solid transparent',
                  color: formStep === 1 ? '#60A5FA' : '#94A3B8',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>1</span>
                <span>Datos Acceso</span>
              </button>
              <button
                type="button"
                onClick={() => setFormStep(2)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: formStep === 2 ? '2px solid #2563EB' : '2px solid transparent',
                  color: formStep === 2 ? '#60A5FA' : '#94A3B8',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>2</span>
                <span>Comisiones (%)</span>
              </button>
            </div>

            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#FCA5A5', padding: '10px', fontSize: '0.8125rem' }}>
                {errorMessage}
              </div>
            )}

            {/* Step 1: Datos Acceso */}
            {formStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Nombres *</label>
                    <input type="text" required maxLength={50} value={firstName} onChange={e => setFirstName(e.target.value.slice(0, 50))} className="erp-input" style={{ width: '100%', borderColor: errors.first_name ? '#EF4444' : undefined }} />
                    {errors.first_name && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.first_name[0]}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Apellidos *</label>
                    <input type="text" required maxLength={50} value={lastName} onChange={e => setLastName(e.target.value.slice(0, 50))} className="erp-input" style={{ width: '100%', borderColor: errors.last_name ? '#EF4444' : undefined }} />
                    {errors.last_name && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.last_name[0]}</span>}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8125rem', color: '#E2E8F0', margin: 0 }}>Correo Electrónico *</label>
                    {email && (
                      <span style={{ fontSize: '0.7rem', color: validateEmail(email).isValid ? '#10B981' : '#F59E0B' }}>
                        {validateEmail(email).isValid ? '✓ Válido' : validateEmail(email).message}
                      </span>
                    )}
                  </div>
                  <input type="email" required maxLength={50} value={email} onChange={e => setEmail(formatEmail(e.target.value))} className="erp-input" style={{ width: '100%', borderColor: errors.email || (email && !validateEmail(email).isValid) ? '#EF4444' : undefined }} />
                  {errors.email && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.email[0]}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Contraseña {vendedorToEdit ? '(en blanco para mantener actual)' : '*'}</label>
                  <input type="password" required={!vendedorToEdit} maxLength={50} value={password} onChange={e => setPassword(e.target.value.slice(0, 50))} className="erp-input" style={{ width: '100%', borderColor: errors.password ? '#EF4444' : undefined }} />
                  {errors.password && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.password[0]}</span>}
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    color: status ? '#E87217' : '#b9c8ddff',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgb(30, 41, 59)',
                    transition: 'all 0.2s ease',
                    boxShadow: status
                      ? 'inset 3px 3px 6px rgb(0 0 0 / 74%), inset -3px -3px 6px rgb(255 255 255 / 22%)'
                      : '3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.05)',
                    border: status ? '1px solid rgba(232, 114, 23, 0.3)' : '1px solid transparent',
                    userSelect: 'none'
                  }}>
                    <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#E87217' }} />
                    <span>Habilitado (Activo)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Comisiones (%) */}
            {formStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                  Indique el porcentaje de comisión (%) que recibe el vendedor por cada rubro cotizado y vendido:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
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

            {/* Navigation and Submission Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <div>
                {formStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="btn-form-cancel"
                    style={{ marginRight: '8px' }}
                  >
                    ← Volver a Datos
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={saving} className="btn-form-cancel">
                  Cancelar
                </button>
                {formStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep(2)}
                    className="btn-form-nxt"
                  >
                    Siguiente: Comisiones →
                  </button>
                ) : (
                  <button type="submit" disabled={saving} className="btn-form-nxt">
                    {saving ? 'Guardando...' : (vendedorToEdit ? 'Actualizar Vendedor' : 'Crear Vendedor')}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
