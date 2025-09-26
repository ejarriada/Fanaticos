import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Typography, TextField, Autocomplete, Grid, IconButton, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';

const NewPurchaseForm = ({ suppliers, onCancel, onSaveSuccess, order }) => {
    const [supplier, setSupplier] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ raw_material: null, quantity: '', unit_price: '' }]);
    const [availableRawMaterials, setAvailableRawMaterials] = useState([]);
    const [status, setStatus] = useState('Pendiente'); // New state for status
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRawMaterials = async () => {
            try {
                const data = await api.list('/raw-materials/');
                setAvailableRawMaterials(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error("Error fetching raw materials", err);
                setError('No se pudieron cargar las materias primas.');
            }
        };
        fetchRawMaterials();
    }, []);

    useEffect(() => {
        if (order) {
            setSupplier(suppliers.find(s => s.id === order.supplier) || null);
            setInvoiceNumber(order.invoice_number || ''); // Assuming invoice_number field exists in order
            setExpectedDeliveryDate(order.expected_delivery_date || new Date().toISOString().split('T')[0]);
            setItems(order.items.map(item => ({
                raw_material: availableRawMaterials.find(rm => rm.id === item.raw_material) || null,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })));
            setStatus(order.status || 'Pendiente');
        } else {
            setSupplier(null);
            setInvoiceNumber('');
            setExpectedDeliveryDate(new Date().toISOString().split('T')[0]);
            setItems([{ raw_material: null, quantity: '', unit_price: '' }]);
            setStatus('Pendiente');
        }
    }, [order, suppliers, availableRawMaterials]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { raw_material: null, quantity: '', unit_price: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return total + (quantity * price);
        }, 0).toFixed(2);
    };

    const handleSubmit = async () => {
        if (!supplier || items.some(item => !item.raw_material || !item.quantity || !item.unit_price)) {
            setError('Por favor, complete todos los campos requeridos: Proveedor y todos los detalles de los items.');
            return;
        }

        const purchaseOrderData = {
            supplier: supplier.id,
            invoice_number: invoiceNumber, // Include invoice number
            expected_delivery_date: expectedDeliveryDate,
            status: status, 
            items: items.map(item => ({
                raw_material: item.raw_material.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })),
        };

        try {
            if (order) {
                await api.update('/purchase-orders/', order.id, purchaseOrderData);
            } else {
                await api.create('/purchase-orders/', purchaseOrderData);
            }
            onSaveSuccess(); // Callback to parent to handle success
        } catch (err) {
            console.error("Error creating purchase order", err.response?.data || err.message);
            setError('Error al guardar la orden de compra. Verifique los datos.');
        }
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h4" gutterBottom>{order ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Autocomplete
                        options={suppliers}
                        getOptionLabel={(option) => option.name || ''}
                        onChange={(e, newValue) => setSupplier(newValue)}
                        value={supplier}
                        renderInput={(params) => <TextField {...params} label="Proveedor" fullWidth />}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField 
                        name="invoiceNumber" 
                        label="Número de Factura (Opcional)" 
                        fullWidth 
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        name="expectedDeliveryDate"
                        label="Fecha de Entrega Estimada"
                        type="date"
                        fullWidth
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Estado</InputLabel>
                        <Select
                            name="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            label="Estado"
                        >
                            <MenuItem value="Pendiente">Pendiente</MenuItem>
                            <MenuItem value="Comprada por Pagar">Comprada por Pagar</MenuItem>
                            <MenuItem value="Pagada">Pagada</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Items de la Compra</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Materia Prima</TableCell>
                            <TableCell>Cantidad</TableCell>
                            <TableCell>Precio Unitario</TableCell>
                            <TableCell>Subtotal</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ minWidth: 300 }}>
                                    <Autocomplete
                                        options={availableRawMaterials}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={item.raw_material}
                                        onChange={(e, newValue) => handleItemChange(index, 'raw_material', newValue)}
                                        renderInput={(params) => <TextField {...params} label="Materia Prima" />}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField 
                                        type="number" 
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField 
                                        type="number" 
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleRemoveItem(index)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Button startIcon={<AddIcon />} onClick={handleAddItem} sx={{ mt: 2 }}>
                Añadir Item
            </Button>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="h5">Total: ${calculateTotal()}</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} sx={{ mr: 1 }}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} variant="contained">
                    {order ? 'Guardar Cambios' : 'Guardar Orden de Compra'}
                </Button>
            </Box>
        </Paper>
    );
};

export default NewPurchaseForm;
