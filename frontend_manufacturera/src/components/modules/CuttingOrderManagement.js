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

// CuttingOrder Form Dialog Component
const CuttingOrderForm = ({ open, onClose, onSave, cuttingOrder }) => {
    const [formData, setFormData] = useState({});
    const [rawMaterials, setRawMaterials] = useState([]);
    const [productionOrders, setProductionOrders] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [rawMaterialsData, productionOrdersData] = await Promise.all([
                    api.list('/raw-materials/'),
                    api.list('/production-orders/'),
                ]);
                setRawMaterials(Array.isArray(rawMaterialsData) ? rawMaterialsData : rawMaterialsData.results || []);
                setProductionOrders(Array.isArray(productionOrdersData) ? productionOrdersData : productionOrdersData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (materia prima, órdenes de producción).');
                console.error(err);
            } finally {
                setLoadingDependencies(false);
            }
        };

        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (cuttingOrder) {
            setFormData({
                ...cuttingOrder,
                date: cuttingOrder.date ? new Date(cuttingOrder.date).toISOString().split('T')[0] : '',
                fabric_used: cuttingOrder.fabric_used?.id || '',
                production_orders: cuttingOrder.production_orders ? cuttingOrder.production_orders.map(po => po.id) : [],
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                fabric_used: '',
                quantity_cut: '',
                production_orders: [],
            });
        }
    }, [cuttingOrder, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMultiSelectChange = (e) => {
        const { value } = e.target;
        setFormData({ ...formData, production_orders: typeof value === 'string' ? value.split(',') : value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (dependenciesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{dependenciesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{cuttingOrder ? 'Editar Orden de Corte' : 'Nueva Orden de Corte'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="date" label="Fecha" type="date" fullWidth value={formData.date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                
                <TextField
                    margin="dense"
                    name="fabric_used"
                    label="Tela Utilizada"
                    select
                    fullWidth
                    value={formData.fabric_used || ''}
                    onChange={handleChange}
                >
                    {rawMaterials.map((rm) => (
                        <MenuItem key={rm.id} value={rm.id}>
                            {rm.name} (Lote: {rm.batch_number})
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="quantity_cut" label="Cantidad Cortada" type="number" fullWidth value={formData.quantity_cut || ''} onChange={handleChange} />
                
                <TextField
                    margin="dense"
                    name="production_orders"
                    label="Órdenes de Producción"
                    select
                    SelectProps={{
                        multiple: true,
                        value: formData.production_orders || [],
                        onChange: handleMultiSelectChange,
                    }}
                    fullWidth
                >
                    {productionOrders.map((po) => (
                        <MenuItem key={po.id} value={po.id}>
                            OP #{po.id} ({po.product_design_name || po.product_design}) - {po.quantity}
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

// Main CuttingOrder Management Component
const CuttingOrderManagement = () => {
    const [cuttingOrders, setCuttingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCuttingOrder, setSelectedCuttingOrder] = useState(null);
    const { tenantId } = useAuth();

    const fetchCuttingOrders = async () => {
        try {
            setLoading(true);
            const data = await api.list('/cutting-orders/');
            const cuttingOrderList = Array.isArray(data) ? data : data.results;
            setCuttingOrders(cuttingOrderList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las órdenes de corte. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchCuttingOrders();
        }
    }, [tenantId]);

    const handleOpenForm = (cuttingOrder = null) => {
        setSelectedCuttingOrder(cuttingOrder);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedCuttingOrder(null);
        setIsFormOpen(false);
    };

    const handleSave = async (cuttingOrderData) => {
        try {
            const dataToSend = {
                ...cuttingOrderData,
                fabric_used: cuttingOrderData.fabric_used || null,
                production_orders: cuttingOrderData.production_orders || [],
            };

            if (selectedCuttingOrder) {
                await api.update('/cutting-orders/', selectedCuttingOrder.id, dataToSend);
            } else {
                await api.create('/cutting-orders/', dataToSend);
            }
            fetchCuttingOrders(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la orden de corte.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de corte?')) {
            try {
                await api.remove('/cutting-orders/', id);
                fetchCuttingOrders(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la orden de corte.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Órdenes de Corte</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Orden de Corte
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Tela Utilizada</TableCell>
                                <TableCell>Cantidad Cortada</TableCell>
                                <TableCell>Órdenes de Producción</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cuttingOrders.map((co) => (
                                <TableRow key={co.id}>
                                    <TableCell>{co.date}</TableCell>
                                    <TableCell>{co.fabric_used_name || co.fabric_used}</TableCell>
                                    <TableCell>{co.quantity_cut}</TableCell>
                                    <TableCell>{co.production_orders.map(po => `OP#${po.id}`).join(', ')}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(co)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(co.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <CuttingOrderForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                cuttingOrder={selectedCuttingOrder} 
            />
        </Box>
    );
};

export default CuttingOrderManagement;
