import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    MenuItem, FormControl, InputLabel, Select, Grid
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CommercialSaleForm = ({ open, onClose, onSave, sale }) => {
    const [formData, setFormData] = useState({});
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [commercialProducts, setCommercialProducts] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [clientsData, usersData, warehousesData, commercialProductsData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/users/'),
                    api.list('/warehouses/'),
                    api.list('commercial/commercial-products/'),
                ]);
                setClients(Array.isArray(clientsData) ? clientsData : clientsData.results || []);
                setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
                setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.results || []);
                setCommercialProducts(Array.isArray(commercialProductsData) ? commercialProductsData : commercialProductsData.results || []);
            } catch (err) {
                console.error('Error fetching dependencies', err);
            } finally {
                setLoadingDependencies(false);
            }
        };
        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (sale) {
            setFormData({
                ...sale,
                client: sale.client?.id || '',
                user: sale.user?.id || '',
                warehouse: sale.warehouse?.id || '',
                items: sale.items.map(item => ({
                    commercial_product: item.commercial_product?.id || '',
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || '',
                })) || [],
            });
        } else {
            setFormData({
                client: '',
                user: '',
                warehouse: '',
                status: 'pending',
                items: [],
            });
        }
    }, [sale, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { commercial_product: '', quantity: 1, unit_price: '' }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = () => {
        const submissionData = {
            ...formData,
            client: formData.client || null,
            user: formData.user || null,
            warehouse: formData.warehouse || null,
            items: formData.items.map(item => ({
                commercial_product: item.commercial_product,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })),
        };
        onSave(submissionData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent>Cargando clientes, usuarios, almacenes y productos comerciales...</DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{sale ? 'Editar Venta Comercial' : 'Nueva Venta Comercial'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Cliente</InputLabel>
                            <Select name="client" value={formData.client || ''} onChange={handleChange} label="Cliente">
                                {clients.map(client => (
                                    <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Usuario</InputLabel>
                            <Select name="user" value={formData.user || ''} onChange={handleChange} label="Usuario">
                                {users.map(user => (
                                    <MenuItem key={user.id} value={user.id}>{user.email}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Almacén</InputLabel>
                            <Select name="warehouse" value={formData.warehouse || ''} onChange={handleChange} label="Almacén">
                                {warehouses.map(warehouse => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Estado</InputLabel>
                            <Select name="status" value={formData.status || 'pending'} onChange={handleChange} label="Estado">
                                <MenuItem value="pending">Pendiente</MenuItem>
                                <MenuItem value="completed">Completada</MenuItem>
                                <MenuItem value="cancelled">Cancelada</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Typography sx={{ mt: 2, mb: 1 }}>Items de Venta</Typography>
                <Stack spacing={2}>
                    {formData.items.map((item, index) => (
                        <Grid container spacing={2} key={index} alignItems="center">
                            <Grid item xs={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Producto Comercial</InputLabel>
                                    <Select value={item.commercial_product} onChange={(e) => handleItemChange(index, 'commercial_product', e.target.value)} label="Producto Comercial">
                                        {commercialProducts.map(product => <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <TextField label="Cantidad" type="number" fullWidth value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                            </Grid>
                            <Grid item xs={3}>
                                <TextField label="Precio Unitario" type="number" fullWidth value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} />
                            </Grid>
                            <Grid item xs={1}>
                                <IconButton onClick={() => removeItem(index)}><DeleteIcon /></IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </Stack>
                <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 1 }}>Añadir Item</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommercialSaleForm;
