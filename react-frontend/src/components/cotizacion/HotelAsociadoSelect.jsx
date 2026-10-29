import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

/**
 * Selector múltiple de hoteles asociados para un producto/servicio en la cotización.
 * Cuando un servicio tiene más de un hotel asociado, muestra "hoteles #n".
 * Renderizado con Portal (createPortal) a document.body para evitar que se recorte
 * por desbordamiento de tablas o contenedores scrollables (overflow-x: auto).
 */
export default function HotelAsociadoSelect({
  selectedHotelUids = [],
  registeredHotels = [],
  onChange,
  disabled = false,
  className = '',
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({
    openUp: false,
    top: 0,
    bottom: 0,
    left: 0,
    width: 220,
    maxHeight: 260,
  });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Normalizar UIDs seleccionados a un arreglo de strings
  const uids = useMemo(() => {
    if (Array.isArray(selectedHotelUids)) {
      return selectedHotelUids.filter(Boolean);
    }
    if (selectedHotelUids) {
      return [String(selectedHotelUids)];
    }
    return [];
  }, [selectedHotelUids]);

  const count = uids.length;

  // Título e indicador a mostrar en el botón
  const displayLabel = useMemo(() => {
    if (count === 0) return 'Sin Hotel';
    if (count === 1) {
      const single = registeredHotels.find(h => h.uid === uids[0]);
      return single ? single.titulo : '1 Hotel';
    }
    return `hoteles #${count}`;
  }, [count, registeredHotels, uids]);

  // Lista de nombres de hoteles asociados para tooltip
  const tooltipText = useMemo(() => {
    if (count === 0) return 'Sin hotel asociado';
    if (count === 1) {
      const single = registeredHotels.find(h => h.uid === uids[0]);
      return single ? `Hotel: ${single.titulo}` : '1 hotel';
    }
    const names = uids.map(id => {
      const h = registeredHotels.find(rh => rh.uid === id);
      return h ? h.titulo : id;
    });
    return `Asociado a ${count} hoteles: ${names.join(', ')}`;
  }, [count, registeredHotels, uids]);

  // Cálculo de posición fija en pantalla (Portal a document.body)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Si el elemento se desplazó fuera de la pantalla, cerramos el menú
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Desplegar hacia arriba si abajo queda poco espacio y arriba hay más
    const shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    const maxH = shouldOpenUp
      ? Math.min(280, Math.max(120, spaceAbove - 20))
      : Math.min(280, Math.max(120, spaceBelow - 20));

    const menuWidth = Math.max(rect.width, 220);
    let left = rect.left;
    if (left + menuWidth > viewportWidth - 10) {
      left = Math.max(10, viewportWidth - menuWidth - 10);
    }
    if (left < 10) left = 10;

    setCoords({
      openUp: shouldOpenUp,
      top: rect.bottom + 4,
      bottom: viewportHeight - rect.top + 4,
      left,
      width: menuWidth,
      maxHeight: maxH,
    });
  }, []);

  // Cerrar al hacer clic fuera del disparador y del menú
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) {
        return; // El clic en el botón disparador lo maneja toggleDropdown
      }
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return; // Clic dentro del menú desplegable interactuando con los checkboxes
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escuchar redimensionamiento y scroll en cualquier contenedor
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Alternar apertura/cierre al hacer clic
  const toggleDropdown = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleToggleHotel = (hotelUid, e) => {
    if (e) e.stopPropagation();
    if (!onChange) return;

    let nextUids;
    if (uids.includes(hotelUid)) {
      nextUids = uids.filter(id => id !== hotelUid);
    } else {
      nextUids = [...uids, hotelUid];
    }
    onChange(nextUids);
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    if (onChange) onChange([]);
  };

  const handleSelectAll = (e) => {
    if (e) e.stopPropagation();
    if (onChange) {
      const allUids = registeredHotels.map(h => h.uid);
      onChange(allUids);
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`select erp-custom-select ${isOpen ? 'open' : ''} ${coords.openUp ? 'open-up' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        ...style,
      }}
      title={tooltipText}
    >
      {/* Botón Disparador del Dropdown con la misma apariencia que CustomSelect (.selected) */}
      <div
        className="selected"
        onClick={toggleDropdown}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown(e);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className="selected-text" title={displayLabel}>
          {displayLabel}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 512 512"
          className="arrow"
        >
          <path
            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
          />
        </svg>
      </div>

      {/* Menú Desplegable con Checkboxes renderizado fuera de la tabla (Portal) */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className={`options ${coords.openUp ? 'open-up' : ''} portal-options`}
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            ...(coords.openUp
              ? { bottom: `${coords.bottom}px`, top: 'auto' }
              : { top: `${coords.top}px`, bottom: 'auto' }),
            background: '#101c44',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '6px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
            zIndex: 99999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con Acciones Rápidas */}
          <div
            style={{
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: count === 0 ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                border: 'none',
                color: count === 0 ? '#38BDF8' : '#94A3B8',
                fontSize: '0.72rem',
                fontWeight: count === 0 ? '700' : '500',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: '4px',
                transition: 'all 0.15s ease',
              }}
              title="Desasociar este servicio de todos los hoteles"
            >
              Sin Hotel
            </button>

            {registeredHotels.length > 1 && (
              <button
                type="button"
                onClick={count === registeredHotels.length ? handleClearAll : handleSelectAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#60A5FA',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '4px',
                }}
              >
                {count === registeredHotels.length ? 'Deseleccionar todos' : 'Todos'}
              </button>
            )}
          </div>

          {/* Lista de Hoteles con Selección Múltiple */}
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: `${coords.maxHeight}px`,
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {registeredHotels.map(h => {
              const isChecked = uids.includes(h.uid);
              return (
                <div
                  key={h.uid}
                  onClick={(e) => handleToggleHotel(h.uid, e)}
                  className={`option ${isChecked ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: isChecked ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                    borderLeft: isChecked ? '3px solid #2563EB' : '3px solid transparent',
                    color: isChecked ? '#38BDF8' : '#F1F5F9',
                    fontSize: '0.85rem',
                    fontWeight: isChecked ? '600' : '400',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.background = 'rgba(37, 99, 235, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ display: 'none' }}
                  />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.titulo}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer Informativo y Botón Listo */}
          <div
            style={{
              padding: '5px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: '#94A3B8',
            }}
          >
            <span>
              {count === 0 ? 'Sin hotel' : count === 1 ? '1 seleccionado' : `${count} seleccionados`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#2563EB',
                border: 'none',
                color: '#FFF',
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Listo
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
