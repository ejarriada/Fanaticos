import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, 
    FormControl, InputLabel, Select, MenuItem, Typography, Box, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import * as api from '../../utils/api';

const ProductionOrderFormMedias = ({ open, onClose, onSave, order }) => {
    const [orderNotes, setOrderNotes] = useState([]);
    const [selectedOrderNote, setSelectedOrderNote] = useState(null);
    const [formData, setFormData] = useState({
        order_note_id: '',
        details: '',
        items: []
    });

    useEffect(() => {
        // Do nothing if the form is not open
        if (!open) {
            return;
        }

        const fetchDataAndSetForm = async () => {
            try {
                // 1. Fetch all common data
                const pendingNotesPromise = api.list('/order-notes/?status=Pendiente');
                
                let [pendingNotes] = await Promise.all([
                    pendingNotesPromise,
                ]);

                let allNotes = pendingNotes.results || pendingNotes || [];
                let noteForForm = null;

                // 2. If editing, fetch the specific note and add it to the list
                if (order && order.order_note?.id) {
                    const existingNote = await api.get('/order-notes/', order.order_note.id);
                    if (existingNote) {
                        noteForForm = existingNote;
                        if (!allNotes.some(note => note.id === existingNote.id)) {
                            allNotes = [existingNote, ...allNotes];
                        }
                    }
                }
                
                // 3. Update state for dropdowns
                setOrderNotes(allNotes);

                // 4. Set the form data state *after* all data is fetched
                if (order) {
                    setFormData({
                        order_note_id: order.order_note?.id || '',
                        details: order.details || '',
                        items: order.items || []
                    });
                    setSelectedOrderNote(noteForForm); // Use the note we just fetched
                } else {
                    // Reset form for 'new'
                    setFormData({ order_note_id: '', details: '', items: [] });
                    setSelectedOrderNote(null);
                }

            } catch (error) {
                console.error("Error setting up form", error);
            }
        };

        fetchDataAndSetForm();

    }, [open, order]);

    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'order_note_id') {
            const note = orderNotes.find(on => on.id === value);
            setSelectedOrderNote(note);
            setFormData(prev => ({ ...prev, items: [] })); // Reset items when order note changes
        }
    };

    const handleAddItem = (saleItem) => {
        const newItem = {
            product: saleItem.product.id, // Reference product by ID
            product_name: saleItem.product.name, // Keep name for display
            quantity: saleItem.quantity, // Default to sale quantity
            size: saleItem.product.size?.name || '', // Default to product's size name if available
            customizations: '' // Specific for Medias
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: updatedItems }));
    };

    const handleSave = () => {
        const payload = {
            order_note: formData.order_note_id,
            details: formData.details,
            op_type: 'Medias',
            items: formData.items.map(item => {
                const { product_name, ...rest } = item; // Destructure to remove product_name
                return {
                    ...rest,
                    product: item.product.id // Explicitly set product to its ID
                };
            }),
        };
        onSave(payload);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>{order ? 'Editar OP de Medias' : 'Nueva OP de Medias'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Order Note Selection */}
                    <Grid xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Nota de Pedido Asociada</InputLabel>
                            <Select
                                value={formData.order_note_id}
                                label="Nota de Pedido Asociada"
                                name="order_note_id"
                                onChange={handleGeneralChange}
                                disabled={!!order}
                            >
                                {orderNotes.map((note) => (
                                    <MenuItem key={note.id} value={note.id}>
                                        Nota #{note.id} (Cliente: {note.sale?.client?.name})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Sale Items from selected Order Note */}
                    {selectedOrderNote && (
                        <Grid xs={12}>
                            <Typography variant="h6">Productos de la Venta</Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell>Cantidad en Venta</TableCell>
                                            <TableCell>Acción</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedOrderNote.sale.items
                                            .filter(item => item.product.name.toLowerCase().includes('medias'))
                                            .map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.product.name}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleAddItem(item)} size="small">
                                                        <AddCircleOutlineIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    )}

                    {/* Items to be Produced */}
                    <Grid xs={12}>
                        <Typography variant="h6">Items a Producir</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell sx={{ width: '15%' }}>Cantidad</TableCell>
                                        <TableCell sx={{ width: '15%' }}>Talle</TableCell>
                                        <TableCell>Customizaciones</TableCell>
                                        <TableCell>Acción</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.product?.name || item.product_name}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    variant="standard"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={item.size}
                                                    onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                                                    variant="standard"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    value={item.customizations}
                                                    onChange={(e) => handleItemChange(index, 'customizations', e.target.value)}
                                                    variant="standard"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => handleRemoveItem(index)} size="small">
                                                    <RemoveCircleOutlineIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    {/* Additional Details */}
                    <Grid xs={12}>
                        <TextField
                            label="Detalles Adicionales de la OP"
                            name="details"
                            value={formData.details}
                            onChange={handleGeneralChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductionOrderFormMedias;
