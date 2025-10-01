import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Typography, Box, Grid, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import * as api from '../../utils/api';

const OrderNoteForm = ({ open, onClose, onSave, orderNote }) => {
    const [sales, setSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [formData, setFormData] = useState({
        sale: null,
        estimated_delivery_date: '',
        shipping_method: '',
        details: ''
    });

    useEffect(() => {
        const fetchAndSetData = async () => {
            if (open) {
                try {
                    // Fetch sales available for new order notes
                    const data = await api.list('/sales/available-for-order-note/');
                    let availableSales = data.results || data || [];

                    // If we are editing an existing order note
                    if (orderNote && orderNote.sale) {
                        // If the current sale is not in the list of available sales, add it
                        if (!availableSales.some(s => s.id === orderNote.sale.id)) {
                            availableSales.unshift(orderNote.sale);
                        }
                        // Set the form data for editing
                        setFormData({
                            sale: orderNote.sale.id,
                            estimated_delivery_date: orderNote.estimated_delivery_date,
                            shipping_method: orderNote.shipping_method || '',
                            details: orderNote.details || ''
                        });
                        setSelectedSale(orderNote.sale);
                    } else {
                        // Reset form for new order note
                        setFormData({
                            sale: null,
                            estimated_delivery_date: '',
                            shipping_method: '',
                            details: ''
                        });
                        setSelectedSale(null);
                    }
                    setSales(availableSales);
                } catch (error) {
                    console.error("Error fetching sales", error);
                }
            }
        };
        fetchAndSetData();
    }, [open, orderNote]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'sale') {
            const sale = sales.find(s => s.id === value);
            setSelectedSale(sale);
        }
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = () => {
        const payload = {
            ...formData,
            sale_id: formData.sale
        };
        delete payload.sale;
        onSave(payload);
    };
    
    const mainContact = selectedSale?.client?.contacts?.[0];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{orderNote ? 'Editar Nota de Pedido' : 'Nueva Nota de Pedido'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid xs={12}>
                        <FormControl fullWidth sx={{ minWidth: 200 }}>
                            <InputLabel>Venta Asociada</InputLabel>
                            <Select
                                value={formData.sale || ''}
                                label="Venta Asociada"
                                onChange={handleChange}
                                name="sale"
                                disabled={!!orderNote}
                            >
                                {sales.map((sale) => (
                                    <MenuItem key={sale.id} value={sale.id}>
                                        Venta #{sale.id} - {sale.client.name} (${sale.total_amount})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {selectedSale && (
                        <>
                            <Grid xs={12}>
                                <Box component={Paper} sx={{ p: 2, mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>Detalles de la Venta</Typography>
                                    <Grid container spacing={2}>
                                        <Grid xs={6}>
                                            <Typography><b>Cliente:</b> {selectedSale.client.name}</Typography>
                                            <Typography><b>Vendedor:</b> {selectedSale.user?.first_name || 'N/A'}</Typography>
                                            <Typography><b>Monto Total:</b> ${selectedSale.total_amount}</Typography>
                                            <Typography><b>Estado del Pago:</b> {selectedSale.payment_status}</Typography>
                                        </Grid>
                                        <Grid xs={6}>
                                            <Typography><b>Contacto:</b> {mainContact?.name || 'No disponible'}</Typography>
                                            <Typography><b>Teléfono:</b> {mainContact?.phone || 'No disponible'}</Typography>
                                            <Typography><b>Email:</b> {mainContact?.email || 'No disponible'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>

                            <Grid xs={12}>
                                <Box component={Paper} sx={{ p: 2, mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>Productos de la Venta</Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Producto</TableCell>
                                                    <TableCell>Cantidad</TableCell>
                                                    <TableCell>Talle</TableCell>
                                                    <TableCell>Colores</TableCell>
                                                    <TableCell>Detalle</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedSale.items.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.product?.name || 'N/A'}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{item.product?.size?.name || 'N/A'}</TableCell>
                                                        <TableCell>{item.product?.colors?.map(c => c.name).join(', ') || 'N/A'}</TableCell>
                                                        <TableCell>{item.product?.description || 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Grid>
                        </>
                    )}

                    <Grid xs={12} sm={6}>
                        <TextField
                            margin="dense"
                            name="estimated_delivery_date"
                            label="Fecha de Entrega Estimada"
                            type="date"
                            fullWidth
                            value={formData.estimated_delivery_date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid xs={12} sm={6}>
                        <TextField
                            margin="dense"
                            name="shipping_method"
                            label="Forma de Envío"
                            type="text"
                            fullWidth
                            value={formData.shipping_method}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid xs={12}>
                        <TextField
                            margin="dense"
                            name="details"
                            label="Detalles Adicionales"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.details}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!formData.sale}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default OrderNoteForm;