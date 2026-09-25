const fs = require('fs');
const file = 'react-frontend/src/components/common/Modal.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/marginLeft: '12px',\s*\}\}\s*>\s*[^<]*<\/button>/, "marginLeft: '12px',\n              }}\n            >\n              ✕\n            </button>");
fs.writeFileSync(file, code, 'utf8');
