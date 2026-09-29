import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { showToast } from '../../../utils/toast';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import axios from 'axios';

export default function DescuentoMasivoModal({ isOpen, onClose, tipoDescuento, onSuccess }) {
    const [cantidad, setCantidad] = useState('');
    const [ubicacionId, setUbicacionId] = useState('ALL');
    const [ubicaciones, setUbicaciones] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmAction, setConfirmAction] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCantidad('');
            setUbicacionId('ALL');
            fetchUbicaciones();
        }
    }, [isOpen]);

    const fetchUbicaciones = async () => {
        try {
            const res = await axios.get('/v1/catalog/ubicaciones');
            setUbicaciones(res.data.data || []);
        } catch (err) {
            console.error('Error cargando ubicaciones', err);
        }
    };

    // Enforce numeric mask 0-100
    const handleCantidadChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val !== '') {
            let num = parseInt(val, 10);
            if (num > 100) num = 100;
            val = num.toString();
        }
        setCantidad(val);
    };

    const handleApply = async () => {
        if (!cantidad || parseInt(cantidad, 10) === 0) {
            showToast('La cantidad debe ser mayor a 0', 'warning');
            return;
        }
        if (!ubicacionId) {
            showToast('Seleccione una ubicación válida', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                tipo_descuento: tipoDescuento, // 'contado' o 'divisas'
                porcentaje: parseInt(cantidad, 10),
                ubicacion_id: ubicacionId,
            };

            const res = await axios.post('/v1/catalog/hoteles/descuento-masivo', payload);
            showToast(`Éxito: ${res.data.message || 'Descuentos actualizados correctamente'}`, 'success');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error aplicando descuento masivo', err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            showToast('Error aplicando el descuento masivo: ' + errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = () => {
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
            showToast(`Éxito: ${res.data.message || 'Descuentos desactivados correctamente'}`, 'success');
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
    };
    const title = tipoDescuento === 'contado' ? 'Descuento al Contado' : 'Descuento en Divisas';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="500px"
            title={title}
        /*size="md"*/
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
                    Este proceso afectará a todas las habitaciones y tarifas de los hoteles en la ubicación seleccionada.
                </p>

                <div style={{ marginBottom: '24px' }}>
                    <label className="erp-label">Ubicación: </label>
                    <select
                        value={ubicacionId}
                        onChange={(e) => setUbicacionId(e.target.value)}
                        className="erp-select"
                        disabled={isSubmitting}
                    >
                        <option value="ALL">Todas las Ubicaciones</option>
                        {ubicaciones.map(ub => (
                            <option key={ub.id} value={ub.id}>{ub.ubicacion}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label className="erp-label">Porcentaje de Descuento (%): </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Ejemplo: 10"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="erp-input"
                        disabled={isSubmitting}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                        %
                    </span>
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
                        Desactivar Descuento
                    </button>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" className="btn-form-cancel" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="button" className="btn-form-nxt" onClick={handleApply} disabled={isSubmitting}>
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
}
