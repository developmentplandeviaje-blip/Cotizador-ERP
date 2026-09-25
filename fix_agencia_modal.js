const fs = require('fs');

let code = fs.readFileSync('react-frontend/src/components/users/agencia/UserAgenciaModal.jsx', 'utf8');

// 1. Add Modal import
if (!code.includes("import Modal from '../../common/Modal';")) {
    code = code.replace("import axios from 'axios';", "import axios from 'axios';\nimport Modal from '../../common/Modal';");
}

// 2. Change activeTab to currentStep
code = code.replace("const [activeTab, setActiveTab] = useState('general');", "const [currentStep, setCurrentStep] = useState(1);");
code = code.replace("setActiveTab('general');", "setCurrentStep(1);");

// 3. Replace the entire return block structure
const headerRegex = /<div\s*style=\{\{[\s\S]*?position: 'fixed'[\s\S]*?<form onSubmit=\{handleSubmit\}[^>]*>/;
const modalWrapper = `<Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Editar Usuario de Agencia' : 'Nuevo Usuario de Agencia'}
      steps={['Datos Generales', 'Comisiones por Servicio (%)']}
      currentStep={currentStep}
      width="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>`;

code = code.replace(headerRegex, modalWrapper);

// 4. Remove the tabs container
const tabsRegex = /\{\/\* Tabs \*\/\}([\s\S]*?)\{\/\* Tab: General \*\/\}/;
code = code.replace(tabsRegex, "{/* Tab: General */}");

// 5. Replace activeTab conditions
code = code.replace(/\{activeTab === 'general' && \(/g, "{currentStep === 1 && (");
code = code.replace(/\{activeTab === 'comisiones' && \(/g, "{currentStep === 2 && (");

// 6. Replace Footer
const footerRegex = /\{\/\* Footer Actions \*\/\}([\s\S]*)/;
const newFooter = `{/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '16px'
          }}
        >
          {currentStep === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-form-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-form-nxt"
                onClick={() => setCurrentStep(2)}
              >
                Siguiente
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-form-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-form-prv"
                onClick={() => setCurrentStep(1)}
                disabled={saving}
              >
                Anterior
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-form-nxt"
              >
                {saving ? 'Guardando...' : (userToEdit ? 'Actualizar Usuario' : 'Crear Usuario')}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}`;

code = code.replace(footerRegex, newFooter);

fs.writeFileSync('react-frontend/src/components/users/agencia/UserAgenciaModal.jsx', code, 'utf8');
console.log("Updated successfully");
