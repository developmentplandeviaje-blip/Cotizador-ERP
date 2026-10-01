import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';

export default function AliadoVendedoresModal({ isOpen, onClose, aliado }) {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [vendedorToEdit, setVendedorToEdit] = useState(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(true);

  const [saving, setSaving] = useState(false);
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
    }
  }, [isOpen, fetchVendedores]);

  const handleOpenCreate = () => {
    setVendedorToEdit(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setStatus(true);
    setErrorMessage('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v) => {
    setVendedorToEdit(v);
    setFirstName(v.first_name);
    setLastName(v.last_name);
    setEmail(v.email);
    setPassword('');
    setStatus(v.status);
    setErrorMessage('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setErrors({});

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      status: status ? 1 : 0
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vendedores de: ${aliado?.razon_social}`} width="700px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
        
        {!isFormOpen ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleOpenCreate} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                + Agregar Vendedor
              </button>
            </div>
            
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nombre</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Estado</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
                  ) : vendedores.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No hay vendedores asociados.</td></tr>
                  ) : (
                    vendedores.map(v => (
                      <tr key={v.id}>
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{v.first_name} {v.last_name}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{v.email}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {v.status ? <Badge variant="success">Activo</Badge> : <Badge variant="error">Inactivo</Badge>}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleOpenEdit(v)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#FFF', cursor: 'pointer' }}>Editar</button>
                          <button onClick={() => handleDelete(v)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#FCA5A5', cursor: 'pointer' }}>Eliminar</button>
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
              {vendedorToEdit ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h3>
            
            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#FCA5A5', padding: '10px', fontSize: '0.8125rem' }}>
                {errorMessage}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Nombres *</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="erp-input" style={{ width: '100%', borderColor: errors.first_name ? '#EF4444' : undefined }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Apellidos *</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="erp-input" style={{ width: '100%', borderColor: errors.last_name ? '#EF4444' : undefined }} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Correo Electrónico *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="erp-input" style={{ width: '100%', borderColor: errors.email ? '#EF4444' : undefined }} />
              {errors.email && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.email[0]}</span>}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#E2E8F0', marginBottom: '4px' }}>Contraseña {vendedorToEdit ? '(en blanco para mantener actual)' : '*'}</label>
              <input type="password" required={!vendedorToEdit} value={password} onChange={e => setPassword(e.target.value)} className="erp-input" style={{ width: '100%', borderColor: errors.password ? '#EF4444' : undefined }} />
              {errors.password && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.password[0]}</span>}
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E2E8F0', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#E87217' }} />
                <span>Habilitado (Activo)</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={saving} className="btn-form-cancel">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-form-nxt">{saving ? 'Guardando...' : 'Guardar Vendedor'}</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
