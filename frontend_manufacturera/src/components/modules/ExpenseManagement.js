import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem,
    Select, InputLabel, FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Expense Form Dialog Component
const ExpenseForm = ({ open, onClose, onSave, expense }) => {
    const [formData, setFormData] = useState({});
    const [cashRegisters, setCashRegisters] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const [dependenciesError, setDependenciesError] = useState(null);
    const { tenantId } = useAuth();

    const EXPENSE_TYPE_CHOICES = [
        { value: 'Alquiler', label: 'Alquiler' },
        { value: 'Servicios', label: 'Servicios' },
        { value: 'Sueldos', label: 'Sueldos' },
        { value: 'Impuestos', label: 'Impuestos' },
        { value: 'Otros', label: 'Otros' },
    ];

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const data = await api.list('/cash-registers/');
                setCashRegisters(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                setDependenciesError('Error al cargar las cajas.');
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
        if (expense) {
            setFormData({
                ...expense,
                date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
                cash_register: expense.cash_register?.id || '',
            });
        } else {
            setFormData({
                type: '',
                description: '',
                amount: '',
                cash_register: '',
                date: new Date().toISOString().split('T')[0],
            });
        }
    }, [expense, open]);

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
            <DialogTitle>{expense ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        name="type"
                        value={formData.type || ''}
                        onChange={handleChange}
                        label="Tipo"
                    >
                        {EXPENSE_TYPE_CHOICES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth value={formData.description || ''} onChange={handleChange} />
                <TextField margin="dense" name="amount" label="Monto $" type="number" fullWidth value={formData.amount || ''} onChange={handleChange} />
                
                <FormControl fullWidth margin="dense">
                    <InputLabel>Caja</InputLabel>
                    <Select
                        name="cash_register"
                        value={formData.cash_register || ''}
                        onChange={handleChange}
                        label="Caja"
                    >
                        {cashRegisters.map((cr) => (
                            <MenuItem key={cr.id} value={cr.id}>
                                {cr.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField margin="dense" name="date" label="Fecha" type="date" fullWidth value={formData.date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Expense Management Component
const ExpenseManagement = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const { tenantId } = useAuth();

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await api.list('/transactions/?account__account_type=Egreso'); // Fetch only expense-type transactions
            const expenseList = Array.isArray(data) ? data : data.results;
            setExpenses(expenseList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los gastos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchExpenses();
        }
    }, [tenantId]);

    const handleOpenForm = (expense = null) => {
        setSelectedExpense(expense);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedExpense(null);
        setIsFormOpen(false);
    };

    const handleSave = async (expenseData) => {
        try {
            const dataToSend = {
                ...expenseData,
                cash_register: expenseData.cash_register || null,
                // Ensure we are setting the transaction type correctly if needed by the backend
            };

            if (selectedExpense) {
                await api.update('/transactions/', selectedExpense.id, dataToSend);
            } else {
                await api.create('/transactions/', dataToSend);
            }
            fetchExpenses(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el gasto.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
            try {
                await api.remove('/transactions/', id);
                fetchExpenses(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el gasto.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Gastos</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Gasto
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Monto</TableCell>
                                <TableCell>Caja</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{expense.type}</TableCell>
                                    <TableCell>{expense.description}</TableCell>
                                    <TableCell>{expense.amount}</TableCell>
                                    <TableCell>{expense.cash_register_name || expense.cash_register}</TableCell>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(expense)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(expense.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ExpenseForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                expense={selectedExpense} 
            />
        </Box>
    );
};

export default ExpenseManagement;
