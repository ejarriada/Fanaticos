import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Autocomplete, Paper, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import NewCheckForm from './NewCheckForm';

const PagosProveedor = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [cashboxes, setCashboxes] = useState([]);
    const [checks, setChecks] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isCheckFormOpen, setIsCheckFormOpen] = useState(false);
    const [refreshChecks, setRefreshChecks] = useState(false);
    const [selectedCheckId, setSelectedCheckId] = useState('');

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await api.list('/suppliers/');
                setSuppliers(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error(err);
            }
        };

        const fetchCashboxes = async () => {
            try {
                const data = await api.list('/cash-registers/'); 
                setCashboxes(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error(err);
            }
        };
        
        fetchSuppliers();
        fetchCashboxes();
    }, []);

    useEffect(() => {
        const fetchChecks = async () => {
            try {
                const data = await api.list('/checks/'); 
                setChecks(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchChecks();
    }, [refreshChecks]);

    const handleAddPayment = () => {
        console.log('Adding payment from cashbox...');
    };

    const handleSaveCheck = async (checkData) => {
        try {
            await api.create('/checks/', checkData);
            setRefreshChecks(prev => !prev); // Trigger refresh
            setIsCheckFormOpen(false);
        } catch (error) {
            console.error("Failed to save check", error);
        }
    };

    const handleAddCheckPayment = () => {
        console.log('Paying with selected check:', selectedCheckId);
        // TODO: Implement payment logic with the selected check
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Pagos a Proveedores</Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6">Seleccionar Proveedor</Typography>
                    <Autocomplete
                        options={suppliers}
                        getOptionLabel={(option) => option.name || ''}
                        onChange={(event, newValue) => {
                            setSelectedSupplier(newValue);
                        }}
                        renderInput={(params) => <TextField {...params} label="Proveedor" margin="dense" fullWidth />}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6">Pagos desde Caja</Typography>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Caja</InputLabel>
                            <Select label="Caja">
                                {cashboxes.map((cashbox) => (
                                    <MenuItem key={cashbox.id} value={cashbox.id}>
                                        {cashbox.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField margin="dense" name="amount" label="Monto $" type="number" fullWidth />
                        <TextField margin="dense" name="detail" label="Detalle" fullWidth />
                        <Button variant="contained" onClick={handleAddPayment} sx={{ mt: 2 }}>
                            Agregar Pago desde Caja
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6">Pago con Cheques</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Seleccionar Cheque</InputLabel>
                                <Select
                                    value={selectedCheckId}
                                    onChange={(e) => setSelectedCheckId(e.target.value)}
                                    label="Seleccionar Cheque"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {checks.map((check) => (
                                        <MenuItem key={check.id} value={check.id}>
                                            {`#${check.order_number} - ${check.amount}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <IconButton color="primary" onClick={() => setIsCheckFormOpen(true)}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                        <Button variant="contained" color="primary" onClick={handleAddCheckPayment} sx={{ mt: 2 }}>
                            Agregar Pago con Cheque
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h6" sx={{mt: 3}}>Historial de Pagos</Typography>
                    <Typography>Aquí se mostrará una lista de los pagos realizados.</Typography>
                </Grid>
            </Grid>

            <NewCheckForm 
                open={isCheckFormOpen} 
                onClose={() => setIsCheckFormOpen(false)} 
                onSave={handleSaveCheck} 
            />
        </Box>
    );
};

export default PagosProveedor;
