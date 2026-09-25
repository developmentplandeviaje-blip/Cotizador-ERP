const fs = require('fs');
const file = 'react-frontend/src/components/common/Modal.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add onStepChange prop
code = code.replace(/stepStyle = 'pills'/, "stepStyle = 'pills', onStepChange");

// 2. Add cursor pointer and onClick to tabs
code = code.replace(/<div\s*key=\{idx\}\s*style=\{\{\s*display: 'flex',/g, `<div
                    key={idx}
                    onClick={() => onStepChange && onStepChange(idx + 1)}
                    style={{
                      cursor: onStepChange ? 'pointer' : 'default',
                      display: 'flex',`);

// Also add to pills just in case
code = code.replace(/<div\s*key=\{idx\}\s*style=\{\{\s*flex: 1,/g, `<div
                      key={idx}
                      onClick={() => onStepChange && onStepChange(idx + 1)}
                      style={{
                        cursor: onStepChange ? 'pointer' : 'default',
                        flex: 1,`);

fs.writeFileSync(file, code, 'utf8');
console.log("Made tabs clickable");
