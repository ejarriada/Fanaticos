import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, CircularProgress, Alert, MenuItem,
    Select, InputLabel, FormControl, Stack, IconButton, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const QuotationForm = ({ open, onClose, onSave, quotation }) => {
    const { tenantId } = useAuth();

    const [formData, setFormData] = useState({ client: '', date: new Date().toISOString().split('T')[0], details: '', items: [] });
    const [selectedClient, setSelectedClient] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]); // Changed from designs to products
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [clientsData, productsData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/products/'), // Changed /plantillas/ to /products/
                ]);
                setClients(Array.isArray(clientsData) ? clientsData : clientsData.results || []);
                setProducts(Array.isArray(productsData) ? productsData : productsData.results || []); // Changed setDesigns to setProducts
            } catch (err) {
                console.error('Error fetching dependencies', err);
                setError('Error al cargar dependencias (clientes, productos).'); // Updated error message
            } finally {
                setLoadingDependencies(false);
            }
        };
        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (quotation) {
            setFormData({
                ...quotation,
                date: quotation.date ? new Date(quotation.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                client: quotation.client?.id || '',
                details: quotation.details || '',
                items: quotation.items || [], // quotation.items should now have 'product' from backend
            });
            const clientDetails = clients.find(c => c.id === (quotation.client?.id || ''));
            setSelectedClient(clientDetails);
        } else {
            setFormData({ client: '', date: new Date().toISOString().split('T')[0], details: '', items: [] });
            setSelectedClient(null);
        }
    }, [quotation, open, clients]);

    useEffect(() => {
        const total = formData.items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            return sum + (quantity * unitPrice);
        }, 0);
        setTotalAmount(total);
    }, [formData.items]);

    const handleClientChange = (e) => {
        const clientId = e.target.value;
        const clientDetails = clients.find(c => c.id === clientId);
        setFormData(prev => ({ ...prev, client: clientId }));
        setSelectedClient(clientDetails);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'product') { // If product is selected, auto-populate unit_price
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
                newItems[index].unit_price = selectedProduct.club_price; // Set unit_price to club_price
            }
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: 1, unit_price: '' }] })); // Changed design to product
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async () => {
        try {
            const submissionData = {
                ...formData,
                total_amount: totalAmount,
                client_id: formData.client || null, // Changed from client to client_id
            };
            delete submissionData.client; // Remove the old client field
            onSave(submissionData);
        } catch (err) {
            setError('Error al guardar la cotización.');
            console.error(err);
        }
    };

    if (loadingDependencies) {
        return <CircularProgress />;
    }

    return (
        <Box>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
                {/* Columna Izquierda: Datos y Cliente */}
                <Box sx={{ p: 1.5, width: '100%', md: { width: '50%' } }}>
                    <Typography variant="h6" gutterBottom>Datos del Presupuesto</Typography>
                    <TextField margin="dense" name="date" label="Fecha" type="date" fullWidth value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} />

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Facturar A</Typography>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Cliente</InputLabel>
                        <Select name="client" value={formData.client} onChange={handleClientChange} label="Cliente">
                            {clients.map(client => (
                                <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {selectedClient && (
                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            <Typography variant="body1">**{selectedClient.name}**</Typography>
                            <Typography variant="body2">{selectedClient.address}</Typography>
                            <Typography variant="body2">{selectedClient.phone}</Typography>
                            <Typography variant="body2">{selectedClient.email}</Typography>
                        </Paper>
                    )}
                </Box>

                {/* Columna Derecha: Detalles y Total */}
                <Box sx={{ p: 1.5, width: '100%', md: { width: '50%' } }}>
                    <Typography variant="h6" gutterBottom>Detalles</Typography>
                    <TextField label="Detalles Adicionales" name="details" multiline rows={4} fullWidth value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} />
                </Box>

                {/* Fila de Artículos */}
                <Box sx={{ p: 1.5, width: '100%' }}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Artículos</Typography>
                    <Stack spacing={2}>
                        {formData.items.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControl fullWidth sx={{ flex: 5 }}>
                                    <InputLabel>Artículo (Producto)</InputLabel> // Changed label
                                    <Select value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)} label="Artículo (Producto)"> // Changed item.design to item.product, and design to product
                                        {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)} // Changed designs to products, and d to p
                                    </Select>
                                </FormControl>
                                <TextField label="Cantidad" type="number" sx={{ flex: 3 }} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                <TextField label="Importe $" type="number" sx={{ flex: 3 }} value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} />
                                <IconButton onClick={() => removeItem(index)} sx={{ flex: 1 }}><DeleteIcon /></IconButton>
                            </Box>
                        ))}
                    </Stack>
                    <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 1 }}>Añadir Artículo</Button>
                </Box>
                
                <Box sx={{ p: 1.5, width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                     <TextField
                        label="Total $"
                        type="number"
                        value={totalAmount.toFixed(2)}
                        InputProps={{ readOnly: true }}
                        sx={{ mt: 2, width: '200px' }}
                    />
                </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onClose} sx={{ mr: 1 }}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained">Guardar Presupuesto</Button>
            </Box>
        </Box>
    );
};

export default QuotationForm;
