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
    const [formData, setFormData] = useState({ name: '', address: '', phone_number: '' });

    useEffect(() => {
        if (almacen) {
            setFormData({
                name: almacen.name || '',
                address: almacen.address || '',
                phone_number: almacen.phone_number || ''
            });
        } else {
            setFormData({ name: '', address: '', phone_number: '' });
        }
    }, [almacen, open]);

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
                <TextField margin="dense" name="name" label="Nombre del Almacén" type="text" fullWidth value={formData.name} onChange={handleFormChange} required />
                <TextField margin="dense" name="address" label="Dirección" type="text" fullWidth value={formData.address} onChange={handleFormChange} />
                <TextField margin="dense" name="phone_number" label="Teléfono" type="text" fullWidth value={formData.phone_number} onChange={handleFormChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
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