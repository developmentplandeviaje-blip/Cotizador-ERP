import React from 'react';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';

export default function EliminarProductoModal({
  isOpen,
  item,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !item) return null;

  return (
    <DeleteConfirmationModal
      isOpen={isOpen}
      title="Confirmar Eliminación de Producto"
      subtitle="¿Está seguro de que desea eliminar este producto de la cotización?"
      content={
        <div style={{ color: '#E2E8F0', fontSize: '0.875rem' }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Tipo:</strong>{' '}
            <span style={{ textTransform: 'capitalize', color: '#E87217' }}>{item.tipo}</span>
          </p>
          <p style={{ margin: '4px 0' }}><strong>Producto:</strong> {item.titulo}</p>
          <p style={{ margin: '4px 0' }}><strong>Detalle:</strong> {item.detalle}</p>
          <p style={{ margin: '4px 0' }}><strong>Monto:</strong> ${Number(item.precio || 0).toFixed(2)} USD</p>
        </div>
      }
      confirmText="Sí, Eliminar"
      onCancel={onClose}
      onConfirm={() => onConfirm(item.uid)}
    />
  );
}
