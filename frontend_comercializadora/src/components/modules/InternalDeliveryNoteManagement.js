import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField, CircularProgress, Alert,
    Select, InputLabel, FormControl, MenuItem, Grid, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const InternalDeliveryNoteForm = ({ open, onClose, onSave, deliveryNote }) => {
    const [formData, setFormData] = useState({ origin_warehouse: '', destination_warehouse: '', items: [] });
    const [commercialProducts, setCommercialProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [commercialProductsData, warehousesData] = await Promise.all([
                    api.list('commercial/commercial-products/'),
                    api.list('/warehouses/'),
                ]);
                setCommercialProducts(Array.isArray(commercialProductsData) ? commercialProductsData : commercialProductsData.results || []);
                setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.results || []);
            } catch (err) {
                console.error('Error fetching dependencies', err);
            } finally {
                setLoadingDependencies(false);
            }
        };
        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (deliveryNote) {
            setFormData({
                origin_warehouse: deliveryNote.origin_warehouse || '',
                destination_warehouse: deliveryNote.destination_warehouse || '',
                items: deliveryNote.items.map(item => ({
                    commercial_product: item.commercial_product || '',
                    quantity: item.quantity || 1,
                })) || [],
            });
        } else {
            setFormData({ origin_warehouse: '', destination_warehouse: '', items: [] });
        }
    }, [deliveryNote, open]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { product: '', quantity: 1 }] }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = () => {
        const submissionData = {
            ...formData,
            origin_warehouse: formData.origin_warehouse || null,
            destination_warehouse: formData.destination_warehouse || null,
            items: formData.items.map(item => ({
                commercial_product: item.commercial_product,
                quantity: item.quantity,
            })),
        };
        onSave(submissionData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{deliveryNote ? 'Editar Remito Interno' : 'Nuevo Remito Interno'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Almacén de Origen</InputLabel>
                            <Select name="origin_warehouse" value={formData.origin_warehouse} onChange={handleFormChange} label="Almacén de Origen">
                                {warehouses.map(warehouse => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Almacén de Destino</InputLabel>
                            <Select name="destination_warehouse" value={formData.destination_warehouse} onChange={handleFormChange} label="Almacén de Destino">
                                {warehouses.map(warehouse => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Typography sx={{ mt: 2, mb: 1 }}>Items</Typography>
                <Stack spacing={2}>
                    {formData.items.map((item, index) => (
                        <Grid container spacing={2} key={index} alignItems="center">
                            <Grid item xs={5}>
                                <FormControl fullWidth>
                                    <InputLabel>Producto Comercial</InputLabel>
                                    <Select value={item.commercial_product} onChange={(e) => handleItemChange(index, 'commercial_product', e.target.value)} label="Producto Comercial">
                                        {commercialProducts.map(product => <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <TextField label="Cantidad" type="number" fullWidth value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                            </Grid>
                            <Grid item xs={1}>
                                <IconButton onClick={() => removeItem(index)}><DeleteIcon /></IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </Stack>
                <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 1 }}>Añadir Item</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

const InternalDeliveryNoteManagement = () => {
    const { tenantId } = useAuth();
    const [deliveryNotes, setDeliveryNotes] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);

    const fetchDeliveryNotes = async () => {
        try {
            setLoading(true);
            const deliveryNotesData = await api.list('commercial/internal-delivery-notes/');
            const deliveryNoteList = Array.isArray(deliveryNotesData) ? deliveryNotesData : deliveryNotesData.results;
            setDeliveryNotes(deliveryNoteList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los remitos. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchDeliveryNotes();
        }
    }, [tenantId]);

    const handleOpenForm = (deliveryNote = null) => {
        setSelectedDeliveryNote(deliveryNote);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedDeliveryNote(null);
        setIsFormOpen(false);
    };

    const handleSave = async (deliveryNoteData) => {
        try {
            if (selectedDeliveryNote) {
                await api.update('commercial/internal-delivery-notes/', selectedDeliveryNote.id, deliveryNoteData);
            } else {
                await api.create('commercial/internal-delivery-notes/', deliveryNoteData);
            }
            fetchDeliveryNotes();
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el remito.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este remito?')) {
            try {
                await api.remove('commercial/internal-delivery-notes/', id);
                fetchDeliveryNotes();
            } catch (err) {
                setError('Error al eliminar el remito.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Remitos Internos</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }} startIcon={<AddIcon />}>
                Nuevo Remito Interno
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Almacén de Origen</TableCell>
                                <TableCell>Almacén de Destino</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha de Creación</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {deliveryNotes.map((deliveryNote) => (
                                <TableRow key={deliveryNote.id}>
                                    <TableCell>{deliveryNote.id}</TableCell>
                                    <TableCell>{deliveryNote.origin_warehouse}</TableCell>
                                    <TableCell>{deliveryNote.destination_warehouse}</TableCell>
                                    <TableCell>{deliveryNote.status}</TableCell>
                                    <TableCell>{new Date(deliveryNote.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenForm(deliveryNote)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(deliveryNote.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <InternalDeliveryNoteForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                deliveryNote={selectedDeliveryNote}
            />
        </Box>
    );
};

export default InternalDeliveryNoteManagement;
