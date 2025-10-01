import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, FormControl, InputLabel, Select, 
    MenuItem, Button, TextField, Grid, Alert,
    Dialog, DialogActions, DialogContent, DialogTitle
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
    const [showChequeDialog, setShowChequeDialog] = useState(false);
    const [chequeData, setChequeData] = useState(null);
    const [chequeFormData, setChequeFormData] = useState({
        number: '',
        amount: '',
        bank: '',
        issuer: '',
        cuit: '',
        due_date: '',
        observations: ''
    });

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
        
        // Si es cheque, abrir el diálogo
        if (method && method.name.toLowerCase() === 'cheque') {
            setChequeFormData({
                ...chequeFormData,
                amount: newMovement.amount || ''
            });
            setShowChequeDialog(true);
        }
        
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

    const handleChequeFormChange = (e) => {
        setChequeFormData({ ...chequeFormData, [e.target.name]: e.target.value });
    };

    const handleSaveCheque = async () => {
        try {
            const chequeToSave = {
                ...chequeFormData,
                amount: parseFloat(chequeFormData.amount),
                bank: chequeFormData.bank || null,
                status: 'CARGADO'
            };
            
            const savedCheque = await api.create('/checks/', chequeToSave);
            setChequeData(savedCheque);
            setShowChequeDialog(false);
            
            // Auto-llenar el monto del cobro con el monto del cheque
            setNewMovement({ ...newMovement, amount: savedCheque.amount });
        } catch (error) {
            console.error("Error saving cheque", error);
            alert(error.response?.data?.error || "Error al guardar el cheque");
        }
    };

    const handlePaymentSubmit = async (event) => {
        event.preventDefault();
        
        if (!selectedAccount || !selectedSale) {
            alert("Debe seleccionar una venta y una cuenta destino");
            return;
        }
        
        // Si el método es cheque y no hay cheque cargado
        if (selectedPaymentMethod && selectedPaymentMethod.name.toLowerCase() === 'cheque' && !chequeData) {
            alert("Debe cargar los datos del cheque");
            return;
        }

        const paymentData = {
            sale_id: selectedSale,
            amount: parseFloat(newMovement.amount),
            payment_method_id: newMovement.payment_method_id,
            account_id: selectedAccount,
            cash_register_id: selectedCashRegister || null,
            bank_id: selectedBank || null,
            description: newMovement.description,
            check_id: chequeData ? chequeData.id : null
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
            setChequeData(null);
            setChequeFormData({
                number: '',
                amount: '',
                bank: '',
                issuer: '',
                cuit: '',
                due_date: '',
                observations: ''
            });
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
                        <Paper elevation={3} sx={{ p: 4, mb: 3, backgroundColor: '#ffffff' }}>
                            <Typography variant="h5" gutterBottom sx={{ 
                                color: '#1976d2', 
                                fontWeight: 600,
                                mb: 3
                            }}>
                                Registrar Cobro
                            </Typography>
                            
                            <Box component="form" onSubmit={handlePaymentSubmit}>
                                {/* ========== SECCIÓN 1: VENTA A COBRAR ========== */}
                                <Box sx={{ 
                                    backgroundColor: '#f5f9ff', 
                                    borderRadius: 2, 
                                    p: 3, 
                                    mb: 3,
                                    border: '1px solid #e3f2fd'
                                }}>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600, 
                                        color: '#1565c0',
                                        mb: 3,
                                        fontSize: '1.1rem'
                                    }}>
                                        1. Venta a Cobrar
                                    </Typography>
                                    
                                    <FormControl fullWidth required sx={{ mb: 2 }}>
                                        <InputLabel>Seleccione la venta pendiente</InputLabel>
                                        <Select
                                            value={selectedSale}
                                            label="Seleccione la venta pendiente"
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
                                        <Alert severity="info" sx={{ fontWeight: 500 }}>
                                            💰 Saldo pendiente de esta venta: <strong>${pendingSales.find(s => s.id === selectedSale)?.pending_balance.toFixed(2)}</strong>
                                        </Alert>
                                    )}
                                </Box>

                                {/* ========== SECCIÓN 2: DATOS DEL COBRO ========== */}
                                <Box sx={{ 
                                    backgroundColor: '#f5f9ff', 
                                    borderRadius: 2, 
                                    p: 3, 
                                    mb: 3,
                                    border: '1px solid #e3f2fd'
                                }}>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600, 
                                        color: '#1565c0',
                                        mb: 3,
                                        fontSize: '1.1rem'
                                    }}>
                                        2. Datos del Cobro
                                    </Typography>
                                    
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Monto a Cobrar"
                                                name="amount"
                                                type="number"
                                                inputProps={{ step: "0.01", min: "0.01" }}
                                                value={newMovement.amount}
                                                onChange={handleMovementChange}
                                                required
                                                helperText="Ingrese el monto que va a cobrar"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth required sx={{ minWidth: 250 }}>
                                                <InputLabel>Método de Pago</InputLabel>
                                                <Select
                                                    name="payment_method_id"
                                                    value={newMovement.payment_method_id || ''}
                                                    label="Método de Pago"
                                                    onChange={handlePaymentMethodChange}
                                                >
                                                    <MenuItem value=""><em>Seleccione un método</em></MenuItem>
                                                    {paymentMethods.map((method) => (
                                                        <MenuItem key={method.id} value={method.id}>{method.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        {selectedPaymentMethod && selectedPaymentMethod.name.toLowerCase() === 'cheque' && (
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
                                        
                                        {selectedPaymentMethod && selectedPaymentMethod.name !== 'Efectivo' && (
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth required sx={{ minWidth: 250 }}>
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
                                                        <MenuItem value=""><em>Sin banco específico</em></MenuItem>
                                                        {banks.map((bank) => (
                                                            <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        )}
                                        
                                        {selectedPaymentMethod && financialCost > 0 && (
                                            <Grid xs={12}>
                                                <Alert severity="warning" sx={{ fontWeight: 500 }}>
                                                    ⚠️ <strong>Costo financiero:</strong> ${financialCost.toFixed(2)} ({financialCostPercentage}%)
                                                    <br />
                                                    💵 <strong>Monto neto a recibir:</strong> ${(parseFloat(newMovement.amount || 0) - financialCost).toFixed(2)}
                                                </Alert>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>

                                {/* ========== SECCIÓN 3: DESTINO DEL DINERO ========== */}
                                <Box sx={{ 
                                    backgroundColor: '#f5f9ff', 
                                    borderRadius: 2, 
                                    p: 3, 
                                    mb: 3,
                                    border: '1px solid #e3f2fd'
                                }}>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600, 
                                        color: '#1565c0',
                                        mb: 3,
                                        fontSize: '1.1rem'
                                    }}>
                                        3. Destino del Dinero
                                    </Typography>
                                    
                                    <FormControl fullWidth required sx={{ mb: 3 }}>
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
                                    
                                    <FormControl fullWidth>
                                        <InputLabel>Caja (Opcional)</InputLabel>
                                        <Select
                                            value={selectedCashRegister}
                                            label="Caja (Opcional)"
                                            onChange={(e) => setSelectedCashRegister(e.target.value)}
                                        >
                                            <MenuItem value=""><em>No asignar a ninguna caja</em></MenuItem>
                                            {cashRegisters.map((cr) => (
                                                <MenuItem key={cr.id} value={cr.id}>{cr.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {/* ========== SECCIÓN 4: OBSERVACIONES ========== */}
                                <Box sx={{ 
                                    backgroundColor: '#f5f9ff', 
                                    borderRadius: 2, 
                                    p: 3, 
                                    mb: 3,
                                    border: '1px solid #e3f2fd'
                                }}>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600, 
                                        color: '#1565c0',
                                        mb: 3,
                                        fontSize: '1.1rem'
                                    }}>
                                        4. Observaciones
                                    </Typography>
                                    
                                    <TextField
                                        fullWidth
                                        label="Descripción / Comprobante"
                                        name="description"
                                        value={newMovement.description}
                                        onChange={handleMovementChange}
                                        multiline
                                        rows={3}
                                        placeholder="Ej: Factura N° 001-00123, Recibo de pago, Transferencia CBU 123456..."
                                        helperText="Ingrese detalles del cobro, número de comprobante u otra información relevante"
                                    />
                                </Box>
                                
                                {/* ========== BOTONES DE ACCIÓN ========== */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'flex-end', 
                                    gap: 2,
                                    pt: 2,
                                    borderTop: '2px solid #e0e0e0'
                                }}>
                                    <Button 
                                        onClick={() => {
                                            setShowForm(false);
                                            setNewMovement({ description: '', payment_method_id: '', amount: '' });
                                            setSelectedSale('');
                                            setSelectedPaymentMethod(null);
                                            setSelectedBank('');
                                        }}
                                        variant="outlined"
                                        size="large"
                                        sx={{ minWidth: 120 }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        color="primary"
                                        size="large"
                                        disabled={!selectedAccount || !selectedSale}
                                        sx={{ minWidth: 180 }}
                                    >
                                        Registrar Cobro
                                    </Button>
                                </Box>
                            </Box>
                        
                        {/* ========== DIÁLOGO DE CHEQUE ========== */}
                        <Dialog open={showChequeDialog} onClose={() => setShowChequeDialog(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Datos del Cheque</DialogTitle>
                            <DialogContent>
                                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        name="number"
                                        label="Número de Cheque"
                                        type="text"
                                        fullWidth
                                        value={chequeFormData.number}
                                        onChange={handleChequeFormChange}
                                        required
                                    />
                                    <TextField
                                        name="amount"
                                        label="Monto $"
                                        type="number"
                                        inputProps={{ step: "0.01", min: "0.01" }}
                                        fullWidth
                                        value={chequeFormData.amount}
                                        onChange={handleChequeFormChange}
                                        required
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Banco</InputLabel>
                                        <Select
                                            name="bank"
                                            value={chequeFormData.bank}
                                            label="Banco"
                                            onChange={handleChequeFormChange}
                                        >
                                            <MenuItem value=""><em>Seleccione un banco</em></MenuItem>
                                            {banks.map((bank) => (
                                                <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        name="issuer"
                                        label="Emisor/Librador"
                                        type="text"
                                        fullWidth
                                        value={chequeFormData.issuer}
                                        onChange={handleChequeFormChange}
                                        required
                                    />
                                    <TextField
                                        name="cuit"
                                        label="CUIT"
                                        type="text"
                                        fullWidth
                                        value={chequeFormData.cuit}
                                        onChange={handleChequeFormChange}
                                    />
                                    <TextField
                                        name="due_date"
                                        label="Fecha de Vencimiento"
                                        type="date"
                                        fullWidth
                                        value={chequeFormData.due_date}
                                        onChange={handleChequeFormChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        name="observations"
                                        label="Observaciones"
                                        type="text"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={chequeFormData.observations}
                                        onChange={handleChequeFormChange}
                                    />
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setShowChequeDialog(false)}>Cancelar</Button>
                                <Button 
                                    onClick={handleSaveCheque} 
                                    variant="contained"
                                    disabled={!chequeFormData.number || !chequeFormData.amount || !chequeFormData.issuer}
                                >
                                    Guardar Cheque
                                </Button>
                            </DialogActions>
                        </Dialog>
                        
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