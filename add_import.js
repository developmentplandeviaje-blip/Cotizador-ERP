const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/HotelList.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace("import axios from 'axios';", "import axios from 'axios';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';");
fs.writeFileSync(file, code, 'utf8');
