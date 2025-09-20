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

// Transaction Form Dialog Component
const TransactionForm = ({ open, onClose, onSave, transaction }) => {
    const [formData, setFormData] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [locals, setLocals] = useState([]);
    const [cashRegisters, setCashRegisters] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    const TRANSACTION_TYPE_CHOICES = [
        { value: 'Debito', label: 'Débito' },
        { value: 'Credito', label: 'Crédito' },
    ];

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [accountsData, salesData, purchaseOrdersData, localsData, cashRegistersData] = await Promise.all([
                    api.list('/accounts/'),
                    api.list('/sales/'),
                    api.list('/purchase-orders/'),
                    api.list('/locals/'),
                    api.list('/cash-registers/'),
                ]);
                setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.results || []);
                setSales(Array.isArray(salesData) ? salesData : salesData.results || []);
                setPurchaseOrders(Array.isArray(purchaseOrdersData) ? purchaseOrdersData : purchaseOrdersData.results || []);
                setLocals(Array.isArray(localsData) ? localsData : localsData.results || []);
                setCashRegisters(Array.isArray(cashRegistersData) ? cashRegistersData : cashRegistersData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (cuentas, ventas, etc.).');
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
        if (transaction) {
            setFormData({
                ...transaction,
                date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
                account: transaction.account?.id || '',
                related_sale: transaction.related_sale?.id || '',
                related_purchase: transaction.related_purchase?.id || '',
                local: transaction.local?.id || '',
                cash_register: transaction.cash_register?.id || '',
            });
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: '',
                account: '',
                transaction_type: '',
                related_sale: '',
                related_purchase: '',
                local: '',
                cash_register: '',
            });
        }
    }, [transaction, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            <DialogTitle>{transaction ? 'Editar Transacción' : 'Nueva Transacción'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="date" label="Fecha" type="date" fullWidth value={formData.date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                <TextField margin="dense" name="amount" label="Monto" type="number" fullWidth value={formData.amount || ''} onChange={handleChange} />
                
                <TextField
                    margin="dense"
                    name="account"
                    label="Cuenta"
                    select
                    fullWidth
                    value={formData.account || ''}
                    onChange={handleChange}
                >
                    {accounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                            {account.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="transaction_type"
                    label="Tipo de Transacción"
                    select
                    fullWidth
                    value={formData.transaction_type || ''}
                    onChange={handleChange}
                >
                    {TRANSACTION_TYPE_CHOICES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="related_sale"
                    label="Venta Relacionada"
                    select
                    fullWidth
                    value={formData.related_sale || ''}
                    onChange={handleChange}
                    disabled={sales.length === 0} // Disable if no sales
                >
                    {sales.map((sale) => (
                        <MenuItem key={sale.id} value={sale.id}>
                            Venta #{sale.id} ({sale.total_amount})
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="related_purchase"
                    label="Orden de Compra Relacionada"
                    select
                    fullWidth
                    value={formData.related_purchase || ''}
                    onChange={handleChange}
                    disabled={purchaseOrders.length === 0} // Disable if no purchase orders
                >
                    {purchaseOrders.map((po) => (
                        <MenuItem key={po.id} value={po.id}>
                            OC #{po.id}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="local"
                    label="Local"
                    select
                    fullWidth
                    value={formData.local || ''}
                    onChange={handleChange}
                    disabled={locals.length === 0} // Disable if no locals
                >
                    {locals.map((local) => (
                        <MenuItem key={local.id} value={local.id}>
                            {local.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="cash_register"
                    label="Caja"
                    select
                    fullWidth
                    value={formData.cash_register || ''}
                    onChange={handleChange}
                    disabled={cashRegisters.length === 0} // Disable if no cash registers
                >
                    {cashRegisters.map((cr) => (
                        <MenuItem key={cr.id} value={cr.id}>
                            {cr.name}
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

// Main Transaction Management Component
const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const { tenantId } = useAuth();

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await api.list('/transactions/');
            const transactionList = Array.isArray(data) ? data : data.results;
            setTransactions(transactionList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las transacciones. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchTransactions();
        }
    }, [tenantId]);

    const handleOpenForm = (transaction = null) => {
        setSelectedTransaction(transaction);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedTransaction(null);
        setIsFormOpen(false);
    };

    const handleSave = async (transactionData) => {
        try {
            // Prepare data to send: convert IDs back to numbers if they are strings
            const dataToSend = {
                ...transactionData,
                account: transactionData.account || null,
                related_sale: transactionData.related_sale || null,
                related_purchase: transactionData.related_purchase || null,
                local: transactionData.local || null,
                cash_register: transactionData.cash_register || null,
            };

            if (selectedTransaction) {
                await api.update('/transactions/', selectedTransaction.id, dataToSend);
            } else {
                await api.create('/transactions/', dataToSend);
            }
            fetchTransactions(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la transacción.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta transacción?')) {
            try {
                await api.remove('/transactions/', id);
                fetchTransactions(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la transacción.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Transacciones</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Transacción
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Monto</TableCell>
                                <TableCell>Cuenta</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{transaction.date}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell>{transaction.amount}</TableCell>
                                    <TableCell>{transaction.account_name || transaction.account}</TableCell>
                                    <TableCell>{transaction.transaction_type}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(transaction)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(transaction.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <TransactionForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                transaction={selectedTransaction} 
            />
        </Box>
    );
};

export default TransactionManagement;
