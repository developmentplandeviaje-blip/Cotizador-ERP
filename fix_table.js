const fs = require('fs');
const file = 'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Main Table \*\/\}\s*<div\s*style=\{\{\s*background: 'rgba\(30, 41, 59, 0\.7\)',\s*border: '1px solid rgba\(255, 255, 255, 0\.1\)',\s*borderRadius: '16px',\s*overflow: 'hidden',\s*boxShadow: '0 10px 30px rgba\(0,0,0,0\.25\)',\s*\}\}\s*>/;

const replacement = `{/* Main Table */}
      <div style={{
        background: 'rgba(188, 192, 215, 0.09)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>`;

if(regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code, 'utf8');
    console.log("Fixed Table Container");
} else {
    console.log("Could not find Table Container match.");
}
