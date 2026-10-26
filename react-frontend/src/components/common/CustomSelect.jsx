import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

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
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false);
  const [placement, setPlacement] = useState({
    openUp: false,
    maxHeight: 240,
  });
  const containerRef = useRef(null);

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

  // Dynamic positioning calculation for 20 points separation and upward flip
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollParent = containerRef.current.closest('main') || document.documentElement;
    const scrollParentRect = scrollParent && scrollParent.getBoundingClientRect ? scrollParent.getBoundingClientRect() : null;

    const viewportBottom = scrollParentRect
      ? Math.min(window.innerHeight, scrollParentRect.bottom)
      : window.innerHeight;
    const viewportTop = scrollParentRect
      ? Math.max(0, scrollParentRect.top)
      : 0;

    const spaceBelow = viewportBottom - rect.bottom;
    const spaceAbove = rect.top - viewportTop;
    const bottomSeparation = 20; // Exact 20 points separation from the bottom of the page

    // If space below is less than 200px and space above is greater, flip upwards
    const shouldOpenUp = spaceBelow < 200 && spaceAbove > spaceBelow;

    if (shouldOpenUp) {
      const maxH = Math.min(260, Math.max(120, spaceAbove - 20));
      setPlacement({
        openUp: true,
        maxHeight: maxH,
      });
    } else {
      const maxH = Math.min(260, Math.max(100, spaceBelow - bottomSeparation));
      setPlacement({
        openUp: false,
        maxHeight: maxH,
      });
    }
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update position on mount and when open or scroll/resize occurs
  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

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
    setIsTemporarilyClosed(true);
  };

  return (
    <div
      ref={containerRef}
      className={`select erp-custom-select ${isOpen ? 'open' : ''} ${placement.openUp ? 'open-up' : ''} ${isTemporarilyClosed ? 'temporarily-closed' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={style}
      onMouseEnter={updatePosition}
      onMouseLeave={() => setIsTemporarilyClosed(false)}
    >
      {name && <input type="hidden" name={name} value={normalizedValue} />}
      <div
        className="selected"
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setIsTemporarilyClosed(false);
            setIsOpen(prev => !prev);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            updatePosition();
            setIsTemporarilyClosed(false);
            setIsOpen(prev => !prev);
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

      <div
        className={`options ${placement.openUp ? 'open-up' : ''}`}
        style={{
          maxHeight: `${placement.maxHeight}px`,
          overflowX: 'hidden',
          ...(placement.openUp
            ? { top: 'auto', bottom: 'calc(100% + 4px)' }
            : { top: 'calc(100% + 4px)', bottom: 'auto' }),
        }}
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
      </div>
    </div>
  );
}
