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
