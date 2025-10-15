import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert, Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ChequeDialog from '../common/ChequeDialog';
import { normalizeChequeFromBackend, normalizeChequeToBackend } from '../../utils/chequeTransformers'; // Importar desde el nuevo archivo

const ChequesManagement = () => {
    const [cheques, setCheques] = useState([]);
    const [banks, setBanks] = useState([]); // Estado para los bancos
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState(null);
    const { tenantId } = useAuth();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [chequesResponse, banksResponse] = await Promise.all([
                api.list('/checks/'),
                api.list('/banks/')
            ]);

            const chequeList = Array.isArray(chequesResponse.results) ? chequesResponse.results : [];
            setCheques(chequeList.map(normalizeChequeFromBackend));

            const banksList = Array.isArray(banksResponse.results) ? banksResponse.results : [];
            setBanks(banksList);

            setError(null);
        } catch (err) {
            setError('Error al cargar los datos. Por favor, intente de nuevo.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchData();
        }
    }, [tenantId]);

    const getBankName = (bankId) => {
        console.log("getBankName - bankId:", bankId, "banks:", banks);
        if (!banks.length) return bankId; // Devuelve ID si los bancos no se han cargado
        const bank = banks.find(b => b.id === bankId);
        return bank ? bank.name : bankId; // Devuelve ID si no se encuentra el banco
    };

    const handleOpenForm = (cheque = null) => {
        if (cheque) {
            console.log('📝 Editando cheque:', cheque);
            
            // Normalizar el objeto cheque para asegurar compatibilidad
            const normalizedCheque = {
                id: cheque.id,
                number: cheque.number || '',
                amount: cheque.amount || '',
                bank: typeof cheque.bank === 'object' ? cheque.bank?.id : cheque.bank,
                issuer: cheque.issuer || '',
                cuit: cheque.cuit || '',
                due_date: cheque.due_date || '',
                recipient: cheque.recipient || '',
                received_from: cheque.received_from || '',
                observations: cheque.observations || '',
                status: cheque.status || 'CARGADO'
            };
            
            console.log('📝 Cheque normalizado:', normalizedCheque);
            setSelectedCheque(normalizedCheque);
        } else {
            console.log('➕ Nuevo cheque');
            setSelectedCheque(null);
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedCheque(null);
        setIsFormOpen(false);
        setError(null);
    };

    const handleSave = async (chequeData) => {
        try {
            const dataToSend = normalizeChequeToBackend(chequeData);

            if (selectedCheque && selectedCheque.id) {
                await api.update('/checks/', selectedCheque.id, dataToSend);
            } else {
                await api.create('/checks/', dataToSend);
            }
            fetchData(); // La lista se normalizará al obtenerla
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
                console.log('🗑️ Eliminando cheque ID:', id);
                await api.remove('/checks/', id);
                setSuccessMessage('Cheque eliminado exitosamente');
                await fetchData();
            } catch (err) {
                console.error('❌ Error al eliminar cheque:', err);
                setError('Error al eliminar el cheque.');
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Cheques</Typography>
            
            <Button 
                variant="contained" 
                onClick={() => handleOpenForm()} 
                sx={{ mb: 2 }}
            >
                Nuevo Cheque
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

            {!loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Número</strong></TableCell>
                                <TableCell><strong>Monto</strong></TableCell>
                                <TableCell><strong>Banco</strong></TableCell>
                                <TableCell><strong>Emisor</strong></TableCell>
                                <TableCell><strong>Vencimiento</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cheques.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography color="text.secondary">
                                            No hay cheques registrados
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cheques.map((cheque) => (
                                    <TableRow key={cheque.id} hover>
                                        <TableCell>{cheque.number}</TableCell>
                                        <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                                        <TableCell>{getBankName(cheque.bank)}</TableCell>
                                        <TableCell>{cheque.issuer || '-'}</TableCell>
                                        <TableCell>{formatDate(cheque.due_date)}</TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    display: 'inline-block',
                                                    backgroundColor: 
                                                        cheque.status === 'CARGADO' ? '#fff3e0' :
                                                        cheque.status === 'ENTREGADO' ? '#e8f5e9' :
                                                        cheque.status === 'COBRADO' ? '#e3f2fd' :
                                                        cheque.status === 'RECHAZADO' ? '#ffebee' :
                                                        '#f5f5f5',
                                                    color:
                                                        cheque.status === 'CARGADO' ? '#e65100' :
                                                        cheque.status === 'ENTREGADO' ? '#2e7d32' :
                                                        cheque.status === 'COBRADO' ? '#1565c0' :
                                                        cheque.status === 'RECHAZADO' ? '#c62828' :
                                                        '#616161'
                                                }}
                                            >
                                                {cheque.status}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton 
                                                onClick={() => handleOpenForm(cheque)}
                                                color="primary"
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => handleDelete(cheque.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ChequeDialog 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                cheque={selectedCheque} 
                banks={banks} // Pasar la lista de bancos
            />

            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
            />
        </Box>
    );
};

export default ChequesManagement;