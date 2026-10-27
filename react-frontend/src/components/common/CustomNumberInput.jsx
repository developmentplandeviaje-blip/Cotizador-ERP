import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * CustomNumberInput - Input numérico estilizado con flechas personalizadas de subida y bajada.
 * Diseñado específicamente para el sistema ERP en modo oscuro, con acentos en naranja (#E87217)
 * y soporte para pulsación continua (hold), teclado y límites min/max.
 */
export default function CustomNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  name = '',
  disabled = false,
  readOnly = false,
  placeholder = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  align = 'center', // 'center' | 'left' | 'right'
  style = {},
  inputStyle = {},
  className = '',
  id,
  width,
  maxDigits,
  allowDecimals = false,
  decimals = 2,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => (value !== undefined && value !== null && value !== '' ? String(value) : ''));
  const holdIntervalRef = useRef(null);
  const holdTimeoutRef = useRef(null);

  const isDecimal = allowDecimals || (step > 0 && step < 1);
  const maxDigitsLimit = maxDigits !== undefined ? Math.max(1, maxDigits) : (isDecimal ? 5 : 3);
  const maxPossibleValue = isDecimal
    ? Math.pow(10, maxDigitsLimit) - (1 / Math.pow(10, decimals))
    : Math.pow(10, maxDigitsLimit) - 1;
  const effectiveMax = max !== undefined ? Math.min(max, maxPossibleValue) : maxPossibleValue;
  const precision = isDecimal ? decimals : 0;

  // Sincronizar displayValue con value cuando el input no tiene el foco
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value !== undefined && value !== null && value !== '' ? String(value) : '');
    }
  }, [value, isFocused]);

  // Obtener valor numérico actual para cálculo de steppers y límites
  const getNumericValue = useCallback(() => {
    if (isFocused && displayValue !== '') {
      const parsed = parseFloat(displayValue);
      return !isNaN(parsed) ? parsed : '';
    }
    return value !== undefined && value !== null && value !== '' ? Number(value) : '';
  }, [isFocused, displayValue, value]);

  // Generar evento sintético compatible con onChange estándar
  const triggerChange = useCallback((newVal) => {
    if (disabled || readOnly) return;
    let clamped = newVal;
    if (clamped !== '' && typeof clamped === 'number') {
      if (min !== undefined && clamped < min) clamped = min;
      if (effectiveMax !== undefined && clamped > effectiveMax) clamped = effectiveMax;
    }

    if (onChange) {
      const syntheticEvent = {
        target: {
          name,
          value: clamped,
          type: 'number',
        },
        currentTarget: {
          name,
          value: clamped,
          type: 'number',
        },
        valueOf: () => clamped,
        toString: () => String(clamped),
      };
      onChange(syntheticEvent, clamped);
    }
  }, [disabled, readOnly, min, effectiveMax, name, onChange]);

  // Manejar incremento y decremento
  const handleIncrement = useCallback(() => {
    const current = getNumericValue();
    const base = current === '' || isNaN(current) ? (min !== undefined ? min : 0) : current;
    let next = base + step;
    if (isDecimal) {
      next = Number(next.toFixed(precision));
    }
    if (effectiveMax !== undefined && next > effectiveMax) return;
    setDisplayValue(String(next));
    triggerChange(next);
  }, [getNumericValue, min, effectiveMax, step, isDecimal, precision, triggerChange]);

  const handleDecrement = useCallback(() => {
    const current = getNumericValue();
    const base = current === '' || isNaN(current) ? (min !== undefined ? min : 0) : current;
    let next = base - step;
    if (isDecimal) {
      next = Number(next.toFixed(precision));
    }
    if (min !== undefined && next < min) return;
    setDisplayValue(String(next));
    triggerChange(next);
  }, [getNumericValue, min, step, isDecimal, precision, triggerChange]);

  // Soporte de mantener pulsado (hold to increment/decrement)
  const startHold = (action) => {
    if (disabled || readOnly) return;
    action();
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        action();
      }, 70);
    }, 300);
  };

  const stopHold = () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  };

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // Manejo de teclado (flechas arriba/abajo y control de caracteres)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    } else if (e.key === '.' || e.key === ',') {
      if (!isDecimal) {
        e.preventDefault();
        return;
      }
      const currentValStr = String(displayValue ?? '');
      const selStart = e.target.selectionStart;
      const selEnd = e.target.selectionEnd;
      const hasSelection = selStart !== null && selEnd !== null && selStart !== selEnd;
      const selectedText = hasSelection ? currentValStr.substring(selStart, selEnd) : '';

      // Si ya contiene punto y no está seleccionando el punto para sobrescribirlo, prevenir
      if (currentValStr.includes('.') && !selectedText.includes('.')) {
        e.preventDefault();
      }
    } else if (
      /^\d$/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      const selStart = e.target.selectionStart;
      const selEnd = e.target.selectionEnd;
      const hasSelection = selStart !== null && selEnd !== null && selStart !== selEnd;
      if (!hasSelection) {
        const currentStr = String(displayValue ?? '');
        if (isDecimal) {
          const dotIndex = currentStr.indexOf('.');
          if (dotIndex === -1) {
            if (currentStr.length >= maxDigitsLimit) {
              e.preventDefault();
            }
          } else {
            const isBeforeDot = selStart !== null && selStart <= dotIndex;
            const parts = currentStr.split('.');
            const intPart = parts[0] || '';
            const decPart = parts[1] || '';
            if (isBeforeDot && intPart.length >= maxDigitsLimit) {
              e.preventDefault();
            } else if (!isBeforeDot && decPart.length >= decimals) {
              e.preventDefault();
            }
          }
        } else {
          const currentDigits = currentStr.replace(/\D/g, '');
          if (currentDigits.length >= maxDigitsLimit) {
            e.preventDefault();
          }
        }
      }
    }
  };

  const handleInputChange = (e) => {
    let rawVal = e.target.value;
    if (rawVal === '') {
      setDisplayValue('');
      triggerChange('');
      return;
    }

    if (isDecimal) {
      rawVal = rawVal.replace(/,/g, '.');
      if (rawVal.startsWith('.')) {
        rawVal = '0' + rawVal;
      }

      const parts = rawVal.split('.');
      let intPart = (parts[0] || '').replace(/\D/g, '');
      if (intPart.length > maxDigitsLimit) {
        intPart = intPart.slice(0, maxDigitsLimit);
      }

      if (parts.length > 1) {
        let decPart = parts.slice(1).join('').replace(/\D/g, '').slice(0, decimals);
        const formatted = (rawVal.endsWith('.') && decPart.length === 0)
          ? `${intPart}.`
          : `${intPart}.${decPart}`;
        setDisplayValue(formatted);
        triggerChange(formatted);
      } else {
        setDisplayValue(intPart);
        triggerChange(intPart);
      }
    } else {
      let digits = rawVal.replace(/\D/g, '');
      if (digits.length > maxDigitsLimit) {
        digits = digits.slice(0, maxDigitsLimit);
      }
      setDisplayValue(digits);
      const parsed = digits !== '' ? parseInt(digits, 10) : '';
      triggerChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let trimmed = String(displayValue || '').trim();
    if (trimmed === '' || trimmed === '.') {
      setDisplayValue('');
      triggerChange('');
      return;
    }

    if (trimmed.endsWith('.')) {
      trimmed = trimmed.slice(0, -1);
    }

    let num = parseFloat(trimmed);
    if (isNaN(num)) {
      setDisplayValue('');
      triggerChange('');
      return;
    }

    if (min !== undefined && num < min) num = min;
    if (effectiveMax !== undefined && num > effectiveMax) num = effectiveMax;

    if (isDecimal) {
      num = Number(num.toFixed(precision));
    } else {
      num = Math.round(num);
    }
    setDisplayValue(String(num));
    triggerChange(num);
  };

  const currentNumeric = getNumericValue();
  const isMinReached = min !== undefined && currentNumeric !== '' && !isNaN(currentNumeric) && currentNumeric <= min;
  const isMaxReached = effectiveMax !== undefined && currentNumeric !== '' && !isNaN(currentNumeric) && currentNumeric >= effectiveMax;

  const defaultWidth = isDecimal
    ? (size === 'sm' ? '85px' : size === 'lg' ? '125px' : '105px')
    : (size === 'sm' ? '54px' : size === 'lg' ? '100px' : '75px');

  // Dimensiones según `size`
  const sizeStyles = {
    sm: {
      height: '32px',
      width: width || defaultWidth,
      fontSize: '0.88rem',
      stepperWidth: '18px',
      borderRadius: '7px',
      padding: '0 2px',
    },
    md: {
      height: '38px',
      width: width || defaultWidth,
      fontSize: '0.95rem',
      stepperWidth: '22px',
      borderRadius: '8px',
      padding: '0 6px',
    },
    lg: {
      height: '44px',
      width: width || defaultWidth,
      fontSize: '1.05rem',
      stepperWidth: '26px',
      borderRadius: '10px',
      padding: '0 8px',
    },
  }[size] || {
    height: '36px',
    width: width || defaultWidth,
    fontSize: '0.9rem',
    stepperWidth: '20px',
    borderRadius: '8px',
    padding: '0 4px',
  };

  return (
    <div
      className={`custom-number-input-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        stopHold();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        width: style.width || width || sizeStyles.width,
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
        background: isFocused
          ? 'rgba(16, 28, 68, 0.85)'
          : isHovered
            ? 'rgba(20, 35, 80, 0.75)'
            : 'rgba(16, 28, 68, 0.55)',
        border: isFocused
          ? '1px solid #E87217'
          : isHovered
            ? '1px solid rgba(232, 114, 23, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: sizeStyles.borderRadius,
        height: sizeStyles.height,
        boxShadow: isFocused
          ? '0 0 0 2px rgba(232, 114, 23, 0.25), 0 2px 8px rgba(0, 0, 0, 0.25)'
          : '0 2px 5px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {/* Campo numérico interno (sin spinner nativo feo) */}
      <input
        id={id}
        name={name}
        type="text"
        inputMode={isDecimal ? "decimal" : "numeric"}
        pattern={isDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
        maxLength={isDecimal ? maxDigitsLimit + decimals + 1 : maxDigitsLimit}
        value={isFocused ? displayValue : (value !== undefined && value !== null && value !== '' ? String(value) : '')}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          setDisplayValue(value !== undefined && value !== null && value !== '' ? String(value) : '');
        }}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: sizeStyles.fontSize,
          textAlign: align,
          width: '0',
          minWidth: 0,
          flex: '1 1 auto',
          padding: sizeStyles.padding,
          cursor: disabled ? 'not-allowed' : 'text',
          boxSizing: 'border-box',
          ...inputStyle,
        }}
      />

      {/* Flechas personalizadas de subida y bajada */}
      {!disabled && !readOnly && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: sizeStyles.stepperWidth,
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.03)',
            flexShrink: 0,
          }}
        >
          {/* Flecha Subida (▲) */}
          <button
            type="button"
            tabIndex="-1"
            title="Aumentar"
            disabled={isMaxReached}
            onMouseDown={(e) => {
              e.preventDefault();
              startHold(handleIncrement);
            }}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 0,
              cursor: isMaxReached ? 'not-allowed' : 'pointer',
              color: isMaxReached ? 'rgba(255, 255, 255, 0.2)' : '#94A3B8',
              flex: 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isMaxReached) {
                e.currentTarget.style.color = '#E87217';
                e.currentTarget.style.background = 'rgba(232, 114, 23, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMaxReached) {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          {/* Flecha Bajada (▼) */}
          <button
            type="button"
            tabIndex="-1"
            title="Disminuir"
            disabled={isMinReached}
            onMouseDown={(e) => {
              e.preventDefault();
              startHold(handleDecrement);
            }}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: isMinReached ? 'not-allowed' : 'pointer',
              color: isMinReached ? 'rgba(255, 255, 255, 0.2)' : '#94A3B8',
              flex: 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isMinReached) {
                e.currentTarget.style.color = '#E87217';
                e.currentTarget.style.background = 'rgba(232, 114, 23, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMinReached) {
                e.currentTarget.style.color = '#94A3B8';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
