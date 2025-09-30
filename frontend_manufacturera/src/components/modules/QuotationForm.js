import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, CircularProgress, Alert, MenuItem,
    Select, InputLabel, FormControl, Stack, IconButton, Paper, Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';

const QuotationForm = ({ open, onClose, onSave, quotation }) => {
    const [formData, setFormData] = useState({ client_id: '', date: new Date().toISOString().split('T')[0], details: '', items: [] });
    const [totalAmount, setTotalAmount] = useState(0);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [clientsData, productsData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/products/?is_manufactured=true'), // Fetch only manufactured products
                ]);
                setClients(clientsData?.results || []);
                setProducts(productsData?.results || []);
            } catch (err) {
                setError('Error al cargar dependencias (clientes, productos).');
            } finally {
                setLoading(false);
            }
        };
        fetchDependencies();
    }, []);

    useEffect(() => {
        if (quotation) {
            setFormData({
                ...quotation,
                date: quotation.date ? new Date(quotation.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                client_id: quotation.client?.id || '',
                items: quotation.items.map(item => ({ ...item, product: item.product.id })) || [],
            });
        } else {
            setFormData({ client_id: '', date: new Date().toISOString().split('T')[0], details: '', items: [] });
        }
    }, [quotation, open]);

    useEffect(() => {
        const total = formData.items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            return sum + (quantity * unitPrice);
        }, 0);
        setTotalAmount(total);
    }, [formData.items]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'product') {
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
                newItems[index].unit_price = selectedProduct.club_price || '0.00';
                newItems[index].cost = selectedProduct.cost || '0.00';
            }
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: 1, unit_price: '0.00', cost: '0.00' }] }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({ ...prev, items: formData.items.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async () => {
        setError(null);
        // Validation: Price > Cost for all items
        for (const item of formData.items) {
            if (parseFloat(item.unit_price) <= parseFloat(item.cost)) {
                const productName = products.find(p => p.id === item.product)?.name || 'El producto seleccionado';
                setError(`Error en el artículo "${productName}": El precio de venta ($${item.unit_price}) debe ser mayor que el costo ($${item.cost}).`);
                return;
            }
        }

        const submissionData = { ...formData, total_amount: totalAmount };
        onSave(submissionData);
    };

    if (loading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            
            <Grid container spacing={2}>
                {/* Row 1: Main Fields */}
                <Grid item xs={12} sm={8}>
                    <FormControl fullWidth required>
                        <InputLabel>Cliente</InputLabel>
                        <Select name="client_id" value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} label="Cliente">
                            {clients.map(client => <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField name="date" label="Fecha" type="date" fullWidth value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} required />
                </Grid>

                {/* Row 2: Items Table */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Artículos</Typography>
                    <Stack spacing={2}>
                        {formData.items.map((item, index) => (
                            <Paper key={index} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <FormControl fullWidth sx={{ flex: 4 }}>
                                    <InputLabel>Producto</InputLabel>
                                    <Select value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)} label="Producto" required>
                                        {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name} (Costo: ${p.cost})</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField label="Costo" type="number" sx={{ flex: 2 }} value={item.cost} InputProps={{ readOnly: true }} />
                                <TextField label="Precio Unitario" type="number" sx={{ flex: 2 }} value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} required inputProps={{ step: "0.01" }}/>
                                <TextField label="Cantidad" type="number" sx={{ flex: 2 }} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required inputProps={{ min: "1" }}/>
                                <IconButton onClick={() => removeItem(index)}><DeleteIcon /></IconButton>
                            </Paper>
                        ))}
                    </Stack>
                    <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 2 }}>Añadir Artículo</Button>
                </Grid>

                {/* Row 3: Details and Total */}
                <Grid item xs={12} md={8}>
                     <TextField label="Detalles Adicionales" name="details" multiline rows={4} fullWidth value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} />
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                    <Typography variant="h5">Total: ${totalAmount.toFixed(2)}</Typography>
                </Grid>

                {/* Row 4: Actions */}
                <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button type="submit" variant="contained">Guardar Presupuesto</Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default QuotationForm;