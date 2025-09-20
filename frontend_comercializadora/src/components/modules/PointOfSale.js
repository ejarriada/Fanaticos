import React, { useState, useEffect } from 'react';
import { Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PointOfSale = () => {
    const [plantillas, setPlantillas] = useState([]); // Renamed
    const [clients, setClients] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [cajas, setCajas] = useState([]);
    const [selectedCaja, setSelectedCaja] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const [newSale, setNewSale] = useState({
        client: '',
        payment_method: '',
        items: [],
        total_amount: 0,
        discount_reason: '',
        discount_amount: 0,
        discount_percentage: 0,
        applied_discount: 0,
        net_total_amount: 0,
    });
    const [selectedPlantilla, setSelectedPlantilla] = useState(''); // Renamed
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                const currentIp = ipData.ip;
                setIpAddress(currentIp);

                const [plantillasData, clientsData, paymentMethodsData, cajasData] = await Promise.all([ // Renamed
                    api.list('/plantillas/'), // Changed API path
                    api.list('/clients/'),
                    api.list('/payment-method-types/'),
                    api.list('/cash-registers/'),
                ]);

                setPlantillas(plantillasData.results || (Array.isArray(plantillasData) ? plantillasData : [])); // Renamed
                setClients(clientsData.results || (Array.isArray(clientsData) ? clientsData : []));
                setPaymentMethods(paymentMethodsData.results || (Array.isArray(paymentMethodsData) ? paymentMethodsData : []));
                setCajas(cajasData.results || (Array.isArray(cajasData) ? cajasData : []));

                const savedCaja = localStorage.getItem(`caja_${currentIp}`);
                if (savedCaja) {
                    setSelectedCaja(savedCaja);
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
        const total = newSale.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
        setNewSale(prevSale => ({ ...prevSale, total_amount: total }));
    }, [newSale.items]);

    useEffect(() => {
        const netTotal = newSale.total_amount - newSale.applied_discount;
        setNewSale(prevSale => ({ ...prevSale, net_total_amount: netTotal }));
    }, [newSale.total_amount, newSale.applied_discount]);

    const handleCajaChange = (event) => {
        const cajaId = event.target.value;
        setSelectedCaja(cajaId);
        localStorage.setItem(`caja_${ipAddress}`, cajaId);
    };

    const handleAddPlantilla = () => { // Renamed
        const plantilla = plantillas.find(p => p.id === selectedPlantilla); // Renamed
        if (plantilla && quantity > 0 && unitPrice > 0) { // Renamed
            const existingItemIndex = newSale.items.findIndex(item => item.design === plantilla.id); // design is the FK name in the backend
            if (existingItemIndex > -1) {
                const updatedItems = [...newSale.items];
                updatedItems[existingItemIndex].quantity += quantity;
                setNewSale({ ...newSale, items: updatedItems });
            } else {
                const newItem = {
                    design: plantilla.id, // design is the FK name in the backend
                    name: plantilla.name,
                    quantity: quantity,
                    unit_price: unitPrice,
                    cost: 0, 
                };
                setNewSale({ ...newSale, items: [...newSale.items, newItem] });
            }
            setSelectedPlantilla(''); // Renamed
            setQuantity(1);
            setUnitPrice(0);
        }
    };

    const handleUpdateQuantity = (design_id, newQuantity) => {
        const updatedItems = newSale.items.map(item =>
            item.design === design_id ? { ...item, quantity: newQuantity } : item
        );
        setNewSale({ ...newSale, items: updatedItems });
    };

    const handleRemoveItem = (design_id) => {
        const updatedItems = newSale.items.filter(item => item.design !== design_id);
        setNewSale({ ...newSale, items: updatedItems });
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
        if (!newSale.client) {
            setError('Por favor, seleccione un cliente.');
            return;
        }
        if (!newSale.payment_method) {
            setError('Por favor, seleccione un método de pago.');
            return;
        }
        if (newSale.items.length === 0) {
            setError('Por favor, añada al menos una plantilla a la venta.'); // Changed text
            return;
        }

        try {
            const saleToSave = {
                client: newSale.client,
                payment_method: newSale.payment_method,
                local: cajas.find(c => c.id === selectedCaja)?.local,
                total_amount: newSale.net_total_amount,
                items: newSale.items.map(item => ({ 
                    design: item.design, 
                    quantity: item.quantity, 
                    unit_price: item.unit_price,
                    cost: item.cost
                })),
            };

            await api.create('/sales/', saleToSave);
            setError(null);
            setNewSale({
                client: '',
                payment_method: '',
                items: [],
                total_amount: 0,
                discount_reason: '',
                discount_amount: 0,
                discount_percentage: 0,
                applied_discount: 0,
                net_total_amount: 0,
            });
        } catch (err) {
            setError('Error al guardar la venta. Por favor, intente de nuevo.');
            console.error(err);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>;
    }

    return (
        <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
                <h2>Puesto de Venta</h2>
            </Grid>

            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Caja</InputLabel>
                    <Select value={selectedCaja} onChange={handleCajaChange}>
                        {cajas.map((caja) => (
                            <MenuItem key={caja.id} value={caja.id}>{caja.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Añadir Plantilla de Producto</Typography> {/* Changed text */}
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <FormControl fullWidth>
                            <InputLabel>Plantilla de Producto</InputLabel> {/* Changed text */}
                            <Select value={selectedPlantilla} onChange={(e) => setSelectedPlantilla(e.target.value)}> {/* Renamed */}
                                {plantillas.map((plantilla) => ( // Renamed
                                    <MenuItem key={plantilla.id} value={plantilla.id}>{plantilla.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField label="Cantidad" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} fullWidth />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <TextField label="Precio Unitario" type="number" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value))} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button variant="contained" color="primary" onClick={handleAddPlantilla} fullWidth>Añadir</Button> {/* Renamed */}
                    </Grid>
                </Grid>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Descuento</Typography>
                {/* ... Discount section remains the same ... */}
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Items en Venta</Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Plantilla de Producto</TableCell> {/* Changed text */}
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Precio Unitario</TableCell>
                                <TableCell>Subtotal</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {newSale.items.map((item) => (
                                <TableRow key={item.design}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <TextField type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.design, parseInt(e.target.value, 10))} inputProps={{ min: 1 }} />
                                    </TableCell>
                                    <TableCell>${item.unit_price}</TableCell>
                                    <TableCell>${(item.unit_price * item.quantity).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleRemoveItem(item.design)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Finalizar Venta</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Cliente</InputLabel>
                            <Select name="client" value={newSale.client} onChange={(e) => setNewSale({ ...newSale, client: e.target.value })}>
                                {clients.map((client) => (
                                    <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Método de Pago</InputLabel>
                            <Select name="payment_method" value={newSale.payment_method} onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}>
                                {paymentMethods.map((method) => (
                                    <MenuItem key={method.id} value={method.id}>{method.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Monto Total" type="number" value={newSale.net_total_amount.toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Button variant="contained" color="primary" onClick={handleSave} fullWidth>Guardar Venta</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default PointOfSale;
