const fs = require('fs');
const file = 'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /<div style=\{\{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' \}\}>\s*<button\s*className="btn-secondary"\s*onClick=\{\(\) => window\.print\(\)\}\s*style=\{\{ display: 'inline-flex', alignItems: 'center', gap: '8px' \}\}\s*title="Imprimir listado">\s*<img src=\{imgImprimir\} alt="Imprimir" style=\{\{ width: '20px', height: '20px' \}\} \/>\s*<\/button>\s*<span className='title-input'>Imprimir<\/span>\s*<\/div>/;

const asignarBlock = `<div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsAssignModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CBD5E1', fontSize: '1.2rem' }}
                title="Asignar métodos de pago a asesor">
                👥
              </button>
              <span className='title-input'>Asignar</span>
            </div>`;

if (regex.test(code)) {
    code = code.replace(regex, asignarBlock);
    fs.writeFileSync(file, code, 'utf8');
    console.log("Replaced Imprimir successfully!");
} else {
    console.log("Regex didn't match.");
}
