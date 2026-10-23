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
  maxDigits = 3,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const holdIntervalRef = useRef(null);
  const holdTimeoutRef = useRef(null);

  // Normalizar valor numérico
  const numericVal = value !== undefined && value !== null && value !== '' ? Number(value) : '';

  // Límite estricto de dígitos (por defecto 3 dígitos = 999)
  const maxDigitsLimit = Math.max(1, maxDigits);
  const maxPossibleValue = Math.pow(10, maxDigitsLimit) - 1;
  const effectiveMax = max !== undefined ? Math.min(max, maxPossibleValue) : maxPossibleValue;

  // Generar evento sintético compatible con onChange estándar
  const triggerChange = useCallback((newVal) => {
    if (disabled || readOnly) return;
    let clamped = newVal;
    if (clamped !== '') {
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
      };
      onChange(syntheticEvent);
    }
  }, [disabled, readOnly, min, effectiveMax, name, onChange]);

  // Manejar incremento y decremento
  const handleIncrement = useCallback(() => {
    const current = numericVal === '' ? (min !== undefined ? min : 0) : numericVal;
    const next = current + step;
    if (effectiveMax !== undefined && next > effectiveMax) return;
    triggerChange(next);
  }, [numericVal, min, effectiveMax, step, triggerChange]);

  const handleDecrement = useCallback(() => {
    const current = numericVal === '' ? (min !== undefined ? min : 0) : numericVal;
    const next = current - step;
    if (min !== undefined && next < min) return;
    triggerChange(next);
  }, [numericVal, min, step, triggerChange]);

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

  // Manejo de teclado (flechas arriba/abajo y bloqueo de más de maxDigits dígitos)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    } else if (
      /^\d$/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      const selStart = e.target.selectionStart;
      const selEnd = e.target.selectionEnd;
      const hasSelection = selStart !== null && selEnd !== null && selStart !== selEnd;
      const currentDigits = String(value ?? '').replace(/\D/g, '');
      if (!hasSelection && currentDigits.length >= maxDigitsLimit) {
        e.preventDefault();
      }
    }
  };

  const handleInputChange = (e) => {
    let rawVal = e.target.value;
    if (rawVal === '') {
      triggerChange('');
      return;
    }
    let digits = rawVal.replace(/\D/g, '');
    if (digits.length > maxDigitsLimit) {
      digits = digits.slice(0, maxDigitsLimit);
    }
    const parsed = parseInt(digits, 10);
    if (!isNaN(parsed)) {
      triggerChange(parsed);
    }
  };

  // Dimensiones según `size`
  const sizeStyles = {
    sm: {
      height: '32px',
      width: width || '54px',
      fontSize: '0.88rem',
      stepperWidth: '18px',
      borderRadius: '7px',
      padding: '0 2px',
    },
    md: {
      height: '38px',
      width: width || '75px',
      fontSize: '0.95rem',
      stepperWidth: '22px',
      borderRadius: '8px',
      padding: '0 6px',
    },
    lg: {
      height: '44px',
      width: width || '100px',
      fontSize: '1.05rem',
      stepperWidth: '26px',
      borderRadius: '10px',
      padding: '0 8px',
    },
  }[size] || {
    height: '36px',
    width: width || '65px',
    fontSize: '0.9rem',
    stepperWidth: '20px',
    borderRadius: '8px',
    padding: '0 4px',
  };

  const isMinReached = min !== undefined && numericVal !== '' && numericVal <= min;
  const isMaxReached = effectiveMax !== undefined && numericVal !== '' && numericVal >= effectiveMax;

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
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxDigitsLimit}
        value={value ?? ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
