import React, { useState, useRef, useEffect, useMemo } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Do'];

export default function CustomDatePicker({
  value = '',
  onChange,
  type = 'date', // 'date' | 'datetime-local'
  showTime, // if undefined, inferred from type === 'datetime-local'
  placeholder,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  style = {},
  min,
  max,
}) {
  const isDateTime = showTime !== undefined ? showTime : type === 'datetime-local';
  const defaultPlaceholder = isDateTime ? 'DD/MM/AAAA --:--' : 'DD/MM/AAAA';

  const [isOpen, setIsOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const containerRef = useRef(null);
  const monthDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  // Parse current value into year, month (0-11), day (1-31), hour (0-23), minute (0-59)
  const parsedValue = useMemo(() => {
    if (!value) return null;
    try {
      // Handles 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm', 'YYYY-MM-DD HH:mm'
      const cleanVal = String(value).trim();
      const parts = cleanVal.split(/[T ]/);
      const dateParts = parts[0].split('-').map(Number);
      if (dateParts.length !== 3 || dateParts.some(isNaN)) return null;

      const [y, m, d] = dateParts;
      let hh = 12;
      let mm = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':').map(Number);
        if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
          hh = timeParts[0];
          mm = timeParts[1];
        }
      }
      return { year: y, month: m - 1, day: d, hour: hh, minute: mm };
    } catch {
      return null;
    }
  }, [value]);

  // View state for navigating calendar months
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => parsedValue ? parsedValue.year : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedValue ? parsedValue.month : today.getMonth());

  // Time state (12-hour format: hour 1-12, minute 0-59, period 'AM'|'PM')
  const [timeState, setTimeState] = useState(() => {
    if (parsedValue) {
      const h24 = parsedValue.hour;
      const period = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      return {
        hour: String(h12).padStart(2, '0'),
        minute: String(parsedValue.minute).padStart(2, '0'),
        period,
      };
    }
    return { hour: '12', minute: '00', period: 'AM' };
  });

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      const h24 = parsedValue.hour;
      const period = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      setTimeState({
        hour: String(h12).padStart(2, '0'),
        minute: String(parsedValue.minute).padStart(2, '0'),
        period,
      });
    }
  }, [parsedValue]);

  // Close calendar or sub-dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowMonthDropdown(false);
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format value for emission to parent
  const emitChange = (newYear, newMonth, newDay, newTimeState = timeState) => {
    const yStr = String(newYear).padStart(4, '0');
    const mStr = String(newMonth + 1).padStart(2, '0');
    const dStr = String(newDay).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    let finalValue = dateStr;
    if (isDateTime) {
      let h24 = parseInt(newTimeState.hour, 10) || 12;
      if (newTimeState.period === 'PM' && h24 < 12) h24 += 12;
      if (newTimeState.period === 'AM' && h24 === 12) h24 = 0;
      const hhStr = String(h24).padStart(2, '0');
      const mmStr = String(newTimeState.minute).padStart(2, '0');
      finalValue = `${dateStr}T${hhStr}:${mmStr}`;
    }

    if (onChange) {
      onChange({
        target: {
          value: finalValue,
          name: name || '',
          id: id || '',
        },
      });
    }
  };

  // Select a day
  const handleSelectDay = (dayObj) => {
    if (dayObj.isPrevMonth) {
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      setViewMonth(prevM);
      setViewYear(prevY);
      emitChange(prevY, prevM, dayObj.day);
    } else if (dayObj.isNextMonth) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      setViewMonth(nextM);
      setViewYear(nextY);
      emitChange(nextY, nextM, dayObj.day);
    } else {
      emitChange(viewYear, viewMonth, dayObj.day);
    }

    if (!isDateTime) {
      // Date only: close immediately upon selection
      setIsOpen(false);
    }
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setShowMonthDropdown(false);
    setShowYearDropdown(false);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setShowMonthDropdown(false);
    setShowYearDropdown(false);
  };

  // Time change handlers
  const handleHourChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    let num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num > 12) num = 12;
      if (num < 1 && val.length === 2) num = 1;
    }
    const newH = isNaN(num) ? '' : String(num).padStart(val.length >= 2 ? 2 : 1, '0');
    const updatedTime = { ...timeState, hour: newH };
    setTimeState(updatedTime);
    if (parsedValue && newH) {
      emitChange(parsedValue.year, parsedValue.month, parsedValue.day, updatedTime);
    }
  };

  const handleHourBlur = () => {
    let num = parseInt(timeState.hour, 10);
    if (isNaN(num) || num < 1) num = 12;
    if (num > 12) num = 12;
    const finalH = String(num).padStart(2, '0');
    const updatedTime = { ...timeState, hour: finalH };
    setTimeState(updatedTime);
    if (parsedValue) {
      emitChange(parsedValue.year, parsedValue.month, parsedValue.day, updatedTime);
    }
  };

  const handleMinuteChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(-2);
    let num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num > 59) num = 59;
    }
    const newM = isNaN(num) ? '' : String(num).padStart(val.length >= 2 ? 2 : 1, '0');
    const updatedTime = { ...timeState, minute: newM };
    setTimeState(updatedTime);
    if (parsedValue && newM) {
      emitChange(parsedValue.year, parsedValue.month, parsedValue.day, updatedTime);
    }
  };

  const handleMinuteBlur = () => {
    let num = parseInt(timeState.minute, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 59) num = 59;
    const finalM = String(num).padStart(2, '0');
    const updatedTime = { ...timeState, minute: finalM };
    setTimeState(updatedTime);
    if (parsedValue) {
      emitChange(parsedValue.year, parsedValue.month, parsedValue.day, updatedTime);
    }
  };

  const handleTogglePeriod = (period) => {
    const updatedTime = { ...timeState, period };
    setTimeState(updatedTime);
    if (parsedValue) {
      emitChange(parsedValue.year, parsedValue.month, parsedValue.day, updatedTime);
    }
  };

  // Generate days grid
  const calendarDays = useMemo(() => {
    const days = [];
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // First day of current month (0: Sun, 1: Mon, ..., 6: Sat)
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // In Spanish standard, Monday is first (index 0). So Sun=0 becomes 6, Mon=1 becomes 0, etc.
    const startOffset = (firstDayIndex + 6) % 7;

    // Previous month padding days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isPrevMonth: true,
        isNextMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        isPrevMonth: false,
        isNextMonth: false,
      });
    }

    // Next month padding days to complete 35 or 42 cells (5 or 6 rows)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      days.push({
        day: j,
        isPrevMonth: false,
        isNextMonth: true,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Year choices for dropdown: 100 years range (e.g. 1940 to 2040)
  const yearsList = useMemo(() => {
    const curY = today.getFullYear();
    const list = [];
    for (let y = curY - 80; y <= curY + 15; y++) {
      list.push(y);
    }
    return list;
  }, [today]);

  // Text displayed on the input
  const displayText = useMemo(() => {
    if (!parsedValue) return '';
    const dStr = String(parsedValue.day).padStart(2, '0');
    const mStr = String(parsedValue.month + 1).padStart(2, '0');
    const yStr = parsedValue.year;
    if (isDateTime) {
      let h12 = parsedValue.hour % 12;
      if (h12 === 0) h12 = 12;
      const hStr = String(h12).padStart(2, '0');
      const minStr = String(parsedValue.minute).padStart(2, '0');
      const p = parsedValue.hour >= 12 ? 'PM' : 'AM';
      return `${dStr}/${mStr}/${yStr} ${hStr}:${minStr} ${p}`;
    }
    return `${dStr}/${mStr}/${yStr}`;
  }, [parsedValue, isDateTime]);

  // Check if a day is currently selected
  const isDaySelected = (dayObj) => {
    if (!parsedValue) return false;
    if (dayObj.isPrevMonth || dayObj.isNextMonth) return false;
    return (
      parsedValue.year === viewYear &&
      parsedValue.month === viewMonth &&
      parsedValue.day === dayObj.day
    );
  };

  // Check if a day is today
  const isDayToday = (dayObj) => {
    if (dayObj.isPrevMonth || dayObj.isNextMonth) return false;
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === dayObj.day
    );
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({
        target: {
          value: '',
          name: name || '',
          id: id || '',
        },
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`erp-datepicker-container ${disabled ? 'disabled' : ''} ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Hidden input for standard HTML forms / form submission */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      {/* Trigger Input Bar */}
      <div
        className={`erp-datepicker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => !prev);
            setShowMonthDropdown(false);
            setShowYearDropdown(false);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(prev => !prev);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className={`erp-datepicker-text ${!displayText ? 'placeholder' : ''}`}>
          {displayText || placeholder || defaultPlaceholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && !disabled && (
            <button
              type="button"
              className="erp-datepicker-clear-btn"
              title="Borrar fecha"
              onClick={handleClear}
            >
              ✕
            </button>
          )}

          {/* Calendar SVG Icon */}
          <svg
            className="erp-datepicker-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="erp-calendar-popover">
          {/* Top Blue Pill Accent */}
          <div className="erp-calendar-top-pill" />

          {/* Header (Prev, Month, Year, Next) */}
          <div className="erp-calendar-header">
            {/* Prev Month Button */}
            <button
              type="button"
              className="erp-calendar-nav-btn"
              onClick={handlePrevMonth}
              title="Mes anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Month & Year Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              {/* Month Selector Button */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`erp-calendar-header-title ${showMonthDropdown ? 'open' : ''}`}
                  onClick={() => {
                    setShowMonthDropdown(prev => !prev);
                    setShowYearDropdown(false);
                  }}
                >
                  {MESES[viewMonth]}
                </button>

                {/* Month Dropdown */}
                {showMonthDropdown && (
                  <div ref={monthDropdownRef} className="erp-calendar-dropdown month-dropdown">
                    {MESES.map((mes, idx) => (
                      <div
                        key={mes}
                        className={`erp-calendar-dropdown-item ${idx === viewMonth ? 'selected' : ''}`}
                        onClick={() => {
                          setViewMonth(idx);
                          setShowMonthDropdown(false);
                        }}
                      >
                        {mes}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Selector Button */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`erp-calendar-header-title ${showYearDropdown ? 'open' : ''}`}
                  onClick={() => {
                    setShowYearDropdown(prev => !prev);
                    setShowMonthDropdown(false);
                  }}
                >
                  {viewYear}
                </button>

                {/* Year Dropdown */}
                {showYearDropdown && (
                  <div ref={yearDropdownRef} className="erp-calendar-dropdown year-dropdown">
                    {yearsList.map((y) => (
                      <div
                        key={y}
                        className={`erp-calendar-dropdown-item ${y === viewYear ? 'selected' : ''}`}
                        onClick={() => {
                          setViewYear(y);
                          setShowYearDropdown(false);
                        }}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Next Month Button */}
            <button
              type="button"
              className="erp-calendar-nav-btn"
              onClick={handleNextMonth}
              title="Mes siguiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="erp-calendar-weekdays">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="erp-calendar-weekday">
                {dia}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="erp-calendar-days-grid">
            {calendarDays.map((dObj, idx) => {
              const selected = isDaySelected(dObj);
              const todayFlag = isDayToday(dObj);
              const isOtherMonth = dObj.isPrevMonth || dObj.isNextMonth;

              return (
                <div
                  key={`${dObj.day}-${idx}`}
                  className={`erp-calendar-day-cell ${selected ? 'selected' : ''} ${isOtherMonth ? 'other-month' : ''} ${todayFlag ? 'today' : ''}`}
                  onClick={() => handleSelectDay(dObj)}
                >
                  {dObj.day}
                </div>
              );
            })}
          </div>

          {/* Time Picker Bar (Hora 00:00 AM/PM) */}
          {isDateTime && (
            <div className="erp-calendar-time-bar">
              <span className="erp-calendar-time-label">Hora</span>

              {/* Time Box: HH:MM */}
              <div className="erp-calendar-time-input-box">
                <input
                  type="text"
                  maxLength={2}
                  className="erp-calendar-time-subinput"
                  value={timeState.hour}
                  onChange={handleHourChange}
                  onBlur={handleHourBlur}
                  title="Hora (01 - 12)"
                />
                <span className="erp-calendar-time-colon">:</span>
                <input
                  type="text"
                  maxLength={2}
                  className="erp-calendar-time-subinput"
                  value={timeState.minute}
                  onChange={handleMinuteChange}
                  onBlur={handleMinuteBlur}
                  title="Minutos (00 - 59)"
                />
              </div>

              {/* AM / PM Toggle */}
              <div className="erp-calendar-period-toggle">
                <button
                  type="button"
                  className={`erp-calendar-period-btn ${timeState.period === 'AM' ? 'active' : ''}`}
                  onClick={() => handleTogglePeriod('AM')}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={`erp-calendar-period-btn ${timeState.period === 'PM' ? 'active' : ''}`}
                  onClick={() => handleTogglePeriod('PM')}
                >
                  PM
                </button>
              </div>
            </div>
          )}

          {/* Date-only Footer: Quick "Hoy" and "Listo" buttons */}
          {!isDateTime && (
            <div className="erp-calendar-footer">
              <button
                type="button"
                className="erp-calendar-today-btn"
                onClick={() => {
                  const now = new Date();
                  setViewYear(now.getFullYear());
                  setViewMonth(now.getMonth());
                  emitChange(now.getFullYear(), now.getMonth(), now.getDate());
                  setIsOpen(false);
                }}
              >
                Hoy
              </button>
              <button
                type="button"
                className="erp-calendar-done-btn"
                onClick={() => setIsOpen(false)}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
