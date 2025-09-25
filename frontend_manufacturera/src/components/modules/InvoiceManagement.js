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

// Invoice Form Dialog Component
const InvoiceForm = ({ open, onClose, onSave, invoice }) => {
    const [formData, setFormData] = useState({});
    const [clients, setClients] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    const INVOICE_STATUS_CHOICES = [
        { value: 'Pendiente', label: 'Pendiente' },
        { value: 'Pagada', label: 'Pagada' },
        { value: 'Cancelada', label: 'Cancelada' },
    ];

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [clientsData, salesData, purchaseOrdersData] = await Promise.all([
                    api.list('/clients/'),
                    api.list('/sales/'),
                    api.list('/purchase-orders/'),
                ]);
                setClients(Array.isArray(clientsData) ? clientsData : clientsData.results || []);
                setSales(Array.isArray(salesData) ? salesData : salesData.results || []);
                setPurchaseOrders(Array.isArray(purchaseOrdersData) ? purchaseOrdersData : purchaseOrdersData.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar dependencias (clientes, ventas, órdenes de compra).');
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
        if (invoice) {
            setFormData({
                ...invoice,
                date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
                client: invoice.client?.id || '',
                sale: invoice.sale?.id || '',
                purchase_order: invoice.purchase_order?.id || '',
            });
        } else {
            setFormData({
                client: '',
                sale: '',
                purchase_order: '',
                date: new Date().toISOString().split('T')[0],
                total_amount: '',
                status: 'Pendiente'
            });
        }
    }, [invoice, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Si se selecciona una venta, auto-completar los campos relacionados
        if (name === 'sale' && value) {
            const selectedSale = sales.find(sale => sale.id === parseInt(value));
            if (selectedSale) {
                setFormData({
                    ...formData,
                    [name]: value,
                    client: selectedSale.client?.id || selectedSale.client || '',
                    total_amount: selectedSale.total_amount || '',
                    purchase_order: selectedSale.purchase_order?.id || selectedSale.purchase_order || ''
                });
                return;
            }
        }
        
        setFormData({ ...formData, [name]: value });
    };

    const handleSaleChange = (e) => {
        const saleId = e.target.value;
        const selectedSale = sales.find(s => s.id === saleId);
        
        setFormData(prevData => ({
            ...prevData,
            sale: saleId,
            total_amount: selectedSale ? selectedSale.total_amount : '',
        }));
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
            <DialogTitle>{invoice ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="sale"
                    label="Venta Relacionada"
                    select
                    fullWidth
                    value={formData.sale || ''}
                    onChange={handleChange}
                    disabled={sales.length === 0} // Disable if no sales
                >
                    {sales.map((sale) => (
                        <MenuItem key={sale.id} value={sale.id}>
                            Venta #{sale.id}
                        </MenuItem>
                    ))}
                </TextField>


                <TextField
                    margin="dense"
                    name="client"
                    label="Cliente"
                    select
                    fullWidth
                    value={formData.client || ''}
                    onChange={handleChange}
                >
                    {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                            {client.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    name="purchase_order"
                    label="Orden de Compra Relacionada"
                    select
                    fullWidth
                    value={formData.purchase_order || ''}
                    onChange={handleChange}
                    disabled={purchaseOrders.length === 0} // Disable if no purchase orders
                >
                    {purchaseOrders.map((po) => (
                        <MenuItem key={po.id} value={po.id}>
                            OC #{po.id}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="date" label="Fecha" type="date" fullWidth value={formData.date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="total_amount" label="Monto Total" type="number" fullWidth value={formData.total_amount || ''} onChange={handleChange} />
                
                <TextField
                    margin="dense"
                    name="status"
                    label="Estado"
                    select
                    fullWidth
                    value={formData.status || ''}
                    onChange={handleChange}
                >
                    {INVOICE_STATUS_CHOICES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
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

// Main Invoice Management Component
const InvoiceManagement = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const { tenantId } = useAuth();

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await api.list('/invoices/');
            const invoiceList = Array.isArray(data) ? data : data.results;
            setInvoices(invoiceList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las facturas. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchInvoices();
        }
    }, [tenantId]);

    const handleOpenForm = (invoice = null) => {
        setSelectedInvoice(invoice);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedInvoice(null);
        setIsFormOpen(false);
    };

    const handleSave = async (invoiceData) => {
        try {
            const dataToSend = {
                ...invoiceData,
                client: invoiceData.client || null,
                sale: invoiceData.sale || null,
                purchase_order: invoiceData.purchase_order || null,
            };

            if (selectedInvoice) {
                await api.update('/invoices/', selectedInvoice.id, dataToSend);
            } else {
                await api.create('/invoices/', dataToSend);
            }
            fetchInvoices(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la factura.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta factura?')) {
            try {
                await api.remove('/invoices/', id);
                fetchInvoices(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la factura.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Facturas</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Factura
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Factura ID</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Monto Total</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>{invoice.id}</TableCell>
                                    <TableCell>{invoice.client}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell>{invoice.total_amount}</TableCell>
                                    <TableCell>{invoice.status}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(invoice)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(invoice.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <InvoiceForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                invoice={selectedInvoice} 
            />
        </Box>
    );
};

export default InvoiceManagement;