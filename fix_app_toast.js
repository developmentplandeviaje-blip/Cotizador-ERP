const fs = require('fs');
const file = 'react-frontend/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('ToastContainer')) {
    code = code.replace(/import React, { useState, useEffect } from 'react';/, "import React, { useState, useEffect } from 'react';\nimport ToastContainer from './components/common/ToastContainer';");
    
    // Inject `<ToastContainer />` right before `</MainLayout>`
    code = code.replace(/(<\/MainLayout>)/, "  <ToastContainer />\n    $1");
    
    fs.writeFileSync(file, code, 'utf8');
    console.log("Updated App.jsx with ToastContainer");
}
