import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import CustomSelect from '../../common/CustomSelect';
import axios from 'axios';

export default function AerolineaModal({ isOpen, onClose, onSaveSuccess, aerolineaToEdit = null }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (aerolineaToEdit) {
        setNombre(aerolineaToEdit.nombre || '');
        setTipo(aerolineaToEdit.tipo || '');
      } else {
        setNombre('');
        setTipo('');
      }
    }
  }, [isOpen, aerolineaToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setErrorMessage('El nombre de la aerolínea es obligatorio.');
      return;
    }
    if (!tipo) {
      setErrorMessage('Debe seleccionar si la aerolínea es nacional o internacional.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (aerolineaToEdit) {
        await axios.put(`/v1/catalog/aerolineas/${aerolineaToEdit.id}`, {
          nombre: cleanNombre,
          tipo,
        });
      } else {
        await axios.post('/v1/catalog/aerolineas', {
          nombre: cleanNombre,
          tipo,
        });
      }
      onSaveSuccess();
    } catch (err) {
      console.error('Error guardando aerolínea:', err);
      if (err.response?.data?.errors?.nombre) {
        setErrorMessage(err.response.data.errors.nombre[0]);
      } else if (err.response?.data?.errors?.tipo) {
        setErrorMessage(err.response.data.errors.tipo[0]);
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar la aerolínea.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={aerolineaToEdit ? 'Editar Aerolínea' : 'Crear Nueva Aerolínea'}
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

        <div className="form-row">
          <label className="erp-label">
            Nombre de la Aerolínea <span className="req">*</span>
          </label>
          <input
            type="text"
            className="erp-input"
            placeholder="Ej: Laser Airlines, Rutaca, Conviasa..."
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value.slice(0, 80));
              if (errorMessage) setErrorMessage('');
            }}
            autoFocus
            required
            maxLength={80}
            disabled={isSubmitting}
          />
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#b9c8ddff', marginTop: '6px' }}>
            Línea aérea comercial que opera rutas de vuelos y conexiones en el sistema.
          </span>
        </div>

        <div className="form-row">
          <label className="erp-label">
            Tipo de Aerolínea <span className="req">*</span>
          </label>
          <CustomSelect
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={isSubmitting}
            required
            searchable={false}
          >
            <option value="">Seleccione el tipo...</option>
            <option value="nacional">Nacional</option>
            <option value="internacional">Internacional</option>
          </CustomSelect>
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
            disabled={isSubmitting || !nombre.trim() || !tipo}
          >
            {isSubmitting ? 'Guardando...' : (aerolineaToEdit ? 'Actualizar Aerolínea' : 'Crear Aerolínea')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
