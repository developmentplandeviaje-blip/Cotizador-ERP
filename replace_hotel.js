const fs = require('fs');
let code = fs.readFileSync('react-frontend/src/components/catalog/hotels/HotelList.jsx', 'utf8');

if (!code.includes("import Pagination")) {
  code = code.replace(
    "import imgAgregar from '../../../assets/Agregar.svg';",
    "import imgAgregar from '../../../assets/Agregar.svg';\nimport Pagination from '../../common/Pagination';"
  );
}

const pattern = /\{\/\*\s*Pagination Footer\s*\*\/\}.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/s;
const match = code.match(pattern);

if (match) {
  // Wait, I need to match only the Pagination Footer div.
  // It's a bit dangerous to match all the way to the end.
}

