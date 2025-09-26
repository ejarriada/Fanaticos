import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button 
} from '@mui/material';

const BankForm = ({ open, onClose, onSave, bank }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (bank) {
            setFormData(bank);
        } else {
            setFormData({
                name: ''
            });
        }
    }, [bank, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{bank ? 'Editar Banco' : 'Nuevo Banco'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BankForm;
