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

// Payment Form Dialog Component
const PaymentForm = ({ open, onClose, onSave, payment }) => {
    const [formData, setFormData] = useState({});
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [invoicesError, setInvoicesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoadingInvoices(true);
                const data = await api.list('/invoices/');
                const invoiceList = Array.isArray(data) ? data : data.results;
                setInvoices(invoiceList || []);
            } catch (err) {
                setInvoicesError('Error al cargar las facturas.');
                console.error(err);
            } finally {
                setLoadingInvoices(false);
            }
        };

        if (tenantId) {
            fetchInvoices();
        }
    }, [tenantId]);

    useEffect(() => {
        if (payment) {
            setFormData({
                ...payment,
                date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : '',
                invoice: payment.invoice?.id || '',
            });
        } else {
            setFormData({
                invoice: '',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                payment_method: ''
            });
        }
    }, [payment, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingInvoices) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (invoicesError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{invoicesError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{payment ? 'Editar Pago' : 'Nuevo Pago'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="invoice"
                    label="Factura"
                    select
                    fullWidth
                    value={formData.invoice || ''}
                    onChange={handleChange}
                >
                    {invoices.map((invoice) => (
                        <MenuItem key={invoice.id} value={invoice.id}>
                            Factura #{invoice.id} (Monto: {invoice.total_amount})
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="date" label="Fecha" type="date" fullWidth value={formData.date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="amount" label="Monto" type="number" fullWidth value={formData.amount || ''} onChange={handleChange} />
                <TextField margin="dense" name="payment_method" label="Método de Pago" type="text" fullWidth value={formData.payment_method || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Payment Management Component
const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const { tenantId } = useAuth();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await api.list('/payments/');
            const paymentList = Array.isArray(data) ? data : data.results;
            setPayments(paymentList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los pagos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchPayments();
        }
    }, [tenantId]);

    const handleOpenForm = (payment = null) => {
        setSelectedPayment(payment);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedPayment(null);
        setIsFormOpen(false);
    };

    const handleSave = async (paymentData) => {
        try {
            const dataToSend = {
                ...paymentData,
                invoice: paymentData.invoice || null,
            };

            if (selectedPayment) {
                await api.update('/payments/', selectedPayment.id, dataToSend);
            } else {
                await api.create('/payments/', dataToSend);
            }
            fetchPayments(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el pago.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este pago?')) {
            try {
                await api.remove('/payments/', id);
                fetchPayments(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el pago.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Pagos</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Pago
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Factura</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Monto</TableCell>
                                <TableCell>Método de Pago</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{payment.invoice_id || payment.invoice}</TableCell>
                                    <TableCell>{payment.date}</TableCell>
                                    <TableCell>{payment.amount}</TableCell>
                                    <TableCell>{payment.payment_method}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(payment)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(payment.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <PaymentForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                payment={selectedPayment} 
            />
        </Box>
    );
};

export default PaymentManagement;
