import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, FormControl,
    InputLabel, Select, MenuItem, Grid, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import QrCodeIcon from '@mui/icons-material/QrCode';
import * as api from '../../utils/api';
import ProductionOrderFormIndumentaria from './ProductionOrderFormIndumentaria';
import ProductionOrderFormMedias from './ProductionOrderFormMedias';
import QrCodeDisplayDialog from './QrCodeDisplayDialog';

const ProductionOrderManagement = () => {
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [opTypeFilter, setOpTypeFilter] = useState('all');
    
    const [isProductTypeDialogOpen, setProductTypeDialogOpen] = useState(false);
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedProductType, setSelectedProductType] = useState('Indumentaria');
    const [selectedCreationFlow, setSelectedCreationFlow] = useState('fromSale');

    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);

    const fetchProductionOrders = async (filter = 'all') => {
        try {
            setLoading(true);
            let endpoint = '/production-orders/';
            if (filter !== 'all') {
                endpoint = `/production-orders/?op_type=${filter}`;
            }
            const data = await api.list(endpoint);
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
        fetchProductionOrders(opTypeFilter);
    }, [opTypeFilter]);

    const handleNewOrderClick = () => {
        setSelectedOrder(null);
        setSelectedProductType('Indumentaria');
        setSelectedCreationFlow('fromSale');
        setProductTypeDialogOpen(true);
    };

    const handleEditClick = (order) => {
        const flow = order.order_note ? 'fromSale' : 'internal';
        setSelectedCreationFlow(flow);
        setSelectedOrder(order);
        setSelectedProductType(order.op_type || 'Indumentaria');
        setFormOpen(true);
    };

    const handleGenerateQrCode = async (order) => {
        try {
            const response = await api.create(`/production-orders/${order.id}/generate_qr_code/`, {});
            setQrCodeData(response.qr_code_data);
            setIsQrDialogOpen(true);
        } catch (err) {
            setError('Error al generar el código QR.');
            console.error(err);
        }
    };

    const handleStartNewOrder = () => {
        setProductTypeDialogOpen(false);
        setFormOpen(true);
    };

    const handleCloseForms = () => {
        setFormOpen(false);
        setProductTypeDialogOpen(false);
        setSelectedOrder(null);
        setSelectedProductType('Indumentaria');
        setSelectedCreationFlow('fromSale');
    };

    const handleSave = async (formData) => {
        try {
            const dataToSend = new FormData();
            if (formData instanceof FormData) {
                for (let [key, value] of formData.entries()) {
                    dataToSend.append(key, value);
                }
            } else {
                Object.keys(formData).forEach(key => {
                    if (typeof formData[key] === 'object' && formData[key] !== null) {
                        dataToSend.append(key, JSON.stringify(formData[key]));
                    } else if (formData[key] !== null && formData[key] !== undefined) {
                        dataToSend.append(key, formData[key]);
                    }
                });
            }
            
            dataToSend.append('op_type', selectedProductType);
            
            if (selectedOrder) {
                await api.update('/production-orders/', selectedOrder.id, dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.create('/production-orders/', dataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            fetchProductionOrders(opTypeFilter);
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
                fetchProductionOrders(opTypeFilter);
            } catch (err) {
                setError('Error al eliminar la orden de producción.');
                console.error(err);
            }
        }
    };

    const renderForm = () => {
        if (!isFormOpen) return null;
        
        if (selectedProductType === 'Indumentaria') {
            return (
                <ProductionOrderFormIndumentaria 
                    open={isFormOpen} 
                    onClose={handleCloseForms} 
                    onSave={handleSave} 
                    order={selectedOrder}
                    creationFlow={selectedCreationFlow}
                />
            );
        } else if (selectedProductType === 'Medias') {
            return (
                <ProductionOrderFormMedias 
                    open={isFormOpen} 
                    onClose={handleCloseForms} 
                    onSave={handleSave} 
                    order={selectedOrder}
                    creationFlow={selectedCreationFlow}
                />
            );
        }
        
        return null;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom component="div">
                    Gestión de Órdenes de Producción
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewOrderClick}>
                    Nueva Orden de Producción
                </Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <ToggleButtonGroup
                    value={opTypeFilter}
                    exclusive
                    onChange={(event, newFilter) => {
                        if (newFilter !== null) {
                            setOpTypeFilter(newFilter);
                        }
                    }}
                    aria-label="Filter by OP Type"
                >
                    <ToggleButton value="all" aria-label="all types">
                        Todos
                    </ToggleButton>
                    <ToggleButton value="Indumentaria" aria-label="apparel">
                        Indumentaria
                    </ToggleButton>
                    <ToggleButton value="Medias" aria-label="socks">
                        Medias
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

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
                                        <IconButton onClick={() => handleGenerateQrCode(order)}><QrCodeIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Product Type and Creation Flow Selection Dialog */}
            <Dialog 
                open={isProductTypeDialogOpen} 
                onClose={() => setProductTypeDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Nueva Orden de Producción</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Producto</InputLabel>
                                <Select
                                    value={selectedProductType}
                                    label="Tipo de Producto"
                                    onChange={(e) => setSelectedProductType(e.target.value)}
                                >
                                    <MenuItem value="Indumentaria">Indumentaria</MenuItem>
                                    <MenuItem value="Medias">Medias</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                ¿Cómo deseas crear la Orden de Producción?
                            </Typography>
                            <Stack spacing={2}>
                                <Button 
                                    variant={selectedCreationFlow === 'fromSale' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCreationFlow('fromSale')}
                                >
                                    A partir de una Venta
                                </Button>
                                <Button 
                                    variant={selectedCreationFlow === 'internal' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedCreationFlow('internal')}
                                >
                                    Por Decisión Comercial Interna
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setProductTypeDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleStartNewOrder} variant="contained">
                        Continuar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Render the correct form */}
            {renderForm()}

            <QrCodeDisplayDialog 
                open={isQrDialogOpen}
                onClose={() => setIsQrDialogOpen(false)}
                qrCodeData={qrCodeData}
                title="Código QR de Orden de Producción"
            />
        </Box>
    );
};

export default ProductionOrderManagement;