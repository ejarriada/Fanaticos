import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert, MenuItem 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// BankStatement Form Dialog Component
const BankStatementForm = ({ open, onClose, onSave, bankStatement }) => {
    const [formData, setFormData] = useState({});
    const [banks, setBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [banksError, setBanksError] = useState(null);
    const { tenantId } = useAuth();
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                setLoadingBanks(true);
                const data = await api.list('/banks/');
                const bankList = Array.isArray(data) ? data : data.results;
                setBanks(bankList || []);
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
        if (bankStatement) {
            setFormData({
                ...bankStatement,
                statement_date: bankStatement.statement_date ? new Date(bankStatement.statement_date).toISOString().split('T')[0] : '',
                bank: bankStatement.bank?.id || '',
            });
        } else {
            setFormData({
                bank: '',
                statement_date: new Date().toISOString().split('T')[0],
                file: null
            });
        }
    }, [bankStatement, open]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setFormData({ ...formData, file: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = () => {
        const dataToSave = new FormData();
        dataToSave.append('bank', formData.bank);
        dataToSave.append('statement_date', formData.statement_date);
        if (formData.file) {
            dataToSave.append('file', formData.file);
        }
        // If updating and no new file is selected, don't send the file field
        // The backend will keep the existing file

        onSave(dataToSave, bankStatement ? bankStatement.id : null);
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
            <DialogTitle>{bankStatement ? 'Editar Extracto Bancario' : 'Nuevo Extracto Bancario'}</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    name="bank"
                    label="Banco"
                    select
                    fullWidth
                    value={formData.bank || ''}
                    onChange={handleChange}
                >
                    {banks.map((bank) => (
                        <MenuItem key={bank.id} value={bank.id}>
                            {bank.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField margin="dense" name="statement_date" label="Fecha del Extracto" type="date" fullWidth value={formData.statement_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                
                <Button
                    variant="contained"
                    component="label"
                    sx={{ mt: 2 }}
                >
                    {bankStatement && bankStatement.file ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
                    <input type="file" name="file" hidden onChange={handleChange} ref={fileInputRef} />
                </Button>
                {formData.file && typeof formData.file === 'object' && formData.file.name && (
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                        {formData.file.name}
                    </Typography>
                )}
                {bankStatement && bankStatement.file && typeof formData.file === 'string' && (
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                        Archivo actual: <a href={bankStatement.file} target="_blank" rel="noopener noreferrer">{bankStatement.file.split('/').pop()}</a>
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main BankStatement Management Component
const BankStatementManagement = () => {
    const [bankStatements, setBankStatements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBankStatement, setSelectedBankStatement] = useState(null);
    const { tenantId } = useAuth();

    const fetchBankStatements = async () => {
        try {
            setLoading(true);
            const data = await api.list('/bank-statements/');
            const bankStatementList = Array.isArray(data) ? data : data.results;
            setBankStatements(bankStatementList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los extractos bancarios. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchBankStatements();
        }
    }, [tenantId]);

    const handleOpenForm = (bankStatement = null) => {
        setSelectedBankStatement(bankStatement);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedBankStatement(null);
        setIsFormOpen(false);
    };

    const handleSave = async (formData, id = null) => {
        try {
            // Pass an empty config object for JSON data, or specific headers for FormData
            const config = {};
            if (formData instanceof FormData) {
                // Axios automatically sets Content-Type to multipart/form-data for FormData
                // No need to set headers explicitly here
            }

            if (id) {
                await api.update('/bank-statements/', id, formData, config);
            } else {
                await api.create('/bank-statements/', formData, config);
            }
            fetchBankStatements(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el extracto bancario.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este extracto bancario?')) {
            try {
                await api.remove('/bank-statements/', id);
                fetchBankStatements(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el extracto bancario.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Extractos Bancarios</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Extracto Bancario
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Banco</TableCell>
                                <TableCell>Fecha del Extracto</TableCell>
                                <TableCell>Archivo</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bankStatements.map((bankStatement) => (
                                <TableRow key={bankStatement.id}>
                                    <TableCell>{bankStatement.bank_name || bankStatement.bank}</TableCell>
                                    <TableCell>{bankStatement.statement_date}</TableCell>
                                    <TableCell>
                                        {bankStatement.file ? (
                                            <a href={bankStatement.file} target="_blank" rel="noopener noreferrer">
                                                <IconButton><DownloadIcon /></IconButton>
                                                {bankStatement.file.split('/').pop()}
                                            </a>
                                        ) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(bankStatement)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(bankStatement.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <BankStatementForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                bankStatement={selectedBankStatement} 
            />
        </Box>
    );
};

export default BankStatementManagement;
