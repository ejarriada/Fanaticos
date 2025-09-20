import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions, 
    DialogContent, DialogTitle, TextField, CircularProgress, Alert 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Local Form Dialog Component
const LocalForm = ({ open, onClose, onSave, local }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (local) {
            setFormData(local);
        } else {
            setFormData({
                name: '',
                address: '',
                phone_number: ''
            });
        }
    }, [local, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{local ? 'Editar Local' : 'Nuevo Local'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="address" label="Dirección" type="text" fullWidth value={formData.address || ''} onChange={handleChange} />
                <TextField margin="dense" name="phone_number" label="Número de Teléfono" type="text" fullWidth value={formData.phone_number || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Local Management Component
const LocalManagement = () => {
    const [locals, setLocals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLocal, setSelectedLocal] = useState(null);
    const { tenantId } = useAuth();

    const fetchLocals = async () => {
        try {
            setLoading(true);
            const data = await api.list('/locals/');
            const localList = Array.isArray(data) ? data : data.results;
            setLocals(localList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los locales. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchLocals();
        }
    }, [tenantId]);

    const handleOpenForm = (local = null) => {
        setSelectedLocal(local);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedLocal(null);
        setIsFormOpen(false);
    };

    const handleSave = async (localData) => {
        try {
            if (selectedLocal) {
                await api.update('/locals/', selectedLocal.id, localData);
            } else {
                await api.create('/locals/', localData);
            }
            fetchLocals(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el local.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este local?')) {
            try {
                await api.remove('/locals/', id);
                fetchLocals(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el local.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Locales</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nuevo Local
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Dirección</TableCell>
                                <TableCell>Número de Teléfono</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {locals.map((local) => (
                                <TableRow key={local.id}>
                                    <TableCell>{local.name}</TableCell>
                                    <TableCell>{local.address}</TableCell>
                                    <TableCell>{local.phone_number}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(local)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(local.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <LocalForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                local={selectedLocal} 
            />
        </Box>
    );
};

export default LocalManagement;
