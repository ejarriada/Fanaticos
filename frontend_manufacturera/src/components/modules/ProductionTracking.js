import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';

const ProductionTracking = () => {
    const [selectedProductionOrder, setSelectedProductionOrder] = useState('');
    const [productionOrders, setProductionOrders] = useState([]); // Mock data for now
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);

    // Mock data for production orders
    const mockProductionOrders = [
        { id: 1, client: 'Cliente A', product: 'Camiseta', quantity: 100, estimated_delivery: '2025-10-01', salesperson: 'Vendedor 1', op_type: 'Indumentaria' },
        { id: 2, client: 'Cliente B', product: 'Medias Deportivas', quantity: 200, estimated_delivery: '2025-10-05', salesperson: 'Vendedor 2', op_type: 'Medias' },
    ];

    // Mock data for process flow
    const mockProcessFlow = {
        'Indumentaria': ['Corte', 'Costura', 'Sublimación', 'Estampado', 'Bordado', 'Serigrafía', 'Limpieza/Planchado', 'Empaque'],
        'Medias': ['Tejido', 'Costura', 'Limpieza/Planchado', 'Empaque'],
    };

    useEffect(() => {
        // In a real application, fetch production orders from API
        setProductionOrders(mockProductionOrders);
    }, []);

    const handleOrderChange = (event) => {
        const orderId = event.target.value;
        setSelectedProductionOrder(orderId);
        const data = mockProductionOrders.find(order => order.id === orderId);
        setOrderData(data);
    };

    const handleProcessChange = (process) => {
        // Logic to update current process
        alert(`Proceso actualizado a: ${process}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Seguimiento de Órdenes de Producción</Typography>

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
                            OP #{order.id} - {order.product} ({order.client})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {orderData && (
                <Box sx={{ mt: 3, p: 3, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Typography variant="h6">Detalles de la Orden</Typography>
                    <Typography>Producto: {orderData.product}</Typography>
                    <Typography>Cliente: {orderData.client}</Typography>
                    <Typography>Cantidad: {orderData.quantity}</Typography>
                    <Typography>Fecha Estimada de Entrega: {orderData.estimated_delivery}</Typography>
                    <Typography>Vendedor: {orderData.salesperson}</Typography>
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
