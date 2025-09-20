import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Typography, TextField, Autocomplete, Grid, Divider, 
    FormControl, InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import NewCheckForm from './NewCheckForm';

const NewPurchaseForm = ({ suppliers, onCancel }) => {
    const [formData, setFormData] = useState({
        supplier: null,
        invoice: '',
        detail: '',
        amount: '',
        paid_amount: '',
        check: '' // Added to main form data
    });
    const [checksList, setChecksList] = useState([]);
    const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);

    const fetchChecks = async () => {
        try {
            const response = await api.list('checks');
            setChecksList(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error fetching checks:", error);
        }
    };

    useEffect(() => {
        fetchChecks();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSupplierChange = (event, newValue) => {
        setFormData({ ...formData, supplier: newValue });
    };

    const handleSaveCheck = async (checkData) => {
        try {
            await api.create('checks', checkData);
            fetchChecks(); // Refresh the list
            setIsCheckDialogOpen(false);
        } catch (error) {
            console.error("Error creating check:", error);
        }
    };

    const handleSubmit = () => {
        console.log("Nueva compra:", formData);
        // TODO: Add logic to save the purchase
        onCancel(); // Go back to the previous tab
    };

    return (
        <>
            <Paper sx={{ p: 3, m: 2 }}>
                <Typography variant="h4" gutterBottom>Nueva Compra a Proveedor</Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6">Detalles de la Compra</Typography>
                        <Autocomplete
                            options={suppliers}
                            getOptionLabel={(option) => option.name || ''}
                            onChange={handleSupplierChange}
                            value={formData.supplier}
                            renderInput={(params) => <TextField {...params} label="Proveedor" margin="dense" fullWidth />}
                        />
                        <TextField margin="dense" name="invoice" label="Factura" fullWidth onChange={handleChange} />
                        <TextField margin="dense" name="detail" label="Detalle" fullWidth onChange={handleChange} />
                        <TextField margin="dense" name="amount" label="Monto $" type="number" fullWidth onChange={handleChange} />
                        <TextField margin="dense" name="paid_amount" label="Monto Pagado $" type="number" fullWidth onChange={handleChange} />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6">Formas de Pago</Typography>
                        <TextField margin="dense" name="payment_amount" label="Monto" type="number" fullWidth />
                        <TextField margin="dense" name="cashbox" label="Caja" fullWidth />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Cheque</InputLabel>
                                <Select
                                    name="check"
                                    value={formData.check}
                                    onChange={handleChange}
                                    label="Cheque"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {checksList.map((check) => (
                                        <MenuItem key={check.id} value={check.id}>
                                            {`#${check.order_number} - ${check.amount}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <IconButton color="primary" onClick={() => setIsCheckDialogOpen(true)}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                        <Button variant="contained" sx={{ mt: 2 }}>Guardar Pago</Button>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onCancel} sx={{ mr: 1 }}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Guardar Compra
                    </Button>
                </Box>
            </Paper>
            <NewCheckForm
                open={isCheckDialogOpen}
                onClose={() => setIsCheckDialogOpen(false)}
                onSave={handleSaveCheck}
            />
        </>
    );
};

export default NewPurchaseForm;