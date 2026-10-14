import React from 'react';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';

export default function VaciarProductosModal({
  isOpen,
  onClose,
  onConfirm,
  totalItems = 0,
}) {
  if (!isOpen) return null;

  return (
    <DeleteConfirmationModal
      isOpen={isOpen}
      title="Vaciar Itinerario de Productos"
      subtitle="¿Está seguro de que desea vaciar todos los productos agregados a esta cotización?"
      content={
        <div style={{ color: '#E2E8F0', fontSize: '0.875rem' }}>
          <p style={{ margin: '4px 0' }}>
            Se eliminarán los <strong>{totalItems}</strong> producto(s) agregados al resumen del itinerario. Esta acción no se puede deshacer.
          </p>
        </div>
      }
      confirmText="Sí, Vaciar Todo"
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
}
