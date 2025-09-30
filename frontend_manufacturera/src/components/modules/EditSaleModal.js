import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Divider, Box, Paper, IconButton, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const EditSaleModal = ({ open, onClose, sale, onSave }) => {
    const [formData, setFormData] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (sale) {
            setFormData({
                ...sale,
                sale_date: new Date(sale.sale_date).toISOString().split('T')[0],
                items: sale.items || []
            });
        }
    }, [sale]);

    useEffect(() => {
        if (formData?.items) {
            const total = formData.items.reduce((sum, item) => {
                return sum + (item.quantity * parseFloat(item.unit_price));
            }, 0);
            setTotalAmount(total);
        }
    }, [formData?.items]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = () => {
        setError(null);

        if (formData.items.length === 0) {
            setError('Debe haber al menos un producto en la venta');
            return;
        }

        const updatedSale = {
            ...formData,
            total_amount: totalAmount
        };

        onSave(updatedSale);
    };

    if (!formData) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Editar Venta #{sale?.id}
            </DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Alert severity="warning" sx={{ mb: 3 }}>
                    ⚠️ ADVERTENCIA: Editar una venta puede afectar remitos, facturas y cuenta corriente. 
                    Solo modifique si es estrictamente necesario.
                </Alert>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#5c6bc0', mb: 1 }}>
                        Información General
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography><strong>Cliente:</strong> {sale?.client?.name || 'N/A'}</Typography>
                    <TextField
                        label="Fecha de Venta"
                        type="date"
                        fullWidth
                        value={formData.sale_date}
                        onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Método de Pago"
                        fullWidth
                        value={formData.payment_method || ''}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#5c6bc0', mb: 1 }}>
                        Productos
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell align="center">Cantidad</TableCell>
                                    <TableCell align="right">Precio Unit.</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.items.map((item, index) => {
                                    const subtotal = item.quantity * parseFloat(item.unit_price);
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>{item.product_name || 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                                    inputProps={{ min: 1 }}
                                                    sx={{ width: 80 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                    inputProps={{ step: "0.01", min: 0 }}
                                                    sx={{ width: 100 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>${subtotal.toFixed(2)}</strong>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    onClick={() => handleRemoveItem(index)} 
                                                    color="error"
                                                    size="small"
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" sx={{ color: '#5c6bc0', fontWeight: 600 }}>
                        Total: ${totalAmount.toFixed(2)}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Guardar Cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditSaleModal;