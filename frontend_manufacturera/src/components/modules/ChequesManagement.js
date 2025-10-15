import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ChequeDialog from '../common/ChequeDialog'; // Importar el componente reutilizable


// Main Cheques Management Component
const ChequesManagement = () => {
    const [cheques, setCheques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState(null);
    const { tenantId } = useAuth();

    const fetchCheques = async () => {
        try {
            setLoading(true);
            const data = await api.list('/checks/'); // Corrected endpoint
            const chequeList = Array.isArray(data) ? data : data.results;
            setCheques(chequeList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los cheques. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchCheques();
        }
    }, [tenantId]);

    const handleOpenForm = (cheque = null) => {
        setSelectedCheque(cheque);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedCheque(null);
        setIsFormOpen(false);
    };

    const handleSave = async (chequeData) => {
        try {
            const dataToSend = {
                ...chequeData,
                bank: chequeData.bank || null,
            };

            if (selectedCheque) {
                await api.update('/checks/', selectedCheque.id, dataToSend);
            } else {
                await api.create('/checks/', dataToSend);
            }
            fetchCheques(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el cheque.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cheque?')) {
            try {
                await api.remove('/checks/', id);
                fetchCheques(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el cheque.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Cheques</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Cheque
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Número</TableCell>
                                <TableCell>Monto</TableCell>
                                <TableCell>Banco</TableCell>
                                <TableCell>Emisor</TableCell>
                                <TableCell>Vencimiento</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cheques.map((cheque) => (
                                <TableRow key={cheque.id}>
                                    <TableCell>{cheque.number}</TableCell>
                                    <TableCell>{cheque.amount}</TableCell>
                                    <TableCell>{cheque.bank_name || cheque.bank}</TableCell>
                                    <TableCell>{cheque.issuer}</TableCell>
                                    <TableCell>{cheque.due_date}</TableCell>
                                    <TableCell>{cheque.status}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(cheque)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(cheque.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ChequeDialog 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                cheque={selectedCheque} 
            />
        </Box>
    );
};

export default ChequesManagement;
