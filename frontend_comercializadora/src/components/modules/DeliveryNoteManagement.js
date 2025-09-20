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

const DeliveryNoteForm = ({ open, onClose, onSave, deliveryNote }) => {
    const [formData, setFormData] = useState({ sale: '', items: [] });
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [salesData, productsData] = await Promise.all([
                    api.list('/sales/'),
                    api.list('/products/'),
                ]);
                setSales(Array.isArray(salesData) ? salesData : salesData.results || []);
                setProducts(Array.isArray(productsData) ? productsData : productsData.results || []);
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
                sale: deliveryNote.sale || '',
                items: deliveryNote.items || [],
            });
        } else {
            setFormData({ sale: '', items: [] });
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
            sale: formData.sale || null, // Send sale ID or null
        };
        onSave(submissionData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{deliveryNote ? 'Editar Remito' : 'Nuevo Remito'}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Venta</InputLabel>
                    <Select name="sale" value={formData.sale} onChange={handleFormChange} label="Venta">
                        {sales.map(sale => (
                            <MenuItem key={sale.id} value={sale.id}>{`Venta #${sale.id} - ${new Date(sale.sale_date).toLocaleDateString()}`}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography sx={{ mt: 2, mb: 1 }}>Items</Typography>
                <Stack spacing={2}>
                    {formData.items.map((item, index) => (
                        <Grid container spacing={2} key={index} alignItems="center">
                            <Grid item xs={5}>
                                <FormControl fullWidth>
                                    <InputLabel>Producto</InputLabel>
                                    <Select value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)} label="Producto">
                                        {products.map(product => <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>)}
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

const DeliveryNoteManagement = () => {
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
            const [deliveryNotesData, salesData] = await Promise.all([
                api.list('/delivery-notes/'),
                api.list('/sales/'),
            ]);
            const deliveryNoteList = Array.isArray(deliveryNotesData) ? deliveryNotesData : deliveryNotesData.results;
            const salesList = Array.isArray(salesData) ? salesData : salesData.results;
            setDeliveryNotes(deliveryNoteList || []);
            setSales(salesList || []);
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
                await api.update('/delivery-notes/', selectedDeliveryNote.id, deliveryNoteData);
            } else {
                await api.create('/delivery-notes/', deliveryNoteData);
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
                await api.remove('/delivery-notes/', id);
                fetchDeliveryNotes();
            } catch (err) {
                setError('Error al eliminar el remito.');
                console.error(err);
            }
        }
    };

    const getSaleInfo = (saleId) => {
        const sale = sales.find(s => s.id === saleId);
        return sale ? `Venta #${sale.id} - ${new Date(sale.sale_date).toLocaleDateString()}` : 'Desconocido';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Remitos</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }} startIcon={<AddIcon />}>
                Nuevo Remito
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Venta</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {deliveryNotes.map((deliveryNote) => (
                                <TableRow key={deliveryNote.id}>
                                    <TableCell>{deliveryNote.id}</TableCell>
                                    <TableCell>{getSaleInfo(deliveryNote.sale)}</TableCell>
                                    <TableCell>{new Date(deliveryNote.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{deliveryNote.status}</TableCell>
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

            <DeliveryNoteForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                deliveryNote={selectedDeliveryNote}
            />
        </Box>
    );
};

export default DeliveryNoteManagement;
