const fs = require('fs');

let code = fs.readFileSync('react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx', 'utf8');

if (!code.includes("import Pagination")) {
  code = code.replace(
    "import imgAgregar from '../../../assets/Agregar.svg';",
    "import imgAgregar from '../../../assets/Agregar.svg';\nimport Pagination from '../../common/Pagination';"
  );
}

const startIndex = code.indexOf("{/* Table Footer with Pagination */}");
if (startIndex !== -1) {
    const endString = "{/* Modal Crear / Editar */}";
    const endIndex = code.indexOf(endString, startIndex);
    
    if (endIndex !== -1) {
        const replaceString = `{/* Table Footer with Pagination */}
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.8125rem',
            color: '#94A3B8',
          }}>
            <div>
              Mostrando {ubicaciones.length} de {total} ubicaciones registradas
            </div>
            <Pagination page={page} lastPage={lastPage} setPage={setPage} />
          </div>
        </div>

        `;
        
        code = code.substring(0, startIndex) + replaceString + code.substring(endIndex);
        fs.writeFileSync('react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx', code, 'utf8');
        console.log("UbicacionList replaced!");
    } else {
        console.log("End string not found");
    }
} else {
    console.log("Start string not found");
}
