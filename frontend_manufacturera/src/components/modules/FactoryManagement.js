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

// Factory Form Dialog Component
const FactoryForm = ({ open, onClose, onSave, factory }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (factory) {
            setFormData(factory);
        } else {
            setFormData({
                name: '',
                location: ''
            });
        }
    }, [factory, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{factory ? 'Editar Fábrica' : 'Nueva Fábrica'}</DialogTitle>
            <DialogContent>
                <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                <TextField margin="dense" name="location" label="Ubicación" type="text" fullWidth value={formData.location || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Factory Management Component
const FactoryManagement = () => {
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedFactory, setSelectedFactory] = useState(null);
    const { tenantId } = useAuth();

    const fetchFactories = async () => {
        try {
            setLoading(true);
            const data = await api.list('/factories/');
            const factoryList = Array.isArray(data) ? data : data.results;
            setFactories(factoryList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las fábricas. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchFactories();
        }
    }, [tenantId]);

    const handleOpenForm = (factory = null) => {
        setSelectedFactory(factory);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedFactory(null);
        setIsFormOpen(false);
    };

    const handleSave = async (factoryData) => {
        try {
            if (selectedFactory) {
                await api.update('/factories/', selectedFactory.id, factoryData);
            } else {
                await api.create('/factories/', factoryData);
            }
            fetchFactories(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la fábrica.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta fábrica?')) {
            try {
                await api.remove('/factories/', id);
                fetchFactories(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la fábrica.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Fábricas</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
                Nueva Fábrica
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Ubicación</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {factories.map((factory) => (
                                <TableRow key={factory.id}>
                                    <TableCell>{factory.name}</TableCell>
                                    <TableCell>{factory.location}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(factory)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(factory.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <FactoryForm 
                open={isFormOpen} 
                onClose={handleCloseForm} 
                onSave={handleSave} 
                factory={selectedFactory} 
            />
        </Box>
    );
};

export default FactoryManagement;
