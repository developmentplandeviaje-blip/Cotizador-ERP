const fs = require('fs');
const files = [
  'react-frontend/src/App.jsx',
  'C:\\xampp\\htdocs\\Cotizador-ERP\\react-frontend\\src\\App.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes("import ToastContainer from './components/common/ToastContainer';")) {
      code = code.replace(/import { useEffect, useState } from 'react';/, "import { useEffect, useState } from 'react';\nimport ToastContainer from './components/common/ToastContainer';");
      fs.writeFileSync(file, code, 'utf8');
      console.log("Fixed App.jsx import in", file);
    }
  }
});
