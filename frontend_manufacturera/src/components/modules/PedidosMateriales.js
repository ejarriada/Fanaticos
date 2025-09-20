import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, TextField, Dialog, DialogActions,
    DialogContent, DialogTitle, Checkbox, Autocomplete, CircularProgress, Alert,
    IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const OrderForm = ({ open, onClose, onSave, order }) => {
    const [formData, setFormData] = useState({});
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (order) {
            setFormData(order);
        } else {
            setFormData({
                raw_material_name: '',
                code: '',
                brand: '',
                quantity: '',
                unit_of_measure: 'unidades',
                notes: '',
            });
        }
    }, [order, open]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            api.list('/raw-materials/')
                .then(response => {
                    setRawMaterials(Array.isArray(response) ? response : []);
                })
                .catch(err => console.error("Error fetching raw materials", err))
                .finally(() => setLoading(false));
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAutocompleteChange = (event, newValue) => {
        if (typeof newValue === 'string') {
            setFormData({ ...formData, raw_material_name: newValue });
        } else if (newValue && newValue.inputValue) {
            // Create a new value from the user input
            setFormData({ ...formData, raw_material_name: newValue.inputValue });
        } else {
            setFormData({ ...formData, raw_material_name: newValue ? newValue.name : '' });
        }
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{order ? 'Editar Pedido de Materiales' : 'Nuevo Pedido de Materiales'}</DialogTitle>
            <DialogContent>
                {loading ? <CircularProgress /> : (
                    <>
                        <Autocomplete
                            freeSolo
                            options={rawMaterials}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') {
                                    return option;
                                }
                                if (option.inputValue) {
                                    return option.inputValue;
                                }
                                return option.name;
                            }}
                            onChange={handleAutocompleteChange}
                            renderInput={(params) => (
                                <TextField {...params} margin="dense" label="Materia Prima" fullWidth />
                            )}
                        />
                        <TextField margin="dense" name="code" label="Código" fullWidth onChange={handleChange} value={formData.code} />
                        <TextField margin="dense" name="brand" label="Marca" fullWidth onChange={handleChange} value={formData.brand} />
                        <TextField margin="dense" name="quantity" label="Cantidad" type="number" fullWidth onChange={handleChange} value={formData.quantity} />
                        <TextField margin="dense" name="unit_of_measure" label="Unidad de Medida" fullWidth onChange={handleChange} value={formData.unit_of_measure} />
                        <TextField margin="dense" name="notes" label="Notas" fullWidth multiline rows={3} onChange={handleChange} value={formData.notes} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Checkbox name="is_urgent" checked={formData.is_urgent} onChange={handleChange} />
                            <Typography>Urgente</Typography>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Agregar Pedido</Button>
            </DialogActions>
        </Dialog>
    );
};

const PedidosMateriales = () => {
    const [orders, setOrders] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null); // New state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await api.list('/pedidos-materiales/');
            setOrders(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los pedidos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchOrders();
        }
    }, [tenantId]);

    const handleOpenForm = (order = null) => { // Modified function
        setSelectedOrder(order);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => { // New function
        setSelectedOrder(null);
        setIsFormOpen(false);
    };

    const handleSaveOrder = async (orderData) => {
        try {
            if (selectedOrder) { // Check if editing
                await api.update('/pedidos-materiales/', selectedOrder.id, orderData);
            } else {
                await api.create('/pedidos-materiales/', orderData);
            }
            fetchOrders();
            handleCloseForm(); // Use new close function
        } catch (err) {
            setError('Error al guardar el pedido.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => { // New function
        if (window.confirm('¿Está seguro de que desea eliminar este pedido?')) {
            try {
                await api.remove('/pedidos-materiales/', id);
                fetchOrders();
            } catch (err) {
                setError('Error al eliminar el pedido.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Pedidos de Insumos</Typography>
            <Button variant="contained" onClick={() => setIsFormOpen(true)} sx={{ mb: 2 }}>
                Nuevo Pedido
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Insumo</TableCell>
                                <TableCell>Código</TableCell>
                                <TableCell>Marca</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.raw_material_name}</TableCell>
                                    <TableCell>{order.code}</TableCell>
                                    <TableCell>{order.brand}</TableCell>
                                    <TableCell>{order.quantity}</TableCell>
                                    <TableCell>{order.status}</TableCell>
                                    <TableCell>{new Date(order.request_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{order.user_email}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(order)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(order.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <OrderForm 
                open={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSave={handleSaveOrder} 
            />
        </Box>
    );
};

export default PedidosMateriales;