import re

with open('react-frontend/src/components/users/agencia/UserAgenciaModal.jsx', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Add Modal import
if "import Modal from '../../common/Modal';" not in code:
    code = code.replace("import axios from 'axios';", "import axios from 'axios';\nimport Modal from '../../common/Modal';")

# 2. Change activeTab to currentStep
code = code.replace("const [activeTab, setActiveTab] = useState('general');", "const [currentStep, setCurrentStep] = useState(1);")
code = code.replace("setActiveTab('general');", "setCurrentStep(1);")

# 3. Replace the entire return block structure
# We can find the start of `return (`
start_idx = code.find('  return (\n')

# We want to replace everything from `return (` to the end of the file.
# Since it's a bit complicated, let's just do it manually by finding specific blocks.

# Replace wrapper up to the start of the form
header_regex = re.compile(r'    <div\n\s*style=\{\{\n\s*position: \'fixed\',.*?<form onSubmit=\{handleSubmit\}[^>]*>', re.DOTALL)

modal_wrapper = """    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Editar Usuario de Agencia' : 'Nuevo Usuario de Agencia'}
      steps={['Datos Generales', 'Comisiones por Servicio (%)']}
      currentStep={currentStep}
      width="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>"""

code = header_regex.sub(modal_wrapper, code)

# 4. Remove the tabs container
tabs_regex = re.compile(r'          \{/\* Tabs \*/\}.*?\{/\* Tab: General \*/\}', re.DOTALL)
code = tabs_regex.sub('{/* Tab: General */}', code)

# 5. Replace activeTab conditions
code = code.replace("{activeTab === 'general' && (", "{currentStep === 1 && (")
code = code.replace("{activeTab === 'comisiones' && (", "{currentStep === 2 && (")

# 6. Replace Footer
footer_regex = re.compile(r'          \{/\* Footer Actions \*/\}.*', re.DOTALL)

new_footer = """          {/* Footer Actions */}
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
}"""

code = footer_regex.sub(new_footer, code)

with open('react-frontend/src/components/users/agencia/UserAgenciaModal.jsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated successfully")
