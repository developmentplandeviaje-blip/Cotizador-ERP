const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let code = fs.readFileSync(file, 'utf8');

// The committed file contains:
// const handleDeactivate = async () => {
//     if(confirmAction) return executeDeactivate();
//     if (!ubicacionId) {
//         showToast('Seleccione una ubicacin vǭlida', 'warning');
//         return;
//     }
// 
//     if (!window.confirm('Estǭ seguro que desea desactivar todos los descuentos para esta ubicacin?')) {
//         return;
//     }
// 
//     setIsSubmitting(true);
//         isOpen={confirmAction}
//         onClose={() => setConfirmAction(false)}
// 

// Wait, the committed file is extremely mangled around `handleDeactivate`!
// Let me just fetch the file up to handleDeactivate and after handleDeactivate, and reconstruct it manually.

const lines = code.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('const handleDeactivate = async () => {') || line.includes('const handleDeactivate = () => {')) {
        skip = true;
        
        newLines.push(`    const handleDeactivate = () => {
        if (!ubicacionId) {
            showToast('Seleccione una ubicación válida', 'warning');
            return;
        }
        setConfirmAction(true);
    };

    const executeDeactivate = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                tipo_descuento: tipoDescuento,
                porcentaje: 0,
                ubicacion_id: ubicacionId,
            };

            const res = await axios.post('/v1/catalog/hoteles/descuento-masivo', payload);
            showToast(\`Éxito: \${res.data.message || 'Descuentos desactivados correctamente'}\`, 'success');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error desactivando descuento masivo', err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            showToast('Error desactivando el descuento masivo: ' + errMsg, 'error');
        } finally {
            setIsSubmitting(false);
            setConfirmAction(false);
        }
    };`);
        
        continue;
    }
    
    if (skip && line.includes("const title = tipoDescuento === 'contado' ? 'Descuento al Contado' : 'Descuento en Divisas';")) {
        skip = false;
    }
    
    if (!skip) {
        newLines.push(line);
    }
}

let newCode = newLines.join('\n');

// The committed file ALSO had a broken return (
//         isOpen={confirmAction} ...
// Let's fix that. The return statement should look like this:
const brokenReturnRegex = /return \([\s\S]*?<\/Modal>\s*\);\s*\}/;

const correctReturn = `return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
                    Este proceso afectará a todas las habitaciones y tarifas de los hoteles en la ubicación seleccionada.
                </p>

                <div className="form-group">
                    <label>Ubicación a afectar</label>
                    <select 
                        value={ubicacionId}
                        onChange={(e) => setUbicacionId(e.target.value)}
                        className="form-control"
                        disabled={isSubmitting}
                    >
                        <option value="ALL">Todas las Ubicaciones</option>
                        {ubicaciones.map(ub => (
                            <option key={ub.id} value={ub.id}>{ub.ubicacion}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Porcentaje de Descuento (%)</label>
                    <input 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Ejemplo: 10"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="form-control"
                        disabled={isSubmitting}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                        type="button"
                        onClick={handleDeactivate}
                        disabled={isSubmitting}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#FCA5A5',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: isSubmitting ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }
                        }}
                    >
                        Desactivar en ubicación
                    </button>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="button" className="btn-primary" onClick={handleApply} disabled={isSubmitting}>
                            {isSubmitting ? 'Procesando...' : 'Aplicar Descuento'}
                        </button>
                    </div>
                </div>
            </div>
            
            <DeleteConfirmationModal
                isOpen={confirmAction}
                onClose={() => setConfirmAction(false)}
                onCancel={() => setConfirmAction(false)}
                onConfirm={executeDeactivate}
                isDeleting={isSubmitting}
                title="Confirmar Desactivación"
                subtitle="Esta acción desactivará los descuentos para la ubicación seleccionada."
                content={
                    <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                        ¿Está seguro que desea desactivar todos los descuentos para esta ubicación?
                    </p>
                }
                confirmText="Desactivar"
            />
        </Modal>
    );
}`;

newCode = newCode.replace(brokenReturnRegex, correctReturn);

fs.writeFileSync(file, newCode, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file, newCode, 'utf8');
console.log("Fixed!");
