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

// Account Form Dialog Component
const AccountForm = ({ open, onClose, onSave, account }) => {
    const [formData, setFormData] = useState({});

    const ACCOUNT_TYPE_CHOICES = [
        { value: 'Activo', label: 'Activo' },
        { value: 'Pasivo', label: 'Pasivo' },
        { value: 'Patrimonio Neto', label: 'Patrimonio Neto' },
        { value: 'Ingreso', label: 'Ingreso' },
        { value: 'Egreso', label: 'Egreso' },
    ];

    useEffect(() => {
        if (account) {
            setFormData(account);
        } else {
            setFormData({
                name: '',
                account_type: '',
                code: ''
            });
        }
    }, [account, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{account ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField
                    margin="dense"
                    name="account_type"
                    label="Tipo de Cuenta"
                    select
                    fullWidth
                    value={formData.account_type || ''}
                    onChange={handleChange}
                >
                    {ACCOUNT_TYPE_CHOICES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField margin="dense" name="code" label="Código" type="text" fullWidth value={formData.code || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Account Management Component
const AccountManagement = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const { tenantId } = useAuth();

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.list('/accounts/');
            const accountList = Array.isArray(data) ? data : data.results;
            setAccounts(accountList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las cuentas. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchAccounts();
        }
    }, [tenantId]);

    const handleOpenForm = (account = null) => {
        setSelectedAccount(account);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedAccount(null);
        setIsFormOpen(false);
    };

    const handleSave = async (accountData) => {
        try {
            if (selectedAccount) {
                await api.update('/accounts/', selectedAccount.id, accountData);
            } else {
                await api.create('/accounts/', accountData);
            }
            fetchAccounts(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la cuenta.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta cuenta?')) {
            try {
                await api.remove('/accounts/', id);
                fetchAccounts(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la cuenta.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Cuentas</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Cuenta
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Tipo de Cuenta</TableCell>
                                <TableCell>Código</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell>{account.name}</TableCell>
                                    <TableCell>{account.account_type}</TableCell>
                                    <TableCell>{account.code}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(account)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(account.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <AccountForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                account={selectedAccount} 
            />
        </Box>
    );
};

export default AccountManagement;
