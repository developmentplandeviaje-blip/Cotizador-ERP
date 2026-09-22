const fs = require('fs');

let code = fs.readFileSync('react-frontend/src/components/catalog/excursiones/ExcursionModal.jsx', 'utf8');

// 1. Add states
code = code.replace(
    "const [aplicaDescuentoReferidos, setAplicaDescuentoReferidos] = useState(false);",
    "const [aplicaDescuentoReferidos, setAplicaDescuentoReferidos] = useState(false);\n  const [tasaPortuariaStatus, setTasaPortuariaStatus] = useState(false);\n  const [tasaPortuariaMonto, setTasaPortuariaMonto] = useState('');"
);

// 2. Populate
code = code.replace(
    "setAplicaDescuentoReferidos(Boolean(excursionToEdit.aplica_descuento_referidos));",
    "setAplicaDescuentoReferidos(Boolean(excursionToEdit.aplica_descuento_referidos));\n          setTasaPortuariaStatus(Boolean(excursionToEdit.tasa_portuaria_status));\n          setTasaPortuariaMonto(excursionToEdit.tasa_portuaria_monto !== undefined && excursionToEdit.tasa_portuaria_monto !== null ? excursionToEdit.tasa_portuaria_monto : '');"
);

// 3. Reset
code = code.replace(
    "setAplicaDescuentoReferidos(false);\n        }",
    "setAplicaDescuentoReferidos(false);\n          setTasaPortuariaStatus(false);\n          setTasaPortuariaMonto('');\n        }"
);

// 4. Payload
code = code.replace(
    "aplica_descuento_referidos: Boolean(aplicaDescuentoReferidos),",
    "aplica_descuento_referidos: Boolean(aplicaDescuentoReferidos),\n        tasa_portuaria_status: Boolean(tasaPortuariaStatus),\n        tasa_portuaria_monto: tasaPortuariaStatus ? (parseFloat(tasaPortuariaMonto) || 0) : null,"
);

// 5. UI
const targetUI = "{/* Action Buttons */}";
const newUI = `{/* Tasa Portuaria Block */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.875rem', color: '#F8FAFC' }}>¿Incluye Tasa Portuaria?</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tasa_portuaria_status"
                  checked={tasaPortuariaStatus === true}
                  onChange={() => setTasaPortuariaStatus(true)}
                  disabled={isSubmitting}
                />
                Si
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tasa_portuaria_status"
                  checked={tasaPortuariaStatus === false}
                  onChange={() => {
                    setTasaPortuariaStatus(false);
                    setTasaPortuariaMonto('');
                  }}
                  disabled={isSubmitting}
                />
                No
              </label>
            </div>
          
            {tasaPortuariaStatus && (
              <div style={{ marginTop: '16px', maxWidth: '200px' }}>
                <label className="erp-label" style={{ fontSize: '0.8125rem' }}>Cantidad:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="erp-input"
                  placeholder="0.00"
                  value={tasaPortuariaMonto}
                  onChange={(e) => setTasaPortuariaMonto(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}`;

code = code.replace(targetUI, newUI);

fs.writeFileSync('react-frontend/src/components/catalog/excursiones/ExcursionModal.jsx', code, 'utf8');
console.log("Done");
