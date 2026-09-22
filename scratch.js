const fs = require('fs');
let code = fs.readFileSync('react-frontend/src/components/catalog/excursiones/ExcursionList.jsx', 'utf8');

const insertion = `
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: \`url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b9c8dd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")\`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'calc(100% - 20px) center',
                  backgroundSize: '16px',`;

const target = "color: selectedUbicacion ? '#FFFFFF' : '#b9c8ddff',";
if (code.includes(target)) {
    code = code.replace(target, target + insertion);
    fs.writeFileSync('react-frontend/src/components/catalog/excursiones/ExcursionList.jsx', code, 'utf8');
    console.log("Success");
} else {
    console.log("Failed to find");
}
