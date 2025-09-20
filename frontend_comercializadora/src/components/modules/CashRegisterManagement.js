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

// CashRegister Form Dialog Component
const CashRegisterForm = ({ open, onClose, onSave, cashRegister }) => {
    const [formData, setFormData] = useState({});
    const [locals, setLocals] = useState([]);
    const [loadingLocals, setLoadingLocals] = useState(true);
    const [localsError, setLocalsError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchLocals = async () => {
            try {
                setLoadingLocals(true);
                const data = await api.list('/locals/');
                const localList = Array.isArray(data) ? data : data.results;
                setLocals(localList || []);
            } catch (err) {
                setLocalsError('Error al cargar los locales.');
                console.error(err);
            } finally {
                setLoadingLocals(false);
            }
        };

        if (tenantId) {
            fetchLocals();
        }
    }, [tenantId]);

    useEffect(() => {
        if (cashRegister) {
            setFormData(cashRegister);
        } else {
            setFormData({
                name: '',
                local: ''
            });
        }
    }, [cashRegister, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{cashRegister ? 'Editar Caja' : 'Nueva Caja'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                {loadingLocals ? (
                    <CircularProgress size={24} />
                ) : localsError ? (
                    <Alert severity="error">{localsError}</Alert>
                ) : (
                    <TextField
                        margin="dense"
                        name="local"
                        label="Local"
                        select
                        fullWidth
                        value={formData.local || ''}
                        onChange={handleChange}
                    >
                        {locals.map((local) => (
                            <MenuItem key={local.id} value={local.id}>
                                {local.name}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main CashRegister Management Component
const CashRegisterManagement = () => {
    const [cashRegisters, setCashRegisters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCashRegister, setSelectedCashRegister] = useState(null);
    const { tenantId } = useAuth();

    const fetchCashRegisters = async () => {
        try {
            setLoading(true);
            const data = await api.list('/cash-registers/');
            const cashRegisterList = Array.isArray(data) ? data : data.results;
            setCashRegisters(cashRegisterList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las cajas. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchCashRegisters();
        }
    }, [tenantId]);

    const handleOpenForm = (cashRegister = null) => {
        setSelectedCashRegister(cashRegister);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedCashRegister(null);
        setIsFormOpen(false);
    };

    const handleSave = async (cashRegisterData) => {
        try {
            // Ensure local is sent as an ID
            const dataToSend = { ...cashRegisterData, local: cashRegisterData.local };

            if (selectedCashRegister) {
                await api.update('/cash-registers/', selectedCashRegister.id, dataToSend);
            } else {
                await api.create('/cash-registers/', dataToSend);
            }
            fetchCashRegisters(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la caja.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta caja?')) {
            try {
                await api.remove('/cash-registers/', id);
                fetchCashRegisters(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la caja.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Cajas</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Caja
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Local</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cashRegisters.map((cashRegister) => (
                                <TableRow key={cashRegister.id}>
                                    <TableCell>{cashRegister.name}</TableCell>
                                    <TableCell>{cashRegister.local_name || cashRegister.local}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(cashRegister)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(cashRegister.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <CashRegisterForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                cashRegister={selectedCashRegister} 
            />
        </Box>
    );
};

export default CashRegisterManagement;
