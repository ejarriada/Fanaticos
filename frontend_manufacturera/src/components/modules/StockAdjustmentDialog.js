import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, MenuItem, Typography, Box 
} from '@mui/material';

const StockAdjustmentDialog = ({ open, onClose, onSave, item }) => {
    const [formData, setFormData] = useState({});

    const ADJUSTMENT_TYPE_CHOICES = [
        { value: 'Correccion', label: 'Corrección por Faltante/Sobrante' },
        { value: 'Devolucion', label: 'Devolución' },
        { value: 'Baja', label: 'Baja por Daño o Desuso' },
        { value: 'Inicial', label: 'Carga de Stock Inicial' },
    ];

    useEffect(() => {
        if (item) {
            setFormData({
                quantity: '',
                adjustment_type: 'Correccion',
                notes: ''
            });
        } else {
            setFormData({});
        }
    }, [item, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        const dataToSave = {
            ...formData,
            quantity: parseInt(formData.quantity, 10) || 0,
        };

        if (item.batch_number) { // Heuristic to check if it's a RawMaterial
            dataToSave.raw_material = item.id;
        } else { // Assumes it's a Product
            dataToSave.product = item.id;
        }

        onSave(dataToSave);
    };

    if (!item) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Ajuste de Stock</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body1">
                        Stock Actual: {item.stock !== undefined ? item.stock : item.current_stock}
                    </Typography>
                </Box>
                <TextField
                    margin="dense"
                    name="adjustment_type"
                    label="Tipo de Ajuste"
                    select
                    fullWidth
                    value={formData.adjustment_type || ''}
                    onChange={handleChange}
                >
                    {ADJUSTMENT_TYPE_CHOICES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField 
                    margin="dense" 
                    name="quantity" 
                    label="Cantidad a Ajustar" 
                    type="number" 
                    fullWidth 
                    value={formData.quantity || ''} 
                    onChange={handleChange} 
                    helperText="Usa un número positivo para añadir stock y un número negativo para quitar."
                />
                <TextField 
                    margin="dense" 
                    name="notes" 
                    label="Notas" 
                    type="text" 
                    fullWidth 
                    multiline 
                    rows={3} 
                    value={formData.notes || ''} 
                    onChange={handleChange} 
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Guardar Ajuste</Button>
            </DialogActions>
        </Dialog>
    );
};

export default StockAdjustmentDialog;
