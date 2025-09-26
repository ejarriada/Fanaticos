import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BankForm from './BankForm'; // Import the new component

// Main Bank Management Component
const BankManagement = () => {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);
    const { tenantId } = useAuth();

    const fetchBanks = async () => {
        try {
            setLoading(true);
            const data = await api.list('/banks/');
            const bankList = Array.isArray(data) ? data : data.results;
            setBanks(bankList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los bancos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchBanks();
        }
    }, [tenantId]);

    const handleOpenForm = (bank = null) => {
        setSelectedBank(bank);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedBank(null);
        setIsFormOpen(false);
    };

    const handleSave = async (bankData) => {
        try {
            if (selectedBank) {
                await api.update('/banks/', selectedBank.id, bankData);
            } else {
                await api.create('/banks/', bankData);
            }
            fetchBanks(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el banco.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este banco?')) {
            try {
                await api.remove('/banks/', id);
                fetchBanks(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el banco.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Banco
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {banks.map((bank) => (
                                <TableRow key={bank.id}>
                                    <TableCell>{bank.name}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(bank)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(bank.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <BankForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                bank={selectedBank} 
            />
        </Box>
    );
};

export default BankManagement;
