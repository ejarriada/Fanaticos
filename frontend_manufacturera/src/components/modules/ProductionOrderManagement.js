import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import ProductionOrderFormIndumentaria from './ProductionOrderFormIndumentaria';
// import ProductionOrderFormMedias from './ProductionOrderFormMedias'; // Keep for later

const ProductionOrderManagement = () => {
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();
    
    // State for dialogs and flow control
    const [isCreationTypeDialogOpen, setCreationTypeDialogOpen] = useState(false);
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [creationFlow, setCreationFlow] = useState(null); // 'fromSale' or 'internal'

    const fetchProductionOrders = async () => {
        try {
            setLoading(true);
            const data = await api.list('/production-orders/');
            setProductionOrders(Array.isArray(data) ? data : data.results || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las órdenes de producción.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchProductionOrders();
        }
    }, [tenantId]);

    const handleNewOrderClick = () => {
        setSelectedOrder(null);
        setCreationTypeDialogOpen(true);
    };

    const handleEditClick = (order) => {
        // When editing, the flow is determined by the existence of an order note
        const flow = order.order_note ? 'fromSale' : 'internal';
        setCreationFlow(flow);
        setSelectedOrder(order);
        setFormOpen(true);
    };

    const handleSelectCreationType = (flow) => {
        setCreationTypeDialogOpen(false);
        setCreationFlow(flow);
        setFormOpen(true);
    };

    const handleCloseForms = () => {
        setFormOpen(false);
        setSelectedOrder(null);
        setCreationFlow(null);
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
            const errorData = err.response?.data;
            const errorMsg = errorData ? JSON.stringify(errorData) : 'Error al guardar la orden.';
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

    // For now, we only handle Indumentaria form. This can be expanded later.
    const renderForm = () => {
        if (!isFormOpen) return null;
        
        // We can add logic here to switch between Indumentaria and Medias forms if needed
        return (
            <ProductionOrderFormIndumentaria 
                open={isFormOpen} 
                onClose={handleCloseForms} 
                onSave={handleSave} 
                order={selectedOrder}
                creationFlow={creationFlow} // Pass the selected flow to the form
            />
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Órdenes de Producción</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mb: 2 }} onClick={handleNewOrderClick}>
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
                                <TableCell>Tipo</TableCell>
                                <TableCell>Origen</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha Creación</TableCell>
                                <TableCell>Fecha Entrega</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productionOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.id}</TableCell>
                                    <TableCell>{order.op_type}</TableCell>
                                    <TableCell>
                                        {order.order_note 
                                            ? `#${order.order_note?.id} (${order.order_note?.sale?.client?.name || 'N/A'})`
                                            : 'Decisión Interna'
                                        }
                                    </TableCell>
                                    <TableCell>{order.status}</TableCell>
                                    <TableCell>{new Date(order.creation_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {order.estimated_delivery_date 
                                            ? new Date(order.estimated_delivery_date).toLocaleDateString()
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEditClick(order)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(order.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* New Creation Type Selection Dialog */}
            <Dialog open={isCreationTypeDialogOpen} onClose={() => setCreationTypeDialogOpen(false)}>
                <DialogTitle>¿Cómo deseas crear la Orden de Producción?</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                        <Button variant="outlined" onClick={() => handleSelectCreationType('fromSale')}>
                            A partir de una Venta
                        </Button>
                        <Button variant="outlined" onClick={() => handleSelectCreationType('internal')}>
                            Por Decisión Comercial Interna
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreationTypeDialogOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

            {/* Render the correct form */}
            {renderForm()}
        </Box>
    );
};

export default ProductionOrderManagement;