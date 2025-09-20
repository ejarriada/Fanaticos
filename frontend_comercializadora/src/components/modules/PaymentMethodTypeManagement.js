import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// PaymentMethodType Form Dialog Component
const PaymentMethodTypeForm = ({ open, onClose, onSave, paymentMethodType }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (paymentMethodType) {
            setFormData(paymentMethodType);
        } else {
            setFormData({
                name: '',
                description: ''
            });
        }
    }, [paymentMethodType, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{paymentMethodType ? 'Editar Tipo de Pago' : 'Nuevo Tipo de Pago'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main PaymentMethodType Management Component
const PaymentMethodTypeManagement = () => {
    const [paymentMethodTypes, setPaymentMethodTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState(null);
    const { tenantId } = useAuth();

    const fetchPaymentMethodTypes = async () => {
        try {
            setLoading(true);
            const data = await api.list('/payment-method-types/');
            const paymentMethodTypeList = Array.isArray(data) ? data : data.results;
            setPaymentMethodTypes(paymentMethodTypeList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los tipos de pago. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchPaymentMethodTypes();
        }
    }, [tenantId]);

    const handleOpenForm = (paymentMethodType = null) => {
        setSelectedPaymentMethodType(paymentMethodType);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedPaymentMethodType(null);
        setIsFormOpen(false);
    };

    const handleSave = async (paymentMethodTypeData) => {
        try {
            if (selectedPaymentMethodType) {
                await api.update('/payment-method-types/', selectedPaymentMethodType.id, paymentMethodTypeData);
            } else {
                await api.create('/payment-method-types/', paymentMethodTypeData);
            }
            fetchPaymentMethodTypes(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el tipo de pago.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este tipo de pago?')) {
            try {
                await api.remove('/payment-method-types/', id);
                fetchPaymentMethodTypes(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el tipo de pago.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Tipos de Pago</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Tipo de Pago
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paymentMethodTypes.map((paymentMethodType) => (
                                <TableRow key={paymentMethodType.id}>
                                    <TableCell>{paymentMethodType.name}</TableCell>
                                    <TableCell>{paymentMethodType.description}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(paymentMethodType)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(paymentMethodType.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <PaymentMethodTypeForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                paymentMethodType={selectedPaymentMethodType} 
            />
        </Box>
    );
};

export default PaymentMethodTypeManagement;
