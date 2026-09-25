const fs = require('fs');
const file = 'react-frontend/src/components/finance/metodos_pago/MetodoPagoModal.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove stepStyle and steps from Modal, add just title
code = code.replace(/title=\{metodoToEdit[\s\S]*?width="720px"/, `title={metodoToEdit ? 'Editar MǸtodo de Pago' : 'Nuevo MǸtodo de Pago'}
      width="720px"`);

// 2. Remove all Asesores UI and logic in the form
// Remove from `{currentStep === 1 && (` down to `{currentStep === 2 && (` and its contents
const step1Start = /\{currentStep === 1 && \([\s\S]*?(<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '20px' \}\}>)/;
code = code.replace(step1Start, "$1");

const step2Regex = /\)\}\s*\{currentStep === 2 && \([\s\S]*?(?:<\/div>\s*<\/div>\s*)\)\}/;
code = code.replace(step2Regex, "");

// 3. Remove Footer and replace with a simple one-step footer
const footerRegex = /\{\/\* Footer Actions \*\/\}([\s\S]*?)<\/form>/;
const newFooter = `{/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '16px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-form-cancel"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-form-nxt"
          >
            {saving ? 'Guardando...' : (metodoToEdit ? 'Actualizar MǸtodo' : 'Crear MǸtodo')}
          </button>
        </div>
      </form>`;
code = code.replace(footerRegex, newFooter);

// 4. Remove currentStep state
code = code.replace(/const \[currentStep, setCurrentStep\] = useState\(1\);\n/, "");

fs.writeFileSync(file, code, 'utf8');
console.log("MetodoPagoModal simplified");
