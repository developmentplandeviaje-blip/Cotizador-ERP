const fs = require('fs');

const file = 'react-frontend/src/components/common/Modal.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add stepStyle prop
code = code.replace(/export default function Modal\(\{([\s\S]*?)\}\) \{/, (match, props) => {
  if (!props.includes('stepStyle')) {
    return `export default function Modal({${props.replace('steps, currentStep', 'steps, currentStep, stepStyle = \'pills\'')}}) {`;
  }
  return match;
});

// 2. Change how steps are rendered
// We want to completely replace the Modal Header block.
const headerRegex = /\{\/\* Modal Header \*\/\}([\s\S]*?)<button\s*onClick=\{onClose\}/;

const newHeader = `{/* Modal Header */}
        <div style={{
          padding: stepStyle === 'tabs' ? '20px 24px 0 24px' : '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
          display: 'flex',
          flexDirection: stepStyle === 'tabs' && title ? 'column' : 'row',
          alignItems: stepStyle === 'tabs' && title ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {/* Top row for title and close button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: stepStyle === 'tabs' && title ? '20px' : '0' }}>
            {(!steps || stepStyle === 'tabs' || title) && (
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#FFFFFF', display: (!steps || (title && stepStyle === 'tabs')) ? 'block' : 'none' }}>
                {title}
              </h3>
            )}
            
            {(steps && stepStyle === 'pills') && (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {steps.map((step, idx) => {
                  const isActive = currentStep === idx + 1;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: isActive ? '1px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isActive ? '#FFFFFF' : '#94A3B8',
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? '600' : '400',
                      }}
                    >
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isActive ? '#2563EB' : 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#FFFFFF'
                      }}>
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={onClose}`;

code = code.replace(headerRegex, newHeader);

// 3. Add tabs below title in header if stepStyle === 'tabs'
const closeButtonRegex = /<button\s*onClick=\{onClose\}[\s\S]*?<\/button>\s*<\/div>/;

const updatedCloseButtonAndTabs = `<button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                marginLeft: '12px',
              }}
            >
              o 
            </button>
          </div>

          {(steps && stepStyle === 'tabs') && (
            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              {steps.map((step, idx) => {
                const isActive = currentStep === idx + 1;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 4px 12px 4px',
                      borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
                      color: isActive ? '#2563EB' : '#94A3B8',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? '600' : '500',
                      marginBottom: '-1px'
                    }}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      color: isActive ? '#2563EB' : '#94A3B8'
                    }}>
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>`;

code = code.replace(closeButtonRegex, updatedCloseButtonAndTabs);

fs.writeFileSync(file, code, 'utf8');
console.log("Updated Modal.jsx");
