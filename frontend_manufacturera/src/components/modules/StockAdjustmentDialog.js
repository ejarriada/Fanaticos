import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, MenuItem, Typography, Box 
} from '@mui/material';

const StockAdjustmentDialog = ({ open, onClose, onSave, item, locales }) => {
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
                notes: '',
                local: item.local?.id || item.local || '' // Pre-select local if it exists on the item
            });
        } else {
            setFormData({}); // Should not happen if dialog opens only for an item
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

        // The backend needs to know which item to adjust.
        // We distinguish by checking for a property unique to raw materials vs finished products.
        if (item.supplier_name) { // Heuristic for MateriaPrimaProveedor
            dataToSave.raw_material_supplier_id = item.id;
        } else { // Assumes it's an Inventory item
            dataToSave.inventory_id = item.id;
        }

        // If it's a new stock load, we must provide the local.
        if (formData.adjustment_type === 'Inicial' && !formData.local) {
            alert('Debe seleccionar un almacén para la carga inicial de stock.');
            return;
        }

        onSave(dataToSave);
    };

    if (!item) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Ajuste de Stock</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6">{item.product?.name || item.name}</Typography>
                    <Typography variant="body1">
                        Stock Actual: {item.quantity !== undefined ? item.quantity : item.current_stock}
                        {item.local?.name && ` en ${item.local.name}`}
                        {item.local_name && ` en ${item.local_name}`}
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
                    name="local"
                    label="Almacén"
                    select
                    fullWidth
                    value={formData.local || ''}
                    onChange={handleChange}
                    disabled={!!(item.local || item.local_name)} // Disable if the item already has a location
                    helperText={item.local || item.local_name ? "No se puede cambiar el almacén de un stock existente." : "Seleccione un almacén."}
                >
                    {(locales || []).map((local) => (
                        <MenuItem key={local.id} value={local.id}>
                            {local.name}
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
