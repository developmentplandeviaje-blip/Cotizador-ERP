const fs = require("fs");
let content = fs.readFileSync("react-frontend/src/components/catalog/hotels/HotelModal.jsx", "utf8");

content = content.replace("desc_divisas_monto: '',", "desc_divisas_monto: '',\n    fechas_sin_disponibilidad: [],");

content = content.replace("desc_divisas_monto: regla ? regla.aumento_bolivares_porcentaje : '',", "desc_divisas_monto: regla ? regla.aumento_bolivares_porcentaje : '',\n          fechas_sin_disponibilidad: hotelToEdit.fechas_sin_disponibilidad || [],");

content = content.replace("status: true,", "status: true,\n        fechas_sin_disponibilidad: hotelInfo.fechas_sin_disponibilidad,");

const new_ui = `
            {/* Bloqueos / Fechas sin disponibilidad */}
            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
              <label className="erp-label" style={{ fontSize: '0.8125rem' }}>Fechas sin Habitaciones (Bloqueos)</label>
              {(hotelInfo.fechas_sin_disponibilidad || []).map((rango, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    className="erp-input"
                    value={rango.desde || ''}
                    onChange={(e) => {
                      const newFechas = [...(hotelInfo.fechas_sin_disponibilidad || [])];
                      newFechas[idx].desde = e.target.value;
                      setHotelInfo({ ...hotelInfo, fechas_sin_disponibilidad: newFechas });
                    }}
                  />
                  <span style={{ color: '#F8FAFC', fontSize: '0.875rem' }}>al</span>
                  <input
                    type="date"
                    className="erp-input"
                    value={rango.hasta || ''}
                    onChange={(e) => {
                      const newFechas = [...(hotelInfo.fechas_sin_disponibilidad || [])];
                      newFechas[idx].hasta = e.target.value;
                      setHotelInfo({ ...hotelInfo, fechas_sin_disponibilidad: newFechas });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newFechas = (hotelInfo.fechas_sin_disponibilidad || []).filter((_, i) => i !== idx);
                      setHotelInfo({ ...hotelInfo, fechas_sin_disponibilidad: newFechas });
                    }}
                    title="Eliminar rango"
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-accent"
                style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '4px' }}
                onClick={() => {
                  setHotelInfo({ ...hotelInfo, fechas_sin_disponibilidad: [...(hotelInfo.fechas_sin_disponibilidad || []), { desde: '', hasta: '' }] });
                }}
              >
                + Agregar Rango
              </button>
            </div>

            {/* Descuentos Toggle (Pǭgina 4 y 5) */}
`;

// There might be some character encoding issues with "Pǭgina". We can just use a regex replace
content = content.replace(/\{\/\* Descuentos Toggle.*?\*\/\}/s, new_ui);

fs.writeFileSync("react-frontend/src/components/catalog/hotels/HotelModal.jsx", content, "utf8");
console.log("Done");
