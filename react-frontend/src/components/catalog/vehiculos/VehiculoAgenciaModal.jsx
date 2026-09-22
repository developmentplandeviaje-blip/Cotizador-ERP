import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function VehiculoAgenciaModal({ isOpen, onClose, onSaveSuccess }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [nombreAgencia, setNombreAgencia] = useState('');
  const [idUbicacion, setIdUbicacion] = useState('');
  const [nota, setNota] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setNombreAgencia('');
      setIdUbicacion('');
      setNota('');
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ubiRes, agRes] = await Promise.all([
        axios.get('/v1/catalog/ubicaciones?all=1'),
        axios.get('/v1/catalog/vehiculo-agencias'),
      ]);
      setUbicaciones(ubiRes.data.data || []);
      setAgencias(agRes.data.data || []);
    } catch (err) {
      console.error('Error cargando agencias/ubicaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreAgencia.trim() || !idUbicacion) {
      setErrorMessage('El nombre de la agencia y la ubicación son requeridos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await axios.post('/v1/catalog/vehiculo-agencias', {
        agencia: nombreAgencia.trim(),
        id_ubicacion: parseInt(idUbicacion, 10),
        nota: nota.trim() || null,
      });
      setNombreAgencia('');
      setIdUbicacion('');
      setNota('');
      fetchData();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Error guardando agencia:', err);
      setErrorMessage(err.response?.data?.message || 'Error al guardar la agencia de alquiler.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgencia = async (id, name) => {
    if (!window.confirm(`¿Está seguro de eliminar la agencia "${name}"?`)) return;
    try {
      await axios.delete(`/v1/catalog/vehiculo-agencias/${id}`);
      fetchData();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Error eliminando agencia:', err);
      alert(err.response?.data?.message || 'No se pudo eliminar la agencia.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Agencias de Alquiler"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Form to add agency */}
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#E87217', fontWeight: '600' }}>
            Registrar Nueva Agencia
          </h4>

          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              marginBottom: '12px',
            }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="erp-label">Nombre de Agencia <span className="req">*</span></label>
              <input
                type="text"
                className="erp-input"
                placeholder="Ej: Hertz Margarita"
                value={nombreAgencia}
                onChange={(e) => setNombreAgencia(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="erp-label">Ubicación <span className="req">*</span></label>
              <select
                className="erp-input"
                value={idUbicacion}
                onChange={(e) => setIdUbicacion(e.target.value)}
                required
                disabled={isSubmitting || loading}
                style={{ cursor: 'pointer', color: idUbicacion ? '#FFFFFF' : '#94A3B8' }}
              >
                <option value="" style={{ background: '#1e293b', color: '#94A3B8' }}>Seleccione ubicación...</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id} style={{ background: '#1e293b', color: '#FFFFFF' }}>
                    {u.ubicacion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="erp-label">Nota u Observación (Opcional)</label>
            <input
              type="text"
              className="erp-input"
              placeholder="Ej: Entrega en aeropuerto o terminal"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="submit" className="btn-form-nxt" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Agregar Agencia'}
            </button>
          </div>
        </form>

        {/* Existing agencies list */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', color: '#F8FAFC', fontWeight: '600' }}>
            Agencias Registradas ({agencias.length})
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Agencia</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Ubicación</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {agencias.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#94A3B8' }}>
                      No hay agencias registradas aún.
                    </td>
                  </tr>
                ) : (
                  agencias.map((ag) => (
                    <tr key={ag.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '8px 12px', color: '#F8FAFC', fontWeight: '500' }}>{ag.agencia}</td>
                      <td style={{ padding: '8px 12px', color: '#E87217' }}>{ag.nombre_ubicacion}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteAgencia(ag.id, ag.agencia)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" className="btn-form-cancel" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
