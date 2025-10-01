import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, 
    Alert, Button, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';

// Form Dialog for Creating/Editing an Almacen (Warehouse)
const AlmacenForm = ({ open, onClose, onSave, almacen }) => {
    const [formData, setFormData] = useState({ name: '', factory: '' });
    const [factories, setFactories] = useState([]);
    const [loadingFactories, setLoadingFactories] = useState(true);

    // Cargar fábricas primero
    useEffect(() => {
        const fetchFactories = async () => {
            try {
                setLoadingFactories(true);
                const data = await api.list('/factories/');
                setFactories(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error('Error al cargar fábricas', err);
            } finally {
                setLoadingFactories(false);
            }
        };
        if (open) {
            fetchFactories();
        }
    }, [open]);

    // Setear formData después de que las fábricas se carguen
    useEffect(() => {
        if (!loadingFactories) {
            if (almacen) {
                setFormData({
                    name: almacen.name || '',
                    factory: almacen.factory || ''
                });
            } else {
                setFormData({ name: '', factory: '' });
            }
        }
    }, [almacen, loadingFactories]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{almacen ? 'Editar Almacén' : 'Nuevo Almacén'}</DialogTitle>
            <DialogContent>
                {loadingFactories ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            name="name" 
                            label="Nombre del Almacén" 
                            type="text" 
                            fullWidth 
                            value={formData.name} 
                            onChange={handleFormChange} 
                            required 
                        />
                        
                        <FormControl fullWidth required>
                            <InputLabel>Fábrica</InputLabel>
                            <Select
                                name="factory"
                                value={formData.factory}
                                label="Fábrica"
                                onChange={handleFormChange}
                            >
                                <MenuItem value=""><em>Seleccione una fábrica</em></MenuItem>
                                {factories.map((factory) => (
                                    <MenuItem key={factory.id} value={factory.id}>
                                        {factory.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={handleSubmit} 
                    disabled={loadingFactories || !formData.name || !formData.factory}
                >
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const AlmacenesManagement = () => {
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAlmacen, setSelectedAlmacen] = useState(null);

    const fetchAlmacenes = async () => {
        try {
            setLoading(true);
            const data = await api.list('/locals/');
            setAlmacenes(data.results || (Array.isArray(data) ? data : []));
            setError(null);
        } catch (err) {
            setError('Error al cargar los almacenes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlmacenes();
    }, []);

    const handleOpenForm = (almacen = null) => {
        setSelectedAlmacen(almacen);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedAlmacen(null);
        setIsFormOpen(false);
    };

    const handleSave = async (formData) => {
        try {
            if (selectedAlmacen) {
                await api.update('/locals/', selectedAlmacen.id, formData);
            } else {
                await api.create('/locals/', formData);
            }
            fetchAlmacenes();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el almacén.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este almacén? Esta acción no se puede deshacer.')) {
            try {
                await api.remove('/locals/', id);
                fetchAlmacenes();
            } catch (err) {
                setError('Error al eliminar el almacén.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Almacenes</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
                    Nuevo Almacén
                </Button>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Dirección</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {almacenes.map((almacen) => (
                                <TableRow key={almacen.id}>
                                    <TableCell>{almacen.id}</TableCell>
                                    <TableCell>{almacen.name}</TableCell>
                                    <TableCell>{almacen.address || '-'}</TableCell>
                                    <TableCell>{almacen.phone_number || '-'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(almacen)} title="Editar Almacén">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(almacen.id)} title="Eliminar Almacén">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {isFormOpen && (
                <AlmacenForm 
                    open={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={handleSave}
                    almacen={selectedAlmacen}
                />
            )}
        </Box>
    );
};

export default AlmacenesManagement;