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

// Cheque Form Dialog Component
const ChequeForm = ({ open, onClose, onSave, cheque }) => {
    const [formData, setFormData] = useState({});
    const [banks, setBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [banksError, setBanksError] = useState(null);
    const { tenantId } = useAuth();

    const CHEQUE_STATUS_CHOICES = [
        { value: 'CARGADO', label: 'Cargado' },
        { value: 'ENTREGADO', label: 'Entregado' },
        { value: 'RECHAZADO', label: 'Rechazado' },
        { value: 'COBRADO', label: 'Cobrado' },
        { value: 'ANULADO', label: 'Anulado' },
    ];

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                setLoadingBanks(true);
                const data = await api.list('/banks/');
                setBanks(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                setBanksError('Error al cargar los bancos.');
                console.error(err);
            } finally {
                setLoadingBanks(false);
            }
        };

        if (tenantId) {
            fetchBanks();
        }
    }, [tenantId]);

    useEffect(() => {
        if (cheque) {
            setFormData({
                ...cheque,
                due_date: cheque.due_date ? new Date(cheque.due_date).toISOString().split('T')[0] : '',
                bank: cheque.bank?.id || '',
            });
        } else {
            setFormData({
                number: '',
                amount: '',
                bank: '',
                issuer: '',
                cuit: '',
                due_date: '',
                recipient: '',
                received_from: '',
                observations: '',
                status: 'CARGADO',
            });
        }
    }, [cheque, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingBanks) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent><CircularProgress /></DialogContent>
            </Dialog>
        );
    }

    if (banksError) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent><Alert severity="error">{banksError}</Alert></DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{cheque ? 'Editar Cheque' : 'Nuevo Cheque'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="number" label="Número" type="text" fullWidth value={formData.number || ''} onChange={handleChange} />
                <TextField margin="dense" name="amount" label="Monto $" type="number" fullWidth value={formData.amount || ''} onChange={handleChange} />
                
                <FormControl fullWidth margin="dense">
                    <InputLabel>Banco</InputLabel>
                    <Select
                        name="bank"
                        value={formData.bank || ''}
                        onChange={handleChange}
                        label="Banco"
                    >
                        {banks.map((bank) => (
                            <MenuItem key={bank.id} value={bank.id}>
                                {bank.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField margin="dense" name="issuer" label="Emisor" type="text" fullWidth value={formData.issuer || ''} onChange={handleChange} />
                <TextField margin="dense" name="cuit" label="CUIT" type="text" fullWidth value={formData.cuit || ''} onChange={handleChange} />
                <TextField margin="dense" name="due_date" label="Vencimiento" type="date" fullWidth value={formData.due_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField margin="dense" name="recipient" label="Receptor" type="text" fullWidth value={formData.recipient || ''} onChange={handleChange} />
                <TextField margin="dense" name="received_from" label="Recibido de" type="text" fullWidth value={formData.received_from || ''} onChange={handleChange} />
                <TextField margin="dense" name="observations" label="Observaciones" type="text" fullWidth value={formData.observations || ''} onChange={handleChange} multiline rows={2} />
                
                <FormControl fullWidth margin="dense">
                    <InputLabel>Estado</InputLabel>
                    <Select
                        name="status"
                        value={formData.status || ''}
                        onChange={handleChange}
                        label="Estado"
                    >
                        {CHEQUE_STATUS_CHOICES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

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
            const data = await api.list('/cheques/'); // Assuming a /cheques/ endpoint
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
                await api.update('/cheques/', selectedCheque.id, dataToSend);
            } else {
                await api.create('/cheques/', dataToSend);
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
                await api.remove('/cheques/', id);
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

            <ChequeForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                cheque={selectedCheque} 
            />
        </Box>
    );
};

export default ChequesManagement;
