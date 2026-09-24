const fs = require('fs');
let code = fs.readFileSync('react-frontend/src/App.jsx', 'utf8');

code = code.replace(/useState\('servicios_hoteles'\)/g, "useState('dashboard')");
code = code.replace(/setActiveRoute\('servicios_hoteles'\);/g, "setActiveRoute('dashboard');");

fs.writeFileSync('react-frontend/src/App.jsx', code, 'utf8');
console.log("App.jsx fixed");
