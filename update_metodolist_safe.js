const fs = require('fs');
const file = 'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!code.includes('import AssignMetodosModal')) {
    code = code.replace("import MetodoPagoModal from './MetodoPagoModal';", "import MetodoPagoModal from './MetodoPagoModal';\nimport AssignMetodosModal from './AssignMetodosModal';");
}

// 2. State
if (!code.includes('const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);')) {
    code = code.replace("const [isModalOpen, setIsModalOpen] = useState(false);", "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);");
}

// 3. Replace the EXACT Imprimir block
const imprimirBlock = `<div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Imprimir listado">
                <img src={imgImprimir} alt="Imprimir" style={{ width: '20px', height: '20px' }} />
              </button>
              <span className='title-input'>Imprimir</span>
            </div>`;

const asignarBlock = `<div style={{ display: 'flex', alignItems: 'center', position: 'relative', flexDirection: 'column' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsAssignModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                title="Asignar métodos de pago a asesor">
                <span style={{ fontSize: '1.2rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</span>
              </button>
              <span className='title-input'>Asignar</span>
            </div>`;

if (code.includes('Imprimir listado')) {
    code = code.replace(imprimirBlock, asignarBlock);
} else {
    console.log("Could not find exact Imprimir block.");
}

// 4. Render modal
const renderModalRegex = /(<MetodoPagoModal[\s\S]*?\/>)/;
const renderBothModals = `$1
      <AssignMetodosModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSaveSuccess={() => {
          setIsAssignModalOpen(false);
          setSuccessBanner('Asignación guardada exitosamente.');
          setTimeout(() => setSuccessBanner(''), 4000);
          fetchMetodos();
        }}
      />`;
code = code.replace(renderModalRegex, renderBothModals);

fs.writeFileSync(file, code, 'utf8');
console.log("MetodoPagoList updated safely.");
