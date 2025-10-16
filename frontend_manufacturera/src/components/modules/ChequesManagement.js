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
import { normalizeChequeFromBackend, normalizeChequeToBackend } from '../../utils/chequeTransformers';

const ChequesManagement = () => {
    const [cheques, setCheques] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState(null);
    const { tenantId } = useAuth();

    const fetchBanks = async () => {
        try {
            console.log('🏦 Cargando bancos...');
            setLoadingBanks(true);
            const banksResponse = await api.list('/banks/');
            
            // Manejo flexible de la respuesta
            let banksList = [];
            if (Array.isArray(banksResponse)) {
                banksList = banksResponse;
            } else if (banksResponse?.results && Array.isArray(banksResponse.results)) {
                banksList = banksResponse.results;
            } else if (banksResponse?.data && Array.isArray(banksResponse.data)) {
                banksList = banksResponse.data;
            }
            
            console.log('✅ Bancos cargados:', banksList);
            setBanks(banksList);
        } catch (err) {
            console.error('❌ Error al cargar bancos:', err);
            setError('Error al cargar los bancos.');
        } finally {
            setLoadingBanks(false);
        }
    };

    const fetchCheques = async () => {
        try {
            console.log('💳 Cargando cheques...');
            setLoading(true);
            const chequesResponse = await api.list('/checks/');
            
            // Manejo flexible de la respuesta
            let chequeList = [];
            if (Array.isArray(chequesResponse)) {
                chequeList = chequesResponse;
            } else if (chequesResponse?.results && Array.isArray(chequesResponse.results)) {
                chequeList = chequesResponse.results;
            } else if (chequesResponse?.data && Array.isArray(chequesResponse.data)) {
                chequeList = chequesResponse.data;
            }

            console.log('✅ Cheques cargados (raw):', chequeList);
            const normalizedCheques = chequeList.map(normalizeChequeFromBackend);
            console.log('✅ Cheques normalizados:', normalizedCheques);
            
            setCheques(normalizedCheques);
            setError(null);
        } catch (err) {
            setError('Error al cargar los cheques. Por favor, intente de nuevo.');
            console.error('❌ Error fetching cheques:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchBanks();
            fetchCheques();
        }
    }, [tenantId]);

    const getBankName = (bankId) => {
        if (!bankId) return '-';
        if (!banks || banks.length === 0) {
            console.warn('⚠️ Bancos aún no cargados');
            return `ID: ${bankId}`;
        }
        
        const bank = banks.find(b => b.id === parseInt(bankId));
        return bank ? bank.name : `ID: ${bankId}`;
    };

    const handleOpenForm = (cheque = null) => {
        if (cheque) {
            console.log('📝 Editando cheque:', cheque);
            console.log('🏦 Bancos disponibles:', banks);
            
            // El cheque ya viene normalizado desde fetchCheques
            setSelectedCheque(cheque);
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
            console.log('💾 Guardando cheque (frontend):', chequeData);
            const dataToSend = normalizeChequeToBackend(chequeData);
            console.log('📤 Datos a enviar (backend format):', dataToSend);

            if (selectedCheque && selectedCheque.id) {
                await api.update('/checks/', selectedCheque.id, dataToSend);
                setSuccessMessage('Cheque actualizado exitosamente');
            } else {
                await api.create('/checks/', dataToSend);
                setSuccessMessage('Cheque creado exitosamente');
            }
            
            await fetchCheques();
            handleCloseForm();
        } catch (err) {
            console.error('❌ Error al guardar:', err);
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el cheque.';
            setError(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cheque?')) {
            try {
                console.log('🗑️ Eliminando cheque ID:', id);
                await api.remove('/checks/', id);
                setSuccessMessage('Cheque eliminado exitosamente');
                await fetchCheques();
            } catch (err) {
                console.error('❌ Error al eliminar:', err);
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

    if (loading || loadingBanks) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

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

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

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

            <ChequeDialog 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                cheque={selectedCheque} 
                banks={banks}
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