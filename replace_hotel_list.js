const fs = require('fs');

let hotelCode = fs.readFileSync('react-frontend/src/components/catalog/hotels/HotelList.jsx', 'utf8');

if (!hotelCode.includes("import Pagination")) {
  hotelCode = hotelCode.replace(
    "import imgAgregar from '../../../assets/Agregar.svg';",
    "import imgAgregar from '../../../assets/Agregar.svg';\nimport Pagination from '../../common/Pagination';"
  );
}

const startIndex = hotelCode.indexOf("{/* Pagination Footer */}");
if (startIndex !== -1) {
    const endString = "{/* Hotel Create / Edit Wizard Modal */}";
    const endIndex = hotelCode.indexOf(endString, startIndex);
    
    if (endIndex !== -1) {
        const replaceString = `{/* Pagination Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
             <Pagination page={page} lastPage={lastPage} setPage={setPage} />
          </div>
        </div>

        `;
        
        hotelCode = hotelCode.substring(0, startIndex) + replaceString + hotelCode.substring(endIndex);
        fs.writeFileSync('react-frontend/src/components/catalog/hotels/HotelList.jsx', hotelCode, 'utf8');
        console.log("HotelList replaced!");
    } else {
        console.log("End string not found");
    }
} else {
    console.log("Start string not found");
}
