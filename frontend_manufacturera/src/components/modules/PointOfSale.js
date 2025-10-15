import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl, CircularProgress, 
            Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
            Typography, Box, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useFinancialCost } from '../../hooks/useFinancialCost'; // Importar el hook
import ChequeDialog from '../common/ChequeDialog'; // Importar el componente reutilizable

const PointOfSale = () => {
    const { tenantId } = useAuth();
    const location = useLocation();
    const { calculateFinancialCost } = useFinancialCost(); // Instanciar el hook
    const [financialCost, setFinancialCost] = useState(0);
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotationId, setSelectedQuotationId] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [banks, setBanks] = useState([]);
    const [showChequeDialog, setShowChequeDialog] = useState(false);
    const [chequeData, setChequeData] = useState(null);

    const initialSaleState = {
        client: '',
        payment_method: '',
        bank_id: '',
        caja_id: '',
        check_id: null,
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
                const [productsData, clientsData, cajasData, quotationsData, paymentMethodsData, banksData] = await Promise.all([
                    api.list('/products/'),
                    api.list('/clients/'),
                    api.list('/cash-registers/'),
                    api.list('/quotations/?status=Pendiente'),
                    api.list('/payment-method-types/'),
                    api.list('/banks/'),
                ]);

                setProducts(Array.isArray(productsData) ? productsData : productsData.results || []);
                setClients(Array.isArray(clientsData) ? clientsData : clientsData.results || []);
                setQuotations(Array.isArray(quotationsData) ? quotationsData : quotationsData.results || []);
                setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : paymentMethodsData.results || []);
                setBanks(Array.isArray(banksData) ? banksData : banksData.results || []);

                const singleCaja = Array.isArray(cajasData) && cajasData.length > 0 ? cajasData[0] : (cajasData.results && cajasData.results.length > 0 ? cajasData.results[0] : null);
                if (singleCaja) {
                    initialSaleState.caja_id = singleCaja.id;
                    setNewSale(prev => ({ ...prev, caja_id: singleCaja.id }));
                }

                // Auto-cargar cotización si viene desde el listado
                if (location.state?.quotationId && location.state?.autoLoad) {
                    const quotationId = location.state.quotationId;
                    setSelectedQuotationId(quotationId);
                    
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
                        caja_id: singleCaja?.id || '',
                    });

                    // Limpiar el state para que no se recargue al refrescar la página
                    window.history.replaceState({}, document.title);
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
    }, [tenantId, location.state]);

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


    const handleSaveCheque = async (chequeToSave) => {
        try {
            const savedCheque = await api.create('/checks/', chequeToSave);
            setChequeData(savedCheque);
            setNewSale({ ...newSale, check_id: savedCheque.id });
            setShowChequeDialog(false);
        } catch (error) {
            console.error("Error saving cheque", error);
            alert(error.response?.data?.error || "Error al guardar el cheque");
        }
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

        if (newSale.payment_method !== 1 && !newSale.bank_id) {
            setError("Debe seleccionar un banco para este método de pago.");
            return;
        }

        try {
            const saleToSave = {
                client_id: newSale.client,
                payment_method: newSale.payment_method,
                bank_id: newSale.bank_id || null,
                check_id: chequeData ? chequeData.id : null,
                local: null,
                caja_id: newSale.caja_id,
                items: newSale.saleItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.price,
                })),
                total_amount: newSale.net_total_amount,
            };

            // El backend se encarga de crear la transacción financiera correspondiente
            // y vincularla con esta venta para asegurar la trazabilidad.
            await api.create('/sales/', saleToSave);
            alert('Venta guardada exitosamente');
            setChequeData(null); // Limpiar el cheque guardado
            setNewSale(initialSaleState);
            setSelectedQuotationId('');
        } catch (err) {
            setError('Error al guardar la venta. Por favor, intente de nuevo.');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, margin: '0 auto', p: 3 }}> 
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Punto de Venta
            </Typography>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* SECCIÓN: Presupuesto */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 3, pb: 1.5, borderBottom: '2px solid #1976d2' }}>
                    Cargar desde Presupuesto (Opcional)
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>Seleccionar Presupuesto</InputLabel>
                    <Select
                        value={selectedQuotationId}
                        onChange={handleQuotationChange}
                        label="Seleccionar Presupuesto"
                    >
                        <MenuItem value=""><em>Ninguno (Venta Manual)</em></MenuItem>
                        {quotations.map((q) => (
                            <MenuItem key={q.id} value={q.id}>
                                {q.quotation_id} - {q.client.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* SECCIÓN: Agregar Producto */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 3, pb: 1.5, borderBottom: '2px solid #1976d2' }}>
                    Añadir Producto
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} md={6}> {/* Cambié de 5 a 6 */}
                        <FormControl fullWidth sx={{ minWidth: 300 }}> {/* NUEVO: ancho mínimo */}
                            <InputLabel>Producto</InputLabel>
                            <Select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                label="Producto"
                            >
                                {products.map((product) => (
                                    <MenuItem key={product.id} value={product.id}>
                                        {product.name} - ${product.club_price}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}> {/* Cambié de 3 a 2 */}
                        <TextField
                            label="Cantidad"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                            fullWidth
                            inputProps={{ min: 1 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}> {/* Se mantiene en 4 */}
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleAddProduct} 
                            fullWidth
                            sx={{ height: '56px' }}
                        >
                            Añadir Producto
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* SECCIÓN: Descuento */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 3, pb: 1.5, borderBottom: '2px solid #1976d2' }}>
                    Descuento
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            label="Motivo del Descuento"
                            value={newSale.discount_reason}
                            onChange={(e) => setNewSale({ ...newSale, discount_reason: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Monto a Descontar"
                            type="number"
                            value={newSale.discount_amount}
                            onChange={handleDiscountAmountChange}
                            fullWidth
                            InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>$</span> }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Porcentaje"
                            type="number"
                            value={newSale.discount_percentage.toFixed(2)}
                            onChange={handleDiscountPercentageChange}
                            fullWidth
                            InputProps={{ endAdornment: <span style={{ marginLeft: 4 }}>%</span> }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            onClick={handleApplyDiscount} 
                            fullWidth
                            sx={{ height: '56px' }}
                        >
                            Aplicar Descuento
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* SECCIÓN: Productos en Venta */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 3, pb: 1.5, borderBottom: '2px solid #1976d2' }}>
                    Productos en Venta
                </Typography>
                {newSale.saleItems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No hay productos agregados. Añade productos desde la sección superior.
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Producto</strong></TableCell>
                                    <TableCell><strong>Cantidad</strong></TableCell>
                                    <TableCell><strong>Precio Unit.</strong></TableCell>
                                    <TableCell><strong>Subtotal</strong></TableCell>
                                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {newSale.saleItems.map((item) => (
                                    <TableRow key={item.product_id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell sx={{ width: '150px' }}>
                                            <TextField
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value, 10) || 1)}
                                                inputProps={{ min: 1 }}
                                                size="small"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>${item.price.toFixed(2)}</TableCell>
                                        <TableCell><strong>${(item.price * item.quantity).toFixed(2)}</strong></TableCell>
                                        <TableCell align="center">
                                            <IconButton 
                                                onClick={() => handleRemoveItem(item.product_id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* SECCIÓN: Finalizar Venta */}
            <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 3, pb: 1.5, borderBottom: '2px solid #1976d2' }}>
                    Finalizar Venta
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                        <FormControl fullWidth sx={{ minWidth: 250 }}>
                            <InputLabel>Cliente *</InputLabel>
                            <Select
                                name="client"
                                value={newSale.client}
                                onChange={(e) => setNewSale({ ...newSale, client: e.target.value })}
                                label="Cliente *"
                            >
                                {clients.map((client) => (
                                    <MenuItem key={client.id} value={client.id}>
                                        {client.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth sx={{ minWidth: 200 }}>
                            <InputLabel>Método de Pago *</InputLabel>
                            <Select
                                name="payment_method"
                                value={newSale.payment_method}
                                onChange={async (e) => {
                                    const methodId = e.target.value;
                                    const method = paymentMethods.find(m => m.id === methodId);

                                    // Calcular costo financiero
                                    const cost = await calculateFinancialCost(methodId, newSale.bank_id, newSale.net_total_amount);
                                    setFinancialCost(cost);

                                    setNewSale({ ...newSale, payment_method: methodId, bank_id: '' });
                                    
                                    if (method && method.name.toLowerCase() === 'cheque') {
                                        setShowChequeDialog(true);
                                    }
                                }}
                                label="Método de Pago *"
                            >
                                {paymentMethods.map((method) => (
                                    <MenuItem key={method.id} value={method.id}>
                                        {method.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {newSale.payment_method && newSale.payment_method !== 1 && (
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth sx={{ minWidth: 200 }}>
                                <InputLabel>Banco *</InputLabel>
                                <Select
                                    name="bank_id"
                                    value={newSale.bank_id}
                                    onChange={async (e) => {
                                        const bankId = e.target.value;
                                        const cost = await calculateFinancialCost(newSale.payment_method, bankId, newSale.net_total_amount);
                                        setFinancialCost(cost);
                                        setNewSale({ ...newSale, bank_id: bankId });
                                    }}
                                    label="Banco *"
                                >
                                    {banks.map((bank) => (
                                        <MenuItem key={bank.id} value={bank.id}>
                                            {bank.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {financialCost > 0 && (
                        <Grid item xs={12}>
                            <Alert severity="warning">Costo financiero: ${financialCost.toFixed(2)}</Alert>
                        </Grid>
                    )}
                    
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                    </Grid>

                    {newSale.payment_method && paymentMethods.find(m => m.id === newSale.payment_method)?.name.toLowerCase() === 'cheque' && (
                        <Grid item xs={12}>
                            {chequeData ? (
                                <Alert severity="success" sx={{ fontWeight: 500 }}>
                                    ✓ <strong>Cheque cargado:</strong> N° {chequeData.number} - ${parseFloat(chequeData.amount).toFixed(2)}
                                    <br />
                                    <strong>Banco:</strong> {banks.find(b => b.id === chequeData.bank)?.name || 'N/A'} | 
                                    <strong> Emisor:</strong> {chequeData.issuer} | 
                                    <strong> Vencimiento:</strong> {chequeData.due_date}
                                    <Button 
                                        size="small" 
                                        onClick={() => setShowChequeDialog(true)}
                                        sx={{ ml: 2 }}
                                    >
                                        Editar Cheque
                                    </Button>
                                </Alert>
                            ) : (
                                <Alert severity="warning">
                                    ⚠️ Debe cargar los datos del cheque
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        onClick={() => setShowChequeDialog(true)}
                                        sx={{ ml: 2 }}
                                    >
                                        Cargar Cheque
                                    </Button>
                                </Alert>
                            )}
                        </Grid>
                    )}

                    <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: { xs: 'center', pt: 1 } }}>
                            <Typography variant="body2" color="text.secondary">
                                Total:
                            </Typography>
                            <Typography variant="h4">
                                ${newSale.total_amount.toFixed(2)}
                            </Typography>
                            {newSale.applied_discount > 0 && (
                                <>
                                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                        Descuento aplicado: -${newSale.applied_discount.toFixed(2)}
                                    </Typography>
                                    <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                                        Total Final: ${newSale.net_total_amount.toFixed(2)}
                                    </Typography>
                                </>
                            )}
                            {newSale.applied_discount === 0 && (
                                <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                                    Total: ${newSale.net_total_amount.toFixed(2)}
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Button 
                            variant="contained" 
                            color="success" 
                            onClick={handleSave} 
                            fullWidth
                            size="large"
                            sx={{ height: '60px', fontSize: '1.1rem' }}
                        >
                            Guardar Venta
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* DIÁLOGO DE CHEQUE REUTILIZABLE */}
            <ChequeDialog
                open={showChequeDialog}
                onClose={() => setShowChequeDialog(false)}
                onSave={handleSaveCheque}
                cheque={chequeData}
                prefilledAmount={newSale.net_total_amount}
            />

        </Box>
    );
};

export default PointOfSale;