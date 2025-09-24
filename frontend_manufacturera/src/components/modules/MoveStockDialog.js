import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, Select, MenuItem, FormControl, InputLabel, Typography
} from '@mui/material';

const MoveStockDialog = ({ open, onClose, onSave, item, locales }) => {
    const [destinationLocalId, setDestinationLocalId] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (item) {
            setQuantity(1); // Reset quantity on new item
            setDestinationLocalId(''); // Reset destination on new item
        }
    }, [item]);

    const handleSave = () => {
        if (!destinationLocalId || !quantity) {
            alert('Por favor, seleccione un destino y una cantidad.');
            return;
        }
        onSave(item.id, {
            destination_local_id: destinationLocalId,
            quantity_to_transfer: quantity
        });
    };

    // Filter out the current location from the list of possible destinations
    const destinationOptions = locales.filter(local => local.id !== item?.local?.id);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Transferir Stock de Producto</DialogTitle>
            <DialogContent>
                <Typography variant="h6">{item?.product?.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Desde: {item?.local?.name} (Disponible: {item?.quantity})
                </Typography>
                <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
                    <InputLabel>Almacén de Destino</InputLabel>
                    <Select
                        value={destinationLocalId}
                        label="Almacén de Destino"
                        onChange={(e) => setDestinationLocalId(e.target.value)}
                    >
                        {destinationOptions.map(local => (
                            <MenuItem key={local.id} value={local.id}>{local.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    margin="dense"
                    label="Cantidad a Transferir"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputProps={{ min: 1, max: item?.quantity || 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Transferir</Button>
            </DialogActions>
        </Dialog>
    );
};

export default MoveStockDialog;
