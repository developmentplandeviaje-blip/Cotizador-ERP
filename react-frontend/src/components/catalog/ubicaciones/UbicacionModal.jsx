import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function UbicacionModal({ isOpen, onClose, onSaveSuccess, ubicacionToEdit = null }) {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (ubicacionToEdit) {
        setNombre(ubicacionToEdit.ubicacion || '');
      } else {
        setNombre('');
      }
    }
  }, [isOpen, ubicacionToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setErrorMessage('El nombre de la ubicación es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (ubicacionToEdit) {
        await axios.put(`/v1/catalog/ubicaciones/${ubicacionToEdit.id}`, {
          ubicacion: cleanNombre,
        });
      } else {
        await axios.post('/v1/catalog/ubicaciones', {
          ubicacion: cleanNombre,
        });
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error guardando ubicación:', err);
      if (err.response?.data?.errors?.ubicacion) {
        setErrorMessage(err.response.data.errors.ubicacion[0]);
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar la ubicación.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ubicacionToEdit ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
      width="480px"
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '18px',
          }}>
            {errorMessage}
          </div>
        )}

        <div style={{ marginBottom: '22px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#F8FAFC',
            marginBottom: '8px',
          }}>
            Nombre de la Ubicación <span style={{ color: '#E87217' }}>*</span>
          </label>
          <input
            type="text"
            className="input-search"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '0.9375rem',
              padding: '10px 14px',
            }}
            placeholder="Ej: Isla de Margarita, Los Roques, Canaima..."
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            autoFocus
            required
            maxLength={200}
            disabled={isSubmitting}
          />
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Identificador geográfico que se asignará a hoteles, traslados y paquetes.
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
          <button
            type="button"
            className="btn-form-prv"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-form-nxt"
            disabled={isSubmitting || !nombre.trim()}
          >
            {isSubmitting ? 'Guardando...' : (ubicacionToEdit ? 'Actualizar' : 'Crear Ubicación')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
