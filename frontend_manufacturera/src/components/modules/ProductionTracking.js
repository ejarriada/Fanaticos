import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import * as api from '../../utils/api';

const ProductionTracking = () => {
    const [selectedProductionOrder, setSelectedProductionOrder] = useState('');
    const [productionOrders, setProductionOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);

    // Mock data for process flow - can be replaced with API data later
    const mockProcessFlow = {
        'Indumentaria': ['Corte', 'Costura', 'Sublimación', 'Estampado', 'Bordado', 'Serigrafía', 'Limpieza/Planchado', 'Empaque'],
        'Medias': ['Tejido', 'Costura', 'Limpieza/Planchado', 'Empaque'],
    };

    useEffect(() => {
        const fetchOrders = async () => {
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
        fetchOrders();
    }, []);

    const handleOrderChange = (event) => {
        const orderId = event.target.value;
        setSelectedProductionOrder(orderId);
        const data = productionOrders.find(order => order.id === orderId);
        setOrderData(data);
    };

    const handleProcessChange = (process) => {
        // Logic to update current process
        alert(`Proceso actualizado a: ${process}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Seguimiento de Órdenes de Producción</Typography>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
                    <InputLabel>Seleccionar Orden de Producción</InputLabel>
                    <Select
                        value={selectedProductionOrder}
                        label="Seleccionar Orden de Producción"
                        onChange={handleOrderChange}
                    >
                        <MenuItem value=""><em>Ninguna</em></MenuItem>
                        {productionOrders.map((order) => (
                            <MenuItem key={order.id} value={order.id}>
                                OP #{order.id} - {order.base_product?.name || 'N/A'} ({order.order_note?.sale?.client?.name || 'Interna'})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {orderData && (
                <Box sx={{ mt: 3, p: 3, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Typography variant="h6">Detalles de la Orden</Typography>
                    <Typography>Producto: {orderData.base_product?.name || 'N/A'}</Typography>
                    <Typography>Cliente: {orderData.order_note?.sale?.client?.name || 'N/A'}</Typography>
                    <Typography>Cantidad Total: {orderData.items?.reduce((acc, item) => acc + item.quantity, 0) || 0}</Typography>
                    <Typography>Fecha Estimada de Entrega: {orderData.estimated_delivery_date ? new Date(orderData.estimated_delivery_date).toLocaleDateString() : 'N/A'}</Typography>
                    <Typography>Vendedor: {orderData.order_note?.sale?.user?.first_name || 'N/A'} {orderData.order_note?.sale?.user?.last_name || ''}</Typography>
                    <Typography>Tipo de OP: {orderData.op_type}</Typography>

                    <Typography variant="h6" sx={{ mt: 3 }}>Proceso Actual</Typography>
                    {mockProcessFlow[orderData.op_type]?.map((process, index) => (
                        <Button
                            key={index}
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                            onClick={() => handleProcessChange(process)}
                        >
                            {process}
                        </Button>
                    ))}

                    <Typography variant="h6" sx={{ mt: 3 }}>QR de Seguimiento</Typography>
                    <Typography>Aquí se mostrará el código QR para el seguimiento.</Typography>
                    {/* Placeholder for QR code image */}
                    <Box sx={{ width: 100, height: 100, bgcolor: 'grey.300', mt: 1 }} />
                </Box>
            )}
        </Box>
    );
};

export default ProductionTracking;
