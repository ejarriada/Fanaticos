import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// PurchaseOrder Form Dialog Component
const PurchaseOrderForm = ({ open, onClose, onSave, purchaseOrder }) => {
    const [formData, setFormData] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [suppliersError, setSuppliersError] = useState(null);
    const { tenantId } = useAuth();

    const PURCHASE_ORDER_STATUS_CHOICES = [
        { value: 'Pendiente', label: 'Pendiente' },
        { value: 'Recibida', label: 'Recibida' },
        { value: 'Cancelada', label: 'Cancelada' },
    ];

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setLoadingSuppliers(true);
                const data = await api.list('/suppliers/');
                const supplierList = Array.isArray(data) ? data : data.results;
                setSuppliers(supplierList || []);
            } catch (err) {
                setSuppliersError('Error al cargar los proveedores.');
                console.error(err);
            } finally {
                setLoadingSuppliers(false);
            }
        };

        if (tenantId) {
            fetchSuppliers();
        }
    }, [tenantId]);

    useEffect(() => {
        if (purchaseOrder) {
            setFormData({
                ...purchaseOrder,
                order_date: purchaseOrder.order_date ? new Date(purchaseOrder.order_date).toISOString().split('T')[0] : '',
                expected_delivery_date: purchaseOrder.expected_delivery_date ? new Date(purchaseOrder.expected_delivery_date).toISOString().split('T')[0] : '',
                supplier: purchaseOrder.supplier?.id || '',
            });
        } else {
            setFormData({
                supplier: '',
                order_date: new Date().toISOString().split('T')[0],
                expected_delivery_date: '',
                status: 'Pendiente'
            });
        }
    }, [purchaseOrder, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingSuppliers) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (suppliersError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{suppliersError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{purchaseOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="supplier"
                    label="Proveedor"
                    select
                    fullWidth
                    value={formData.supplier || ''}
                    onChange={handleChange}
                >
                    {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="order_date" label="Fecha de Orden" type="date" fullWidth value={formData.order_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="expected_delivery_date" label="Fecha de Entrega Esperada" type="date" fullWidth value={formData.expected_delivery_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                
                <TextField
                    margin="dense"
                    name="status"
                    label="Estado"
                    select
                    fullWidth
                    value={formData.status || ''}
                    onChange={handleChange}
                >
                    {PURCHASE_ORDER_STATUS_CHOICES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main PurchaseOrder Management Component
const PurchaseOrderManagement = () => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
    const { tenantId } = useAuth();

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            const data = await api.list('/purchase-orders/');
            const purchaseOrderList = Array.isArray(data) ? data : data.results;
            setPurchaseOrders(purchaseOrderList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las órdenes de compra. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchPurchaseOrders();
        }
    }, [tenantId]);

    const handleOpenForm = (purchaseOrder = null) => {
        setSelectedPurchaseOrder(purchaseOrder);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedPurchaseOrder(null);
        setIsFormOpen(false);
    };

    const handleSave = async (purchaseOrderData) => {
        try {
            const dataToSend = {
                ...purchaseOrderData,
                supplier: purchaseOrderData.supplier || null,
            };

            if (selectedPurchaseOrder) {
                await api.update('/purchase-orders/', selectedPurchaseOrder.id, dataToSend);
            } else {
                await api.create('/purchase-orders/', dataToSend);
            }
            fetchPurchaseOrders(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la orden de compra.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de compra?')) {
            try {
                await api.remove('/purchase-orders/', id);
                fetchPurchaseOrders(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la orden de compra.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Órdenes de Compra</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Orden de Compra
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Proveedor</TableCell>
                                <TableCell>Fecha de Orden</TableCell>
                                <TableCell>Fecha de Entrega Esperada</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {purchaseOrders.map((purchaseOrder) => (
                                <TableRow key={purchaseOrder.id}>
                                    <TableCell>{purchaseOrder.supplier_name || purchaseOrder.supplier}</TableCell>
                                    <TableCell>{purchaseOrder.order_date}</TableCell>
                                    <TableCell>{purchaseOrder.expected_delivery_date}</TableCell>
                                    <TableCell>{purchaseOrder.status}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(purchaseOrder)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(purchaseOrder.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <PurchaseOrderForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                purchaseOrder={selectedPurchaseOrder} 
            />
        </Box>
    );
};

export default PurchaseOrderManagement;
