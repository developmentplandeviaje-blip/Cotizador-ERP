import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function AssignMetodosModal({ isOpen, onClose, onSaveSuccess }) {
  const [asesores, setAsesores] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [selectedAsesor, setSelectedAsesor] = useState('');
  const [selectedMetodos, setSelectedMetodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedAsesor('');
      setSelectedMetodos([]);
      setErrorMessage('');
      setLoading(true);

      Promise.all([
        axios.get('/v1/users/agencia', { params: { per_page: 100 } }),
        axios.get('/v1/finance/metodos-pago', { params: { per_page: 100 } })
      ])
        .then(([resAsesores, resMetodos]) => {
          setAsesores(resAsesores.data.data || []);
          setMetodos(resMetodos.data.data || []);
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage('Error al cargar datos necesarios.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleAsesorChange = (asesorId) => {
    setSelectedAsesor(asesorId);
    if (!asesorId) {
      setSelectedMetodos([]);
      return;
    }
    // Calculate which methods this asesor currently has assigned
    const currentAssigned = metodos.filter(m => m.asesores && m.asesores.some(a => a.id_asesor === parseInt(asesorId))).map(m => m.id);
    setSelectedMetodos(currentAssigned);
  };

  const handleToggleMetodo = (metodoId) => {
    if (selectedMetodos.includes(metodoId)) {
      setSelectedMetodos(prev => prev.filter(id => id !== metodoId));
    } else {
      setSelectedMetodos(prev => [...prev, metodoId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsesor) {
      setErrorMessage('Debe seleccionar un líder o asesor.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      await axios.post(`/v1/users/agencia/${selectedAsesor}/metodos-pago`, {
        metodos: selectedMetodos
      });
      onSaveSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al asignar los métodos de pago.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Métodos de Pago"
      width="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {errorMessage && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.875rem' }}>
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Cargando datos...</div>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: '#CBD5E1', marginBottom: '8px' }}>
                Seleccione Asesor o Líder <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                className="erp-input"
                style={{ width: '100%' }}
                value={selectedAsesor}
                onChange={(e) => handleAsesorChange(e.target.value)}
                required
              >
                <option value="">-- Seleccionar --</option>
                {asesores.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name} ({a.level})</option>
                ))}
              </select>
            </div>

            {selectedAsesor && (
              <div>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#94A3B8' }}>
                  Seleccione los métodos de pago disponibles que se asignarán a este asesor:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                  {metodos.map((metodo) => {
                    const isChecked = selectedMetodos.includes(metodo.id);
                    return (
                      <label
                        key={metodo.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                          border: isChecked ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMetodo(metodo.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>
                            {metodo.nombre}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {metodo.tipo.toUpperCase()}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {metodos.length === 0 && (
                    <div style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No hay métodos de pago registrados.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} disabled={saving} className="btn-form-cancel">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !selectedAsesor} className="btn-form-nxt">
            {saving ? 'Guardando...' : 'Guardar Asignación'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
