import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Autocomplete, Paper, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import NewCheckForm from './NewCheckForm';

const PagosProveedor = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [cashboxes, setCashboxes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [paymentMethodTypes, setPaymentMethodTypes] = useState([]);
    const [checks, setChecks] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]); // Orders for selected supplier
    const [paymentHistory, setPaymentHistory] = useState([]); // Payments for selected PO

    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDetail, setPaymentDetail] = useState('');
    const [selectedCashbox, setSelectedCashbox] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState('');
    const [selectedCheckId, setSelectedCheckId] = useState('');

    const [isCheckFormOpen, setIsCheckFormOpen] = useState(false);
    const [refreshChecks, setRefreshChecks] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch initial data: Suppliers, Cashboxes, Accounts, Payment Methods
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [suppliersData, cashboxesData, accountsData, paymentMethodsData] = await Promise.all([
                    api.list('/suppliers/'),
                    api.list('/cash-registers/'),
                    api.list('/accounts/'),
                    api.list('/payment-method-types/'),
                ]);
                setSuppliers(suppliersData.results || (Array.isArray(suppliersData) ? suppliersData : []));
                setCashboxes(cashboxesData.results || (Array.isArray(cashboxesData) ? cashboxesData : []));
                setAccounts(accountsData.results || (Array.isArray(accountsData) ? accountsData : []));
                setPaymentMethodTypes(paymentMethodsData.results || (Array.isArray(paymentMethodsData) ? paymentMethodsData : []));
            } catch (err) {
                console.error("Error fetching initial data", err);
                setError('Error al cargar datos iniciales.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch checks
    useEffect(() => {
        const fetchChecks = async () => {
            try {
                const data = await api.list('/checks/'); 
                setChecks(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchChecks();
    }, [refreshChecks]);

    // Fetch Purchase Orders for selected supplier
    useEffect(() => {
        const fetchPurchaseOrders = async () => {
            if (selectedSupplier) {
                try {
                    setLoading(true);
                    const data = await api.list('/purchase-orders/', { supplier: selectedSupplier.id, status__in: 'Pendiente,Comprada por Pagar' });
                    setPurchaseOrders(data.results || (Array.isArray(data) ? data : []));
                } catch (err) {
                    console.error("Error fetching purchase orders", err);
                    setError('Error al cargar las órdenes de compra del proveedor.');
                } finally {
                    setLoading(false);
                }
            } else {
                setPurchaseOrders([]);
            }
        };
        fetchPurchaseOrders();
    }, [selectedSupplier]);

    // Fetch Payment History for selected Purchase Order
    useEffect(() => {
        const fetchPaymentHistory = async () => {
            if (selectedPurchaseOrder) {
                try {
                    setLoading(true);
                    const data = await api.list('/payments/', { purchase_order: selectedPurchaseOrder.id });
                    setPaymentHistory(data.results || (Array.isArray(data) ? data : []));
                } catch (err) {
                    console.error("Error fetching payment history", err);
                    setError('Error al cargar el historial de pagos.');
                } finally {
                    setLoading(false);
                }
            } else {
                setPaymentHistory([]);
            }
        };
        fetchPaymentHistory();
    }, [selectedPurchaseOrder]);

    const handleSaveCheck = async (checkData) => {
        try {
            await api.create('/checks/', checkData);
            setRefreshChecks(prev => !prev); // Trigger refresh
            setIsCheckFormOpen(false);
        } catch (error) {
            console.error("Failed to save check", error);
            setError('Error al guardar el cheque.');
        }
    };

    const handlePayment = async (paymentMethod) => {
        if (!selectedSupplier || !selectedPurchaseOrder || !paymentAmount || !selectedPaymentMethodType) {
            setError('Por favor, complete todos los campos requeridos para el pago.');
            return;
        }

        const paymentData = {
            purchase_order: selectedPurchaseOrder.id,
            amount: paymentAmount,
            payment_method: selectedPaymentMethodType,
            description: paymentDetail,
            // Conditional fields for Transaction creation
            account: selectedAccount,
            cash_register: selectedCashbox,
            check: selectedCheckId || null, // Pass check ID if applicable
        };

        try {
            setLoading(true);
            await api.create('/payments/', paymentData);
            // Refresh purchase orders and payment history
            const updatedPurchaseOrders = await api.list('/purchase-orders/', { supplier: selectedSupplier.id, status__in: 'Pendiente,Comprada por Pagar' });
            setPurchaseOrders(updatedPurchaseOrders.results || (Array.isArray(updatedPurchaseOrders) ? updatedPurchaseOrders : []));
            const updatedPaymentHistory = await api.list('/payments/', { purchase_order: selectedPurchaseOrder.id });
            setPaymentHistory(updatedPaymentHistory.results || (Array.isArray(updatedPaymentHistory) ? updatedPaymentHistory : []));

            // Clear form fields
            setPaymentAmount('');
            setPaymentDetail('');
            setSelectedCashbox('');
            setSelectedAccount('');
            setSelectedPaymentMethodType('');
            setSelectedCheckId('');
            setError(null);
        } catch (err) {
            console.error("Error al registrar el pago", err.response?.data || err.message);
            setError('Error al registrar el pago. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    const getOutstandingBalance = (po) => {
        return (parseFloat(po.total_amount || 0) - parseFloat(po.paid_amount || 0)).toFixed(2);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Pagos a Proveedores</Typography>
            
            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6">Seleccionar Proveedor</Typography>
                    <Autocomplete
                        options={suppliers}
                        getOptionLabel={(option) => option.name || ''}
                        onChange={(event, newValue) => {
                            setSelectedSupplier(newValue);
                            setSelectedPurchaseOrder(null); // Reset selected PO when supplier changes
                        }}
                        renderInput={(params) => <TextField {...params} label="Proveedor" margin="dense" fullWidth />}
                    />
                </Grid>

                {selectedSupplier && (
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mt: 2 }}>Órdenes de Compra Pendientes</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID OC</TableCell>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Pagado</TableCell>
                                        <TableCell>Saldo</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell>Seleccionar</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {purchaseOrders.length === 0 ? (
                                        <TableRow><TableCell colSpan={7}>No hay órdenes de compra pendientes para este proveedor.</TableCell></TableRow>
                                    ) : (
                                        purchaseOrders.map((po) => (
                                            <TableRow key={po.id} selected={selectedPurchaseOrder?.id === po.id}>
                                                <TableCell>{po.id}</TableCell>
                                                <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                                                <TableCell>${po.total_amount}</TableCell>
                                                <TableCell>${po.paid_amount}</TableCell>
                                                <TableCell>${getOutstandingBalance(po)}</TableCell>
                                                <TableCell>{po.status}</TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small" 
                                                        onClick={() => setSelectedPurchaseOrder(po)}
                                                        disabled={selectedPurchaseOrder?.id === po.id}
                                                    >
                                                        {selectedPurchaseOrder?.id === po.id ? 'Seleccionada' : 'Seleccionar'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                )}

                {selectedPurchaseOrder && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Registrar Pago para OC #{selectedPurchaseOrder.id}</Typography>
                            <Typography variant="subtitle1" color="textSecondary">Saldo Pendiente: ${getOutstandingBalance(selectedPurchaseOrder)}</Typography>
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        margin="dense" 
                                        name="amount" 
                                        label="Monto a Pagar $" 
                                        type="number" 
                                        fullWidth 
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        inputProps={{ step: "0.01" }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth margin="dense">
                                        <InputLabel>Método de Pago</InputLabel>
                                        <Select
                                            value={selectedPaymentMethodType}
                                            onChange={(e) => setSelectedPaymentMethodType(e.target.value)}
                                            label="Método de Pago"
                                        >
                                            {paymentMethodTypes.map((pmt) => (
                                                <MenuItem key={pmt.id} value={pmt.id}>
                                                    {pmt.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField 
                                        margin="dense" 
                                        name="detail" 
                                        label="Detalle del Pago (Opcional)" 
                                        fullWidth 
                                        value={paymentDetail}
                                        onChange={(e) => setPaymentDetail(e.target.value)}
                                    />
                                </Grid>

                                {selectedPaymentMethodType && paymentMethodTypes.find(pmt => pmt.id === selectedPaymentMethodType)?.name === 'Efectivo' && (
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth margin="dense">
                                            <InputLabel>Caja</InputLabel>
                                            <Select
                                                value={selectedCashbox}
                                                onChange={(e) => setSelectedCashbox(e.target.value)}
                                                label="Caja"
                                            >
                                                {cashboxes.map((cashbox) => (
                                                    <MenuItem key={cashbox.id} value={cashbox.id}>
                                                        {cashbox.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}

                                {selectedPaymentMethodType && paymentMethodTypes.find(pmt => pmt.id === selectedPaymentMethodType)?.name === 'Transferencia' && (
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth margin="dense">
                                            <InputLabel>Cuenta Contable</InputLabel>
                                            <Select
                                                value={selectedAccount}
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                                label="Cuenta Contable"
                                            >
                                                {accounts.map((account) => (
                                                    <MenuItem key={account.id} value={account.id}>
                                                        {account.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}

                                {selectedPaymentMethodType && paymentMethodTypes.find(pmt => pmt.id === selectedPaymentMethodType)?.name === 'Cheque' && (
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel>Cheque</InputLabel>
                                                <Select
                                                    value={selectedCheckId}
                                                    onChange={(e) => setSelectedCheckId(e.target.value)}
                                                    label="Cheque"
                                                >
                                                    <MenuItem value="">
                                                        <em>Ninguno</em>
                                                    </MenuItem>
                                                    {checks.map((check) => (
                                                        <MenuItem key={check.id} value={check.id}>
                                                            {`#${check.order_number} - ${check.amount}`}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <IconButton color="primary" onClick={() => setIsCheckFormOpen(true)}>
                                                <AddIcon />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                )}

                                <Grid item xs={12} sx={{ textAlign: 'right' }}>
                                    <Button variant="contained" onClick={handlePayment} sx={{ mt: 2 }}>
                                        Registrar Pago
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                )}

                <Grid item xs={12}>
                    {selectedPurchaseOrder && paymentHistory.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>Historial de Pagos para OC #{selectedPurchaseOrder.id}</Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID Pago</TableCell>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell>Monto</TableCell>
                                            <TableCell>Método</TableCell>
                                            <TableCell>Detalle</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paymentHistory.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{payment.id}</TableCell>
                                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                                <TableCell>${payment.amount}</TableCell>
                                                <TableCell>{payment.payment_method_name}</TableCell>
                                                <TableCell>{payment.description}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Grid>
            </Grid>

            <NewCheckForm 
                open={isCheckFormOpen} 
                onClose={() => setIsCheckFormOpen(false)} 
                onSave={handleSaveCheck} 
            />
        </Box>
    );
};

export default PagosProveedor;
