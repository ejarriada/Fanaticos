import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, 
    Grid, Checkbox, FormControlLabel, Autocomplete
} from '@mui/material';
import * as api from '../../utils/api';

const NewCheckForm = ({ open, onClose, onSave }) => {
    const [formData, setFormData] = useState({});
    const [banks, setBanks] = useState([]);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                // Assuming an endpoint to get banks
                const data = await api.list('/banks/'); 
                setBanks(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error(err);
            }
        };
        if (open) {
            fetchBanks();
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleBankChange = (event, newValue) => {
        setFormData(prev => ({ ...prev, bank: newValue }));
    };

    const handleSave = async () => {
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Error saving check:", error);
            // Optionally, handle error display in the form
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Nuevo Cheque</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField name="order_number" label="Número de Orden" fullWidth onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="amount" label="Monto" type="number" fullWidth onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            options={banks}
                            getOptionLabel={(option) => option.name || ''}
                            onChange={handleBankChange}
                            renderInput={(params) => <TextField {...params} label="Banco" fullWidth />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="issuer" label="Emisor" fullWidth onChange={handleChange} />
                        <FormControlLabel
                            control={<Checkbox name="is_own" onChange={handleChange} />}
                            label="Propio"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="cuit" label="CUIT" fullWidth onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="due_date" label="Vencimiento" type="date" InputLabelProps={{ shrink: true }} fullWidth onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="receiver" label="Receptor" fullWidth onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="received_from" label="Recibido de" fullWidth onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField name="observations" label="Observaciones" multiline rows={3} fullWidth onChange={handleChange} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Agregar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewCheckForm;
