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

// FinancialCostRule Form Dialog Component
const FinancialCostRuleForm = ({ open, onClose, onSave, financialCostRule }) => {
    const [formData, setFormData] = useState({});
    const [paymentMethodTypes, setPaymentMethodTypes] = useState([]);
    const [loadingPaymentMethodTypes, setLoadingPaymentMethodTypes] = useState(true);
    const [paymentMethodTypesError, setPaymentMethodTypesError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchPaymentMethodTypes = async () => {
            try {
                setLoadingPaymentMethodTypes(true);
                const data = await api.list('/payment-method-types/');
                const paymentMethodTypeList = Array.isArray(data) ? data : data.results;
                setPaymentMethodTypes(paymentMethodTypeList || []);
            } catch (err) {
                setPaymentMethodTypesError('Error al cargar los tipos de método de pago.');
                console.error(err);
            } finally {
                setLoadingPaymentMethodTypes(false);
            }
        };

        if (tenantId) {
            fetchPaymentMethodTypes();
        }
    }, [tenantId]);

    useEffect(() => {
        if (financialCostRule) {
            setFormData({
                ...financialCostRule,
                payment_method: financialCostRule.payment_method?.id || '',
            });
        } else {
            setFormData({
                name: '',
                payment_method: '',
                percentage: ''
            });
        }
    }, [financialCostRule, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{financialCostRule ? 'Editar Regla de Costo Financiero' : 'Nueva Regla de Costo Financiero'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                
                <TextField
                    margin="dense"
                    name="payment_method"
                    label="Método de Pago"
                    select
                    fullWidth
                    value={formData.payment_method || ''}
                    onChange={handleChange}
                >
                    {paymentMethodTypes.map((pmt) => (
                        <MenuItem key={pmt.id} value={pmt.id}>
                            {pmt.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="percentage" label="Porcentaje" type="number" fullWidth value={formData.percentage || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main FinancialCostRule Management Component
const FinancialCostRuleManagement = () => {
    const [financialCostRules, setFinancialCostRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedFinancialCostRule, setSelectedFinancialCostRule] = useState(null);
    const { tenantId } = useAuth();

    const fetchFinancialCostRules = async () => {
        try {
            setLoading(true);
            const data = await api.list('/financial-cost-rules/');
            const financialCostRuleList = Array.isArray(data) ? data : data.results;
            setFinancialCostRules(financialCostRuleList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las reglas de costo financiero. Por favor, intente de nuevo.');
            console.error(err);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchFinancialCostRules();
        }
    }, [tenantId]);

    const handleOpenForm = (financialCostRule = null) => {
        setSelectedFinancialCostRule(financialCostRule);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedFinancialCostRule(null);
        setIsFormOpen(false);
    };

    const handleSave = async (financialCostRuleData) => {
        try {
            const dataToSend = {
                ...financialCostRuleData,
                payment_method: financialCostRuleData.payment_method || null,
            };

            if (selectedFinancialCostRule) {
                await api.update('/financial-cost-rules/', selectedFinancialCostRule.id, dataToSend);
            } else {
                await api.create('/financial-cost-rules/', dataToSend);
            }
            fetchFinancialCostRules(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la regla de costo financiero.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta regla de costo financiero?')) {
            try {
                await api.remove('/financial-cost-rules/', id);
                fetchFinancialCostRules(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la regla de costo financiero.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Reglas de Costo Financiero</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Regla de Costo Financiero
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Método de Pago</TableCell>
                                <TableCell>Porcentaje</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {financialCostRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>{rule.name}</TableCell>
                                    <TableCell>{rule.payment_method_name || rule.payment_method}</TableCell>
                                    <TableCell>{rule.percentage}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(rule)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(rule.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <FinancialCostRuleForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                financialCostRule={selectedFinancialCostRule} 
            />
        </Box>
    );
};

export default FinancialCostRuleManagement;