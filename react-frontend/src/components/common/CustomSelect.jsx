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
}) {
  const [isOpen, setIsOpen] = useState(false);
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
    const width = rect.width;

    if (left + width > viewportWidth - 10) {
      left = Math.max(10, viewportWidth - width - 10);
    }
    if (left < 10) left = 10;

    setCoords({
      openUp: shouldOpenUp,
      top: rect.bottom + 4,
      bottom: viewportHeight - rect.top + 4,
      left,
      width,
      maxHeight: maxH,
    });
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return; // Click inside trigger button is handled by toggleOpen
      }
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return; // Click inside dropdown options
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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

  const toggleOpen = (e) => {
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
  };

  return (
    <div
      ref={containerRef}
      className={`select erp-custom-select ${isOpen ? 'open' : ''} ${coords.openUp ? 'open-up' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={style}
    >
      {name && <input type="hidden" name={name} value={normalizedValue} />}
      <div
        className="selected"
        onClick={toggleOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen(e);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className="selected-text" title={currentLabel}>{currentLabel}</span>
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
            maxHeight: `${coords.maxHeight}px`,
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 99999,
            opacity: 1,
            visibility: 'visible',
            transform: 'none',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {parsedOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(normalizedValue);
            return (
              <div
                key={`${opt.value}-${idx}`}
                title={opt.label}
                className={`option ${isSelected ? 'active' : ''} ${opt.disabled ? 'disabled' : ''}`}
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
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
