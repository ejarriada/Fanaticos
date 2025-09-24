import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, Typography
} from '@mui/material';

const EditCostDialog = ({ open, onClose, onSave, item }) => {
    const [cost, setCost] = useState('');

    useEffect(() => {
        if (item) {
            setCost(item.cost || '');
        }
    }, [item]);

    const handleSave = () => {
        onSave(item.id, { cost: parseFloat(cost) });
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Editar Costo de Materia Prima</DialogTitle>
            <DialogContent>
                <Typography variant="h6">{item?.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary">Proveedor: {item?.supplier_name}</Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Nuevo Costo"
                    type="number"
                    fullWidth
                    variant="standard"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditCostDialog;
