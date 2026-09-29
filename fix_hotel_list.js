const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/HotelList.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state variables
if (!code.includes('const [deleteTarget, setDeleteTarget]')) {
  code = code.replace(/const \[selectedHotelForRooms, setSelectedHotelForRooms\] = useState\(null\);/, 
    `const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);\n  const [deleteTarget, setDeleteTarget] = useState(null);\n  const [isDeleting, setIsDeleting] = useState(false);\n  const [deleteError, setDeleteError] = useState('');\n  const [successBanner, setSuccessBanner] = useState('');`);
}

// 2. Replace handleDelete and add handleConfirmDelete
const oldDeleteRegex = /const handleDelete = async \(hotel\) => \{[\s\S]*?alert\('No se pudo eliminar el hotel: ' \+ \(err\.response\?\.data\?\.message \|\| err\.message \|\| ''\)\);\s*\}\s*\};/;
const newDelete = `const handleDelete = (hotel) => {
    setDeleteTarget(hotel);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(\`/v1/catalog/hoteles/\${deleteTarget.id}\`);
      setDeleteTarget(null);
      setSuccessBanner('Hotel eliminado exitosamente.');
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchHotels();
    } catch (err) {
      console.error('Error al eliminar hotel:', err);
      setDeleteError('No se pudo eliminar el hotel.');
    } finally {
      setIsDeleting(false);
    }
  };`;

if (code.match(oldDeleteRegex)) {
  code = code.replace(oldDeleteRegex, newDelete);
} else if (!code.includes('handleConfirmDelete')) {
  console.log("Could not find old handleDelete");
}

fs.writeFileSync(file, code, 'utf8');
console.log("Fixed HotelList.jsx");
