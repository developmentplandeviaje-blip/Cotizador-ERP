export const normalizeHotelAdolescentPassengers = (data, hotel, hideCosts = false) => {
  const adolescentes = Number(data.adolescente || 0);
  if (adolescentes <= 0) return data;

  const ageRange = String(hotel?.edad_adolescentes || '').trim();
  const hasAdolescentAgeRange = /\d/.test(ageRange);
  const hasAdolescentPrice = Number(data.precio_noche_adolescente || 0) > 0;
  const hasAdolescentCost = Number(data.costo_noche_adolescente || 0) > 0;
  const hasAdolescentRate = hasAdolescentPrice && (hideCosts || hasAdolescentCost);

  if (hasAdolescentAgeRange && hasAdolescentRate) return data;

  return {
    ...data,
    adultos: Number(data.adultos || 0) + adolescentes,
    adolescente: 0,
  };
};

export const formatMontoMoneda = (monto, moneda = 'USD') => {
  const num = Number(monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const curr = String(moneda || 'USD').toUpperCase().trim();
  if (curr === 'EUR') return `€${num} EUR`;
  if (curr === 'VES' || curr === 'BS') return `Bs. ${num}`;
  return `$${num} USD`;
};

export const getCurrencySymbol = (moneda = 'USD') => {
  const curr = String(moneda || 'USD').toUpperCase().trim();
  if (curr === 'EUR') return '€';
  if (curr === 'VES' || curr === 'BS') return 'Bs.';
  return '$';
};
