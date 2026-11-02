import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function CustomSelect({
  value,
  onChange,
  name,
  options,
  children,
  placeholder = '',
  className = '',
  style = {},
  disabled = false,
  required = false,
  searchable,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState({
    openUp: false,
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Parse options from either `options` prop or JSX `<option>` children
  const parsedOptions = useMemo(() => {
    if (options && Array.isArray(options) && options.length > 0) {
      return options.map(opt =>
        typeof opt === 'object' ? opt : { value: opt, label: String(opt) }
      );
    }

    const list = [];
    const extractOptions = (node) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(extractOptions);
        return;
      }
      if (node.type === 'option') {
        let label = node.props.children;
        if (Array.isArray(label)) {
          label = label.map(item => (typeof item === 'object' ? '' : String(item))).join('');
        } else if (typeof label !== 'string' && typeof label !== 'number') {
          label = String(node.props.value ?? '');
        }
        list.push({
          value: node.props.value ?? '',
          label: String(label ?? (node.props.value !== undefined ? node.props.value : '')),
          disabled: !!node.props.disabled,
        });
      } else if (node.props && node.props.children) {
        extractOptions(node.props.children);
      }
    };

    extractOptions(children);
    return list;
  }, [options, children]);

  // Determine whether to use searchable mode or normal select mode
  const isSearchable = useMemo(() => {
    if (searchable !== undefined) return Boolean(searchable);
    // Only disable if explicitly a small pixel width (< 120px, like '75px' or '80px')
    if (
      style &&
      style.width &&
      typeof style.width === 'string' &&
      style.width.endsWith('px') &&
      parseInt(style.width) < 120
    ) {
      return false;
    }
    // Default to true for all form and modal selects
    return true;
  }, [searchable, style]);

  const normalizedValue = value === undefined || value === null ? '' : value;

  // Find currently selected option
  const currentOption = useMemo(() => {
    return parsedOptions.find(opt => String(opt.value) === String(normalizedValue));
  }, [parsedOptions, normalizedValue]);

  const currentLabel = useMemo(() => {
    if (currentOption) return currentOption.label;
    const defaultOpt = parsedOptions.find(opt => opt.value === '' || opt.value === null);
    if (defaultOpt) return defaultOpt.label;
    if (placeholder) return placeholder;
    return parsedOptions[0]?.label || 'Seleccione...';
  }, [currentOption, parsedOptions, placeholder]);

  // Filter options when searching
  const visibleOptions = useMemo(() => {
    if (!isSearchable || !isSearching || !searchTerm.trim()) {
      return parsedOptions;
    }
    const cleanSearch = searchTerm.toLowerCase().trim();
    return parsedOptions.filter(opt => {
      // Hide empty/blank options when actively filtering, unless label matches
      if (opt.value === '' && !String(opt.label).toLowerCase().includes(cleanSearch)) {
        return false;
      }
      return String(opt.label).toLowerCase().includes(cleanSearch);
    });
  }, [parsedOptions, isSearchable, isSearching, searchTerm]);

  // Dynamic positioning calculation for portal placement
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    if (rect.bottom < 0 || rect.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenUp = spaceBelow < 200 && spaceAbove > spaceBelow;

    const maxH = shouldOpenUp
      ? Math.min(280, Math.max(100, spaceAbove - 20))
      : Math.min(280, Math.max(100, spaceBelow - 20));

    let left = rect.left;
    const width = Math.max(rect.width, isSearchable ? rect.width : Math.min(rect.width, 180));

    if (left + width > viewportWidth - 10) {
      left = Math.max(10, viewportWidth - width - 10);
    }
    if (left < 10) left = 10;

    setCoords({
      openUp: shouldOpenUp,
      top: rect.bottom + 4,
      bottom: viewportHeight - rect.top + 4,
      left,
      width: isSearchable ? rect.width : Math.max(rect.width, 140),
      maxHeight: maxH,
    });
  }, [isSearchable]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      setIsOpen(false);
      setIsSearching(false);
      setIsFocused(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update position on scroll/resize while open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Scroll active option into view when opened without search
  useEffect(() => {
    if (isOpen && !isSearching && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('.option.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, isSearching]);

  // Select an option
  const handleSelect = (optValue) => {
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          value: optValue,
          name: name || '',
        },
      });
    }
    setIsOpen(false);
    setIsSearching(false);
    setIsFocused(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Toggle chevron ( > ): desplegar / recoger opciones
  const handleToggleArrow = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;

    if (isOpen) {
      // Recoger
      setIsOpen(false);
      setIsSearching(false);
      setIsFocused(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else {
      // Desplegar lista completa de opciones
      setIsSearching(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      setIsFocused(false);
      updatePosition();
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Box click: if closed, deploy options and focus input for typing
  const handleBoxClick = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Toggle for normal select mode
  const handleToggleNormal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Search input focus: start search mode
  const handleInputFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Search input change: filter options in real time
  const handleInputChange = (e) => {
    if (disabled) return;
    const val = e.target.value;
    setSearchTerm(val);
    setIsSearching(true);
    setHighlightedIndex(-1);
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Keyboard navigation for search input
  const handleInputKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        updatePosition();
        setIsOpen(true);
        return;
      }
      const list = isSearchable ? visibleOptions : parsedOptions;
      setHighlightedIndex(prev => {
        const next = prev < list.length - 1 ? prev + 1 : 0;
        setTimeout(() => {
          const el = dropdownRef.current?.querySelector(`[data-index="${next}"]`);
          el?.scrollIntoView({ block: 'nearest' });
        }, 10);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        updatePosition();
        setIsOpen(true);
        return;
      }
      const list = isSearchable ? visibleOptions : parsedOptions;
      setHighlightedIndex(prev => {
        const next = prev > 0 ? prev - 1 : list.length - 1;
        setTimeout(() => {
          const el = dropdownRef.current?.querySelector(`[data-index="${next}"]`);
          el?.scrollIntoView({ block: 'nearest' });
        }, 10);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const list = isSearchable ? visibleOptions : parsedOptions;
      if (isOpen) {
        if (highlightedIndex >= 0 && highlightedIndex < list.length) {
          const opt = list[highlightedIndex];
          if (!opt.disabled) {
            handleSelect(opt.value);
          }
        } else if (list.length === 1 && !list[0].disabled) {
          handleSelect(list[0].value);
        }
      } else {
        updatePosition();
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsSearching(false);
      setIsFocused(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const currentOptionsList = isSearchable ? visibleOptions : parsedOptions;

  return (
    <div
      ref={containerRef}
      className={`select erp-custom-select ${isOpen ? 'open' : ''} ${coords.openUp ? 'open-up' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={style}
    >
      {name && <input type="hidden" name={name} value={normalizedValue} />}

      {isSearchable ? (
        /* Modo Buscador Unificado: única caja con input de búsqueda y flecha desplegable */
        <div
          className={`selected custom-select-search-box ${isOpen ? 'open' : ''} ${isFocused || isSearching ? 'searching' : ''}`}
          onClick={handleBoxClick}
        >
          <input
            ref={inputRef}
            type="text"
            className="custom-select-search-input"
            value={isFocused || isSearching ? searchTerm : currentLabel}
            placeholder={isFocused ? (currentLabel || placeholder || 'Buscar...') : (placeholder || 'Seleccione...')}
            disabled={disabled}
            onFocus={handleInputFocus}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            title={!isFocused ? currentLabel : undefined}
            autoComplete="off"
            spellCheck="false"
          />
          <div
            className="custom-select-arrow"
            onClick={handleToggleArrow}
            title={isOpen ? 'Recoger opciones' : 'Desplegar opciones'}
            role="button"
            tabIndex={-1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`custom-select-chevron ${isOpen ? 'open' : ''}`}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      ) : (
        /* Modo Select Normal (caja simple estándar) */
        <div
          className="selected"
          onClick={handleToggleNormal}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleNormal(e);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <span className="selected-text" title={currentLabel}>{currentLabel}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`arrow ${isOpen ? 'open' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      )}

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
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
            zIndex: 999999,
            maxHeight: `${coords.maxHeight}px`,
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {currentOptionsList.length > 0 ? (
            currentOptionsList.map((opt, idx) => {
              const isSelected = String(opt.value) === String(normalizedValue);
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={`${opt.value}-${idx}`}
                  data-index={idx}
                  title={opt.label}
                  className={`option ${isSelected ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''} ${opt.disabled ? 'disabled' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!opt.disabled) {
                      handleSelect(opt.value);
                    }
                  }}
                >
                  {opt.label}
                </div>
              );
            })
          ) : (
            <div className="custom-select-empty-msg">
              No se encontraron opciones
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
