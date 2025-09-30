import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, FormControl, InputLabel, Select, 
    MenuItem, Button, TextField, Grid, Alert
} from '@mui/material';
import * as api from '../../utils/api';

const CuentaPorCliente = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newMovement, setNewMovement] = useState({
        description: '',
        amount: ''
    });
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');

    const [pendingSales, setPendingSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [financialCost, setFinancialCost] = useState(0);
    const [financialCostPercentage, setFinancialCostPercentage] = useState(0);
    const [cashRegisters, setCashRegisters] = useState([]);
    const [selectedCashRegister, setSelectedCashRegister] = useState('');
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState('');

    useEffect(() => {
        const fetchClientsAndAccounts = async () => {
            try {
                setLoading(true);
                const [clientsData, accountsData, paymentMethodsData, cashRegistersData, banksData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/accounts/'),
                    api.list('/payment-method-types/'),
                    api.list('/cash-registers/'),
                    api.list('/banks/')
                ]);
                setClients(clientsData || []);
                setAccounts(accountsData || []);
                setPaymentMethods(paymentMethodsData || []);
                setCashRegisters(cashRegistersData || []);
                setBanks(banksData || []);
                if (accountsData && accountsData.length > 0) {
                    setSelectedAccount(accountsData[0].id);
                }
            } catch (error) {
                console.error("Error fetching initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClientsAndAccounts();
    }, []);

    const fetchMovements = async () => {
        if (selectedClient) {
            try {
                const data = await api.list(`/clients/${selectedClient}/account-movements/`);
                setMovements(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching movements", error);
                setMovements([]);
            }
        } else {
            setMovements([]);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, [selectedClient]);

    const fetchPendingSales = async () => {
        if (selectedClient) {
            try {
                const data = await api.list(`/clients/${selectedClient}/pending-sales/`);
                setPendingSales(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching pending sales", error);
                setPendingSales([]);
            }
        }
    };

    useEffect(() => {
        if (selectedClient) {
            fetchPendingSales();
        } else {
            setPendingSales([]);
            setSelectedSale('');
        }
    }, [selectedClient]);

    const handleClientChange = (event) => {
        setSelectedClient(event.target.value);
    };

    const handleMovementChange = (event) => {
        const newValue = { ...newMovement, [event.target.name]: event.target.value };
        setNewMovement(newValue);
        
        if (event.target.name === 'amount' && selectedPaymentMethod) {
            handlePaymentMethodChange({ target: { value: newMovement.payment_method_id } });
        }
    };

    const handlePaymentMethodChange = async (event) => {
        const methodId = event.target.value;
        setNewMovement({ ...newMovement, payment_method_id: methodId });
        
        const method = paymentMethods.find(m => m.id === methodId);
        setSelectedPaymentMethod(method);
        
        if (method && newMovement.amount) {
            try {
                let ruleQuery = `/financial-cost-rules/?payment_method=${methodId}`;
                if (selectedBank) {
                    ruleQuery += `&bank=${selectedBank}`;
                }
                
                const rules = await api.list(ruleQuery);
                if (rules && rules.length > 0) {
                    const rule = rules[0];
                    const percentage = parseFloat(rule.percentage);
                    const cost = (parseFloat(newMovement.amount) * percentage) / 100;
                    setFinancialCost(cost);
                    setFinancialCostPercentage(percentage);
                } else {
                    setFinancialCost(0);
                    setFinancialCostPercentage(0);
                }
            } catch (error) {
                console.error("Error fetching financial cost rules", error);
                setFinancialCost(0);
                setFinancialCostPercentage(0);
            }
        }
    };

    const handlePaymentSubmit = async (event) => {
        event.preventDefault();
        
        if (!selectedAccount || !selectedSale) {
            alert("Debe seleccionar una venta y una cuenta destino");
            return;
        }

        const paymentData = {
            sale_id: selectedSale,
            amount: parseFloat(newMovement.amount),
            payment_method_id: newMovement.payment_method_id,
            account_id: selectedAccount,
            cash_register_id: selectedCashRegister || null,
            bank_id: selectedBank || null,
            description: newMovement.description
        };

        try {
            const response = await api.create(`/clients/${selectedClient}/register-payment/`, paymentData);
            
            const message = `Cobro registrado exitosamente.\n\nMonto cobrado: $${response.monto_cobrado.toFixed(2)}\nCosto financiero: $${response.costo_financiero.toFixed(2)}\nMonto neto: $${response.monto_neto.toFixed(2)}\nSaldo restante: $${response.saldo_restante.toFixed(2)}`;
            alert(message);
            
            setNewMovement({ description: '', payment_method_id: '', amount: '' });
            setSelectedSale('');
            setSelectedPaymentMethod(null);
            setSelectedBank('');
            setFinancialCost(0);
            setShowForm(false);
            
            fetchMovements();
            fetchPendingSales();
        } catch (error) {
            console.error("Error registering payment", error);
            alert(error.response?.data?.error || "Error al registrar el cobro");
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Cuenta Corriente por Cliente</Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Seleccionar Cliente</InputLabel>
                <Select
                    value={selectedClient}
                    label="Seleccionar Cliente"
                    onChange={handleClientChange}
                    disabled={loading}
                >
                    <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
                    {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedClient && (
                <>
                    <Button variant="contained" sx={{ mb: 2 }} onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancelar' : 'Agregar Movimiento'}
                    </Button>

                    {showForm && (
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Registrar Cobro</Typography>
                            <Box component="form" onSubmit={handlePaymentSubmit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Venta a Cobrar</InputLabel>
                                            <Select
                                                value={selectedSale}
                                                label="Venta a Cobrar"
                                                onChange={(e) => {
                                                    setSelectedSale(e.target.value);
                                                    const sale = pendingSales.find(s => s.id === e.target.value);
                                                    if (sale) {
                                                        setNewMovement({ ...newMovement, amount: sale.pending_balance });
                                                    }
                                                }}
                                            >
                                                <MenuItem value=""><em>Seleccione una venta</em></MenuItem>
                                                {pendingSales.map((sale) => (
                                                    <MenuItem key={sale.id} value={sale.id}>
                                                        {sale.description} - Pendiente: ${sale.pending_balance.toFixed(2)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {selectedSale && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Saldo pendiente: ${pendingSales.find(s => s.id === selectedSale)?.pending_balance.toFixed(2)}
                                            </Typography>
                                        )}
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Monto a Cobrar"
                                            name="amount"
                                            type="number"
                                            inputProps={{ step: "0.01", min: "0.01" }}
                                            value={newMovement.amount}
                                            onChange={handleMovementChange}
                                            required
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Método de Pago</InputLabel>
                                            <Select
                                                name="payment_method_id"
                                                value={newMovement.payment_method_id || ''}
                                                label="Método de Pago"
                                                onChange={handlePaymentMethodChange}
                                            >
                                                <MenuItem value=""><em>Seleccione método</em></MenuItem>
                                                {paymentMethods.map((method) => (
                                                    <MenuItem key={method.id} value={method.id}>{method.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    
                                    {selectedPaymentMethod && selectedPaymentMethod.name !== 'Efectivo' && (
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Banco (Opcional)</InputLabel>
                                                <Select
                                                    value={selectedBank}
                                                    label="Banco (Opcional)"
                                                    onChange={(e) => {
                                                        setSelectedBank(e.target.value);
                                                        if (newMovement.payment_method_id) {
                                                            handlePaymentMethodChange({ target: { value: newMovement.payment_method_id } });
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value=""><em>General</em></MenuItem>
                                                    {banks.map((bank) => (
                                                        <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    )}
                                    
                                    {selectedPaymentMethod && financialCost > 0 && (
                                        <Grid item xs={12}>
                                            <Alert severity="info">
                                                Costo financiero: ${financialCost.toFixed(2)} ({financialCostPercentage}%)
                                                <br />
                                                Monto neto a recibir: ${(parseFloat(newMovement.amount || 0) - financialCost).toFixed(2)}
                                            </Alert>
                                        </Grid>
                                    )}
                                    
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Cuenta Destino</InputLabel>
                                            <Select
                                                value={selectedAccount}
                                                label="Cuenta Destino"
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                            >
                                                {accounts.map((acc) => (
                                                    <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Caja (Opcional)</InputLabel>
                                            <Select
                                                value={selectedCashRegister}
                                                label="Caja (Opcional)"
                                                onChange={(e) => setSelectedCashRegister(e.target.value)}
                                            >
                                                <MenuItem value=""><em>Ninguna</em></MenuItem>
                                                {cashRegisters.map((cr) => (
                                                    <MenuItem key={cr.id} value={cr.id}>{cr.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Descripción / Comprobante"
                                            name="description"
                                            value={newMovement.description}
                                            onChange={handleMovementChange}
                                            multiline
                                            rows={2}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Button 
                                            type="submit" 
                                            variant="contained" 
                                            color="primary" 
                                            disabled={!selectedAccount || !selectedSale}
                                        >
                                            Registrar Cobro
                                        </Button>
                                        <Button 
                                            onClick={() => setShowForm(false)} 
                                            sx={{ ml: 2 }}
                                        >
                                            Cancelar
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    )}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Detalle</TableCell>
                                    <TableCell>Tipo (Monto)</TableCell>
                                    <TableCell>Balance</TableCell>
                                    <TableCell>Usuario</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {movements.map((mov) => (
                                    <TableRow key={mov.id}>
                                        <TableCell>{new Date(mov.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{mov.detail}</TableCell>
                                        <TableCell style={{ color: mov.amount >= 0 ? 'green' : 'red' }}>
                                            {mov.type}: ${Math.abs(mov.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>${mov.balance.toFixed(2)}</TableCell>
                                        <TableCell>{mov.user || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default CuentaPorCliente;