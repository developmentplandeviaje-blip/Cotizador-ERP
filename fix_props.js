const fs = require('fs');

const addStepStyle = (file) => {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/currentStep=\{currentStep\}/, "currentStep={currentStep}\n      stepStyle=\"tabs\"");
    fs.writeFileSync(file, code, 'utf8');
};

addStepStyle('react-frontend/src/components/users/agencia/UserAgenciaModal.jsx');
addStepStyle('react-frontend/src/components/finance/metodos_pago/MetodoPagoModal.jsx');
