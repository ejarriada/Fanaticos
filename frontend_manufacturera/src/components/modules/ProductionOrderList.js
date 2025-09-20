import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import ProductionOrderFormIndumentaria from './ProductionOrderFormIndumentaria';
import ProductionOrderFormMedias from './ProductionOrderFormMedias';

const ProductionOrderList = () => {
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isIndumentariaFormOpen, setIsIndumentariaFormOpen] = useState(false);
    const [isMediasFormOpen, setIsMediasFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [newOrderType, setNewOrderType] = useState('Indumentaria');

    const fetchProductionOrders = async () => {
        try {
            setLoading(true);
            const data = await api.list('/production-orders/');
            setProductionOrders(data.results || data || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las órdenes de producción.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductionOrders();
    }, []);

    const handleOpenForm = (order = null) => {
        setSelectedOrder(order);
        if (order) {
            if (order.op_type === 'Indumentaria') {
                setIsIndumentariaFormOpen(true);
            } else if (order.op_type === 'Medias') {
                setIsMediasFormOpen(true);
            }
        } else {
            setTypeSelectorOpen(true);
        }
    };

    const handleCloseForms = () => {
        setSelectedOrder(null);
        setIsIndumentariaFormOpen(false);
        setIsMediasFormOpen(false);
    };

    const handleStartNewOrder = () => {
        setTypeSelectorOpen(false);
        if (newOrderType === 'Indumentaria') {
            setIsIndumentariaFormOpen(true);
        } else {
            setIsMediasFormOpen(true);
        }
    };

    const handleSave = async (formData) => {
        try {
            if (selectedOrder) {
                await api.update('/production-orders/', selectedOrder.id, formData);
            } else {
                await api.create('/production-orders/', formData);
            }
            fetchProductionOrders();
            handleCloseForms();
        } catch (err) {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar la orden.';
            setError(errorMsg);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de producción?')) {
            try {
                await api.remove('/production-orders/', id);
                fetchProductionOrders();
            } catch (err) {
                setError('Error al eliminar la orden de producción.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Órdenes de Producción</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={() => handleOpenForm()}>
                Nueva Orden de Producción
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nota de Pedido</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Fecha de Entrega</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productionOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell>{order.order_note}</TableCell>
                                    <TableCell>{order.op_type}</TableCell>
                                    <TableCell>{new Date(order.estimated_delivery_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{order.status}</TableCell>
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

            {/* Type Selector Dialog */}
            <Dialog open={typeSelectorOpen} onClose={() => setTypeSelectorOpen(false)}>
                <DialogTitle>Seleccionar Tipo de Orden</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                            value={newOrderType}
                            label="Tipo"
                            onChange={(e) => setNewOrderType(e.target.value)}
                        >
                            <MenuItem value="Indumentaria">Indumentaria</MenuItem>
                            <MenuItem value="Medias">Medias</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTypeSelectorOpen(false)}>Cancelar</Button>
                    <Button onClick={handleStartNewOrder}>Siguiente</Button>
                </DialogActions>
            </Dialog>

            {isIndumentariaFormOpen && 
                <ProductionOrderFormIndumentaria 
                    open={isIndumentariaFormOpen} 
                    onClose={handleCloseForms} 
                    onSave={handleSave} 
                    productionOrder={selectedOrder} 
                />
            }

            {isMediasFormOpen &&
                <ProductionOrderFormMedias
                    open={isMediasFormOpen}
                    onClose={handleCloseForms}
                    onSave={handleSave}
                    productionOrder={selectedOrder}
                />
            }
        </Box>
    );
};

export default ProductionOrderList;
