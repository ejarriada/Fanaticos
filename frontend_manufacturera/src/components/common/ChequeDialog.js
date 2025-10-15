
import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, 
    CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl 
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

/**
 * ChequeDialog es un componente reutilizable para crear, editar y visualizar cheques.
 * Se encarga de cargar la lista de bancos y manejar el estado del formulario.
 * 
 * @param {object} props
 * @param {boolean} props.open - Controla si el diálogo está abierto.
 * @param {function} props.onClose - Función a llamar para cerrar el diálogo.
 * @param {function} props.onSave - Función a llamar al guardar el cheque. Retorna los datos del cheque.
 * @param {object|null} props.cheque - El objeto cheque para editar o visualizar. Si es null, es un formulario de creación.
 * @param {number|null} props.prefilledAmount - Monto pre-llenado para el cheque (ej. desde una venta).
 * @param {boolean} props.readOnly - Si es true, los campos no se pueden editar.
 */
const ChequeDialog = ({ 
    open, 
    onClose, 
    onSave, 
    cheque = null, 
    prefilledAmount = null,
    readOnly = false, 
    banks = [] // Recibir bancos como prop
}) => {
    const [formData, setFormData] = useState({});
    const { tenantId } = useAuth();

    const CHEQUE_STATUS_CHOICES = [
        { value: 'CARGADO', label: 'Cargado' },
        { value: 'ENTREGADO', label: 'Entregado' },
        { value: 'RECHAZADO', label: 'Rechazado' },
        { value: 'COBRADO', label: 'Cobrado' },
        { value: 'ANULADO', label: 'Anulado' },
    ];

    useEffect(() => {
        if (open) {
            console.log("ChequeDialog recibió:", cheque);
            const initialFormData = {
                number: cheque?.number || cheque?.order_number || '',
                amount: cheque?.amount || prefilledAmount || '',
                bank: cheque?.bank?.id || cheque?.bank || '',
                issuer: cheque?.issuer || '',
                cuit: cheque?.cuit || '',
                due_date: cheque?.due_date ? new Date(cheque.due_date).toISOString().split('T')[0] : '',
                recipient: cheque?.recipient || cheque?.receiver || '',
                received_from: cheque?.received_from || '',
                observations: cheque?.observations || '',
                status: cheque?.status ? cheque.status.toUpperCase() : 'CARGADO',
            };
            setFormData(initialFormData);
            console.log("Formulario inicializado con:", initialFormData);
        }
    }, [cheque, open, prefilledAmount]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        // Limpieza de datos antes de guardar
        const dataToSave = {
            ...formData,
            amount: parseFloat(formData.amount) || 0,
            bank: formData.bank || null,
        };
        onSave(dataToSave);
    };

    const isSaveDisabled = !formData.number || !formData.amount || !formData.issuer;

        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>{readOnly ? 'Ver Cheque' : (cheque ? 'Editar Cheque' : 'Nuevo Cheque')}</DialogTitle>
                <DialogContent>
                    <div style={{ paddingTop: '10px' }}>
                        <TextField margin="dense" name="number" label="Número" type="text" fullWidth value={formData.number || ''} onChange={handleChange} InputProps={{ readOnly: readOnly }} />
                        <TextField margin="dense" name="amount" label="Monto $" type="number" fullWidth value={formData.amount || ''} onChange={handleChange} InputProps={{ readOnly: readOnly }} />
                        
                        <FormControl fullWidth margin="dense" disabled={readOnly}>
                            <InputLabel>Banco</InputLabel>
                            <Select name="bank" value={formData.bank || ''} onChange={handleChange} label="Banco">
                                {banks.map((bank) => (
                                    <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
    
                        <TextField margin="dense" name="issuer" label="Emisor" type="text" fullWidth value={formData.issuer || ''} onChange={handleChange} InputProps={{ readOnly: readOnly }} />
                        <TextField margin="dense" name="cuit" label="CUIT" type="text" fullWidth value={formData.cuit || ''} onChange={handleChange} InputProps={{ readOnly: readOnly }} />
                        <TextField margin="dense" name="due_date" label="Vencimiento" type="date" fullWidth value={formData.due_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} InputProps={{ readOnly: readOnly }} />
                        <TextField margin="dense" name="recipient" label="Receptor" type="text" fullWidth value={formData.recipient || ''} onChange={handleChange} InputProps={{ readOnly: readOnly }} />
                        <TextField margin="dense" name="received_from" label="Recibido de" type="text" fullWidth value={formData.received_from || ''} onChange={handleChange} InputProps={{ readOnly: readOnly }} />
                        <TextField margin="dense" name="observations" label="Observaciones" type="text" fullWidth value={formData.observations || ''} onChange={handleChange} multiline rows={2} InputProps={{ readOnly: readOnly }} />
                        
                        <FormControl fullWidth margin="dense" disabled={readOnly}>
                            <InputLabel>Estado</InputLabel>
                            <Select name="status" value={formData.status || ''} onChange={handleChange} label="Estado">
                                {CHEQUE_STATUS_CHOICES.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    {!readOnly && (
                        <Button onClick={handleSubmit} disabled={isSaveDisabled}>Guardar</Button>
                    )}
                </DialogActions>
            </Dialog>
        );
};
export default ChequeDialog;
