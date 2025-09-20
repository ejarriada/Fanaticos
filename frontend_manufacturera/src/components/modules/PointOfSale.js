import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PointOfSale = () => {
    const { tenantId } = useAuth();
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotationId, setSelectedQuotationId] = useState('');

    const paymentOptions = ['Efectivo', 'Cheque', 'Cuenta Corriente'];

    const initialSaleState = {
        client: '',
        payment_method: '',
        caja_id: '',
        saleItems: [],
        total_amount: 0,
        discount_reason: '',
        discount_amount: 0,
        discount_percentage: 0,
        applied_discount: 0,
        net_total_amount: 0,
    };

    const [newSale, setNewSale] = useState(initialSaleState);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [productsData, clientsData, cajasData, quotationsData] = await Promise.all([
                    api.list('/products/'),
                    api.list('/clients/'),
                    api.list('/cash-registers/'),
                    api.list('/quotations/?status=Pendiente'),
                ]);

                setProducts(Array.isArray(productsData) ? productsData : productsData.results || []);
                setClients(Array.isArray(clientsData) ? clientsData : clientsData.results || []);
                setQuotations(Array.isArray(quotationsData) ? quotationsData : quotationsData.results || []);
                
                const singleCaja = Array.isArray(cajasData) && cajasData.length > 0 ? cajasData[0] : (cajasData.results && cajasData.results.length > 0 ? cajasData.results[0] : null);
                if (singleCaja) {
                    initialSaleState.caja_id = singleCaja.id;
                    setNewSale(prev => ({ ...prev, caja_id: singleCaja.id }));
                }
            } catch (err) {
                setError('Error al cargar los datos. Por favor, intente de nuevo.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (tenantId) {
            fetchInitialData();
        }
    }, [tenantId]);

    useEffect(() => {
        const total = newSale.saleItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setNewSale(prevSale => ({ ...prevSale, total_amount: total }));
    }, [newSale.saleItems]);

    useEffect(() => {
        const netTotal = newSale.total_amount - newSale.applied_discount;
        setNewSale(prevSale => ({ ...prevSale, net_total_amount: netTotal }));
    }, [newSale.total_amount, newSale.applied_discount]);

    const handleQuotationChange = async (e) => {
        const quotationId = e.target.value;
        setSelectedQuotationId(quotationId);

        if (!quotationId) {
            setNewSale(initialSaleState);
            return;
        }

        try {
            setLoading(true);
            const selectedQuot = await api.get('/quotations/', quotationId);
            
            const saleItemsFromQuotation = selectedQuot.items.map(item => ({
                product_id: item.product,
                name: item.product_name,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
            }));

            setNewSale({
                ...initialSaleState,
                client: selectedQuot.client.id,
                saleItems: saleItemsFromQuotation,
                caja_id: newSale.caja_id,
            });
        } catch (err) {
            setError('Error al cargar los datos del presupuesto.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = () => {
        const product = products.find(p => p.id === selectedProduct);
        if (product && quantity > 0) {
            const existingItemIndex = newSale.saleItems.findIndex(item => item.product_id === product.id);
            if (existingItemIndex > -1) {
                const updatedItems = [...newSale.saleItems];
                updatedItems[existingItemIndex].quantity += quantity;
                setNewSale({ ...newSale, saleItems: updatedItems });
            } else {
                const newItem = {
                    product_id: product.id,
                    name: product.name,
                    quantity: quantity,
                    price: parseFloat(product.club_price),
                };
                setNewSale({ ...newSale, saleItems: [...newSale.saleItems, newItem] });
            }
            setSelectedProduct('');
            setQuantity(1);
        }
    };

    const handleUpdateQuantity = (product_id, newQuantity) => {
        const updatedItems = newSale.saleItems.map(item =>
            item.product_id === product_id ? { ...item, quantity: newQuantity } : item
        );
        setNewSale({ ...newSale, saleItems: updatedItems });
    };

    const handleRemoveItem = (product_id) => {
        const updatedItems = newSale.saleItems.filter(item => item.product_id !== product_id);
        setNewSale({ ...newSale, saleItems: updatedItems });
    };

    const handleDiscountAmountChange = (event) => {
        const amount = parseFloat(event.target.value) || 0;
        const percentage = newSale.total_amount > 0 ? (amount / newSale.total_amount) * 100 : 0;
        setNewSale({ ...newSale, discount_amount: amount, discount_percentage: percentage });
    };

    const handleDiscountPercentageChange = (event) => {
        const percentage = parseFloat(event.target.value) || 0;
        const amount = (newSale.total_amount * percentage) / 100;
        setNewSale({ ...newSale, discount_amount: amount, discount_percentage: percentage });
    };

    const handleApplyDiscount = () => {
        setNewSale({ ...newSale, applied_discount: newSale.discount_amount });
    };

    const handleSave = async () => {
        setError(null);

        if (!newSale.client) {
            setError("Debe seleccionar un cliente.");
            return;
        }
        if (newSale.saleItems.length === 0) {
            setError("Debe añadir al menos un producto a la venta.");
            return;
        }
        if (!newSale.payment_method) {
            setError("Debe seleccionar un método de pago.");
            return;
        }

        try {
            const saleToSave = {
                client_id: newSale.client,
                payment_method: newSale.payment_method,
                local: null,
                caja_id: newSale.caja_id,
                items: newSale.saleItems.map(item => ({
                    product: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.price,
                })),
                total_amount: newSale.net_total_amount,
            };

            await api.create('/sales/', saleToSave);
            alert('Venta guardada exitosamente');
            setNewSale(initialSaleState);
            setSelectedQuotationId('');
        } catch (err) {
            setError('Error al guardar la venta. Por favor, intente de nuevo.');
            console.error(err);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box p={3}> 
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <Grid container spacing={3}>
                <Grid xs={12}>
                    <Typography variant="h4">Punto de Venta</Typography>
                </Grid>

                <Grid xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Seleccionar Presupuesto (Opcional)</InputLabel>
                        <Select
                            value={selectedQuotationId}
                            onChange={handleQuotationChange}
                            label="Seleccionar Presupuesto (Opcional)"
                        >
                            <MenuItem value=""><em>Ninguno (Venta Manual)</em></MenuItem>
                            {quotations.map((q) => (
                                <MenuItem key={q.id} value={q.id}>
                                    {q.quotation_id} - {q.client.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid xs={12}>
                    <Typography variant="h6" gutterBottom>Añadir Producto</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Producto</InputLabel>
                                <Select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                >
                                    {products.map((product) => (
                                        <MenuItem key={product.id} value={product.id}>
                                            {product.name} - ${product.club_price}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid xs={12} sm={3}>
                            <TextField
                                label="Cantidad"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                                fullWidth
                            />
                        </Grid>
                        <Grid xs={12} sm={3}>
                            <Button variant="contained" color="primary" onClick={handleAddProduct} fullWidth>
                                Añadir Producto
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid xs={12}>
                    <Typography variant="h6" gutterBottom>Descuento</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={12}>
                            <TextField
                                label="Motivo del Descuento"
                                value={newSale.discount_reason}
                                onChange={(e) => setNewSale({ ...newSale, discount_reason: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid xs={12} sm={4}>
                            <TextField
                                label="Monto a Descontar"
                                type="number"
                                value={newSale.discount_amount}
                                onChange={handleDiscountAmountChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid xs={12} sm={4}>
                            <TextField
                                label="Porcentaje de Descuento"
                                type="number"
                                value={newSale.discount_percentage}
                                onChange={handleDiscountPercentageChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid xs={12} sm={4}>
                            <Button variant="contained" color="secondary" onClick={handleApplyDiscount} fullWidth>
                                Aplicar Descuento
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid xs={12}>
                    <Typography variant="h6" gutterBottom>Productos en Venta</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Precio Unitario</TableCell>
                                    <TableCell>Subtotal</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {newSale.saleItems.map((item) => (
                                    <TableRow key={item.product_id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value, 10) || 1)}
                                                inputProps={{ min: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell>${item.price}</TableCell>
                                        <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleRemoveItem(item.product_id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                <Grid xs={12}>
                    <Typography variant="h6" gutterBottom>Finalizar Venta</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Cliente</InputLabel>
                                <Select
                                    name="client"
                                    value={newSale.client}
                                    onChange={(e) => setNewSale({ ...newSale, client: e.target.value })}
                                >
                                    {clients.map((client) => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Método de Pago</InputLabel>
                                <Select
                                    name="payment_method"
                                    value={newSale.payment_method}
                                    onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                                >
                                    {paymentOptions.map((method) => (
                                        <MenuItem key={method} value={method}>
                                            {method}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <Typography variant="h5">
                                Monto Total: ${newSale.net_total_amount.toFixed(2)}
                            </Typography>
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <Button variant="contained" color="primary" onClick={handleSave} fullWidth>
                                Guardar Venta
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PointOfSale;