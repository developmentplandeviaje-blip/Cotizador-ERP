/**
 * Utility functions for validation, formatting, and character limits
 * adhering to Cotizador ERP requirements:
 * - Email: Requires (@ and .). Pre-@ max 30 chars, post-. max 4 chars. Max 50 chars total.
 * - Phone: Max 15 digits, only numbers and leading '+'.
 * - Cedula / Document: Max 12 digits, only numbers.
 * - Referral Code: Max 12 chars, '-' only after first 3 chars.
 * - Integer numbers: Max 3 digits (e.g. quantities, days, nights, passengers).
 */

export const formatTelefono = (val) => {
  if (!val) return '';
  let cleaned = String(val).replace(/[^0-9+]/g, '');
  if (cleaned.includes('+')) {
    const hasLeadingPlus = cleaned.startsWith('+');
    cleaned = (hasLeadingPlus ? '+' : '') + cleaned.replace(/\+/g, '');
  }
  return cleaned.slice(0, 15);
};

export const formatCedula = (val) => {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 12);
};

export const formatCodigoReferido = (val) => {
  if (!val) return '';
  let str = String(val).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  let prefix = str.slice(0, 3).replace(/-/g, '');
  let rest = str.slice(prefix.length);
  return (prefix + rest).slice(0, 12);
};

export const formatEmail = (val) => {
  if (!val) return '';
  let str = String(val);

  if (str.includes('@')) {
    const atIndex = str.indexOf('@');
    let userPart = str.slice(0, atIndex);
    let domainPart = str.slice(atIndex + 1);

    if (userPart.length > 30) {
      userPart = userPart.slice(0, 30);
    }
    // Only 1 @
    domainPart = domainPart.replace(/@/g, '');

    if (domainPart.includes('.')) {
      const lastDotIndex = domainPart.lastIndexOf('.');
      let preDot = domainPart.slice(0, lastDotIndex);
      let ext = domainPart.slice(lastDotIndex + 1);

      if (ext.length > 4) {
        ext = ext.slice(0, 4);
      }
      domainPart = preDot + '.' + ext;
    }
    str = userPart + '@' + domainPart;
  } else {
    if (str.length > 30) {
      str = str.slice(0, 30);
    }
  }

  return str.slice(0, 50);
};

export const validateEmail = (email) => {
  if (!email || String(email).trim() === '') return { isValid: true, message: '' };
  const trimmed = String(email).trim();

  if (!trimmed.includes('@') || !trimmed.includes('.')) {
    return { isValid: false, message: 'El correo debe contener "@" y "."' };
  }

  const atIndex = trimmed.indexOf('@');
  const userPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  if (userPart.length === 0) {
    return { isValid: false, message: 'Debe ingresar un usuario antes del "@"' };
  }
  if (userPart.length > 30) {
    return { isValid: false, message: 'Antes del "@" no puede tener más de 30 caracteres' };
  }
  if (!domainPart.includes('.')) {
    return { isValid: false, message: 'El dominio después del "@" debe contener un "."' };
  }

  const lastDotIndex = domainPart.lastIndexOf('.');
  const domainName = domainPart.slice(0, lastDotIndex);
  const ext = domainPart.slice(lastDotIndex + 1);

  if (domainName.length === 0) {
    return { isValid: false, message: 'Debe ingresar un dominio después del "@"' };
  }
  if (ext.length === 0) {
    return { isValid: false, message: 'Debe ingresar una extensión después del "."' };
  }
  if (ext.length > 4) {
    return { isValid: false, message: 'Después del "." no puede tener más de 4 caracteres' };
  }

  return { isValid: true, message: 'Válido' };
};

export const formatNumberDigits = (val, maxDigits = 3) => {
  if (val === '' || val === null || val === undefined) return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  return digitsOnly.slice(0, maxDigits);
};
