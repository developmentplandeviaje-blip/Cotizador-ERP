import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import axios from 'axios';

export default function DescuentoMasivoModal({ isOpen, onClose, tipoDescuento, onSuccess }) {
    const [cantidad, setCantidad] = useState('');
    const [ubicacionId, setUbicacionId] = useState('ALL');
    const [ubicaciones, setUbicaciones] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            alert('La cantidad debe ser mayor a 0');
            return;
        }
        if (!ubicacionId) {
            alert('Seleccione una ubicación válida');
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
            alert(`Éxito: ${res.data.message || 'Descuentos actualizados correctamente'}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error aplicando descuento masivo', err);
            alert('Error aplicando el descuento masivo');
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = tipoDescuento === 'contado' ? 'Descuento al Contado' : 'Descuento en Divisas';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="400px"
            title={title}
        >
            <div style={{ padding: '10px 0' }}>
                <div style={{ marginBottom: '16px' }}>
                    <label className="erp-label">Cantidad: <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="erp-input"
                            placeholder="00"
                            value={cantidad}
                            onChange={handleCantidadChange}
                            style={{ paddingRight: '30px' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                            %
                        </span>
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label className="erp-label">Ubicación: <span className="req">*</span></label>
                    <select
                        className="erp-select"
                        value={ubicacionId}
                        onChange={(e) => setUbicacionId(e.target.value)}
                    >
                        <option value="ALL">Seleccione la ubicación</option>
                        <option value="ALL">Todas las ubicaciones</option>
                        {ubicaciones.map(ub => (
                            <option key={ub.id} value={ub.id}>{ub.ubicacion}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        type="button"
                        className="btn-form-cancel"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-form-nxt"
                        onClick={handleApply}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Aplicando...' : 'Aplicar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
