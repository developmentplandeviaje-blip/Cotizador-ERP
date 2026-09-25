const fs = require('fs');

const passProp = (file) => {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/stepStyle="tabs"/, 'stepStyle="tabs"\n      onStepChange={(step) => setCurrentStep(step)}');
    fs.writeFileSync(file, code, 'utf8');
};

passProp('react-frontend/src/components/users/agencia/UserAgenciaModal.jsx');
passProp('react-frontend/src/components/finance/metodos_pago/MetodoPagoModal.jsx');
