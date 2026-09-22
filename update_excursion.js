const fs = require('fs');
let code = fs.readFileSync('react-frontend/src/components/catalog/excursiones/ExcursionList.jsx', 'utf8');

const searchStr = "{item.tipo_excursion}";
const idx = code.indexOf(searchStr);

if (idx !== -1) {
    const startIdx = code.lastIndexOf("<td", idx);
    const endIdx = code.indexOf("</td>", idx) + 5;
    
    if (startIdx !== -1 && endIdx !== -1) {
        const replacement = `<td style={{ padding: '14px 16px', color: '#F8FAFC', fontWeight: '600' }}>
                      <div style={{ marginBottom: (item.tasa_portuaria_status && item.tasa_portuaria_monto !== null) ? '6px' : '0' }}>{item.tipo_excursion}</div>
                      {item.tasa_portuaria_status && item.tasa_portuaria_monto !== null && (
                        <div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            border: '1px solid #10B981',
                            color: '#10B981',
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                          }}>
                            Valor Tasa portuaria: {parseFloat(item.tasa_portuaria_monto)} $
                          </span>
                        </div>
                      )}
                    </td>`;
        
        code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
        fs.writeFileSync('react-frontend/src/components/catalog/excursiones/ExcursionList.jsx', code, 'utf8');
        console.log("Replaced successfully!");
    } else {
        console.log("Could not find td boundaries");
    }
} else {
    console.log("Search string not found");
}
