import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import { PRODUCT_COLOR_MAP } from '../cotizacionConstants';

export default function AgruparProductosHotelModal({
  isOpen,
  onClose,
  hotelItem,
  allItems = [],
  onSaveGroup,
}) {
  const [selectedUids, setSelectedUids] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar productos no-hotel disponibles para agrupar
  const nonHotelItems = useMemo(() => {
    return allItems.filter(item => item.tipo !== 'hotel');
  }, [allItems]);

  // Inicializar items seleccionados que ya pertenecen a este hotel
  useEffect(() => {
    if (isOpen && hotelItem) {
      const initialSelected = nonHotelItems
        .filter(item => {
          if (Array.isArray(item.hotel_item_uids)) {
            return item.hotel_item_uids.includes(hotelItem.uid);
          }
          return item.hotel_item_uid === hotelItem.uid;
        })
        .map(item => item.uid);
      setSelectedUids(initialSelected);
      setSearchTerm('');
    }
  }, [isOpen, hotelItem, nonHotelItems]);

  if (!isOpen || !hotelItem) return null;

  // Filtrado por búsqueda
  const filteredItems = nonHotelItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const titulo = (item.titulo || '').toLowerCase();
    const tipo = (item.tipo || '').toLowerCase();
    const detalle = (item.detalle || '').toLowerCase();
    return titulo.includes(term) || tipo.includes(term) || detalle.includes(term);
  });

  const handleToggleItem = (uid) => {
    setSelectedUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAll = () => {
    setSelectedUids(filteredItems.map(i => i.uid));
  };

  const handleDeselectAll = () => {
    setSelectedUids([]);
  };

  const handleSave = () => {
    if (onSaveGroup) {
      onSaveGroup(hotelItem.uid, selectedUids);
    }
    onClose();
  };

  // Calcular totales
  const selectedItemsData = nonHotelItems.filter(i => selectedUids.includes(i.uid));
  const subtotalServicios = selectedItemsData.reduce((sum, i) => sum + (Number(i.precio) || 0), 0);
  const totalConHotel = Number(hotelItem.precio || 0) + subtotalServicios;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agrupar Productos al Hotel Registrado"
      width="680px"
      zIndex={10000}
    >
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Banner del Hotel Objetivo */}
        <div style={{
          background: 'rgba(232, 114, 23, 0.)',
          border: '1px solid rgba(232, 114, 23, 0.4)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '1.05rem' }}>{hotelItem.titulo}</strong>
            </div>
            <div style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>
              {hotelItem.detalle}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Tarifa Hotel</span>
            <strong style={{ color: '#E87217', fontSize: '1.15rem' }}>
              ${Number(hotelItem.precio || 0).toFixed(2)} USD
            </strong>
          </div>
        </div>

        {/* Instrucción y búsqueda */}
        <div>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
            Marque los productos y servicios (vuelos, traslados, tours, etc.) que desea asociar y agrupar bajo este hotel en la cotización:
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar servicio por nombre o tipo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="erp-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                background: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                color: '#60A5FA',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Seleccionar Todos
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94A3B8',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Lista de productos para asociar */}
        <div
          className="custom-scrollbar"
          style={{
            maxHeight: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px',
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#94A3B8',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              fontSize: '0.875rem',
            }}>
              {nonHotelItems.length === 0
                ? 'No hay otros productos o servicios registrados en esta cotización para agrupar.'
                : 'No se encontraron servicios que coincidan con la búsqueda.'}
            </div>
          ) : (
            filteredItems.map(item => {
              const isChecked = selectedUids.includes(item.uid);
              const itemHotels = Array.isArray(item.hotel_item_uids)
                ? item.hotel_item_uids
                : (item.hotel_item_uid ? [item.hotel_item_uid] : []);
              const otherHotels = itemHotels.filter(id => id !== hotelItem.uid);
              const otherHotelNames = otherHotels.map(id => allItems.find(h => h.uid === id)?.titulo || 'Otro hotel');

              return (
                <label
                  key={item.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isChecked
                      ? 'rgba(37, 99, 235, 0.2)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isChecked
                      ? '1px solid #2563EB'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.uid)}
                      style={{ display: 'none' }}
                    />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          color: PRODUCT_COLOR_MAP[item.tipo]?.color || '#E87217',
                        }}>
                          [{item.tipo}]
                        </span>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{item.titulo}</strong>
                        {otherHotels.length > 0 && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#F59E0B',
                            background: 'rgba(245, 158, 11, 0.15)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}>
                            {otherHotels.length === 1
                              ? `También en: ${otherHotelNames[0]}`
                              : `También en ${otherHotels.length} hoteles`}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.detalle}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ color: '#F8FAFC', fontWeight: '700', fontSize: '0.92rem' }}>
                      ${Number(item.precio || 0).toFixed(2)}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Resumen de totales */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(16, 28, 68, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '10px',
          fontSize: '0.85rem',
        }}>
          <div>
            <span style={{ color: '#94A3B8' }}>Productos seleccionados: </span>
            <strong style={{ color: '#FFFFFF' }}>{selectedUids.length}</strong>
            <span style={{ color: '#94A3B8', marginLeft: '8px' }}>
              (Servicios: ${subtotalServicios.toFixed(2)})
            </span>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Subtotal Hotel + Servicios: </span>
            <strong style={{ color: '#10B981', fontSize: '1.05rem', marginLeft: '6px' }}>
              ${totalConHotel.toFixed(2)} USD
            </strong>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px' }}>
          <button
            type="button"
            className="btn-form-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-form-nxt"
            onClick={handleSave}
            disabled={filteredItems.length === 0 && selectedUids.length === 0}
            style={{ padding: '8px 20px' }}
          >
            Guardar Agrupación ({selectedUids.length})
          </button>
        </div>
      </div>
    </Modal>
  );
}
