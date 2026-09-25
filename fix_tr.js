const fs = require('fs');
const file = 'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<tr style=\{\{\s*background: 'rgba\(15, 23, 42, 0\.75\)',\s*borderBottom: '1px solid rgba\(255, 255, 255, 0\.1\)'\s*\}\}>/,
  "<tr style={{ background: '#e8721726', borderBottom: '1px solid rgba(255, 255, 255, 0.84)' }}>"
);

fs.writeFileSync(file, code, 'utf8');
console.log("Fixed TR");
