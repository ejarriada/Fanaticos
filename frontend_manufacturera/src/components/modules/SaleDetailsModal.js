import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Divider, Box, Paper
} from '@mui/material';

const SaleDetailsModal = ({ open, onClose, sale }) => {
    if (!sale) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Detalles de Venta #{sale.id}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#5c6bc0', mb: 1 }}>
                        Información General
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography><strong>Cliente:</strong> {sale.client?.name || 'N/A'}</Typography>
                    <Typography><strong>Fecha:</strong> {new Date(sale.sale_date).toLocaleDateString()}</Typography>
                    <Typography><strong>Usuario:</strong> {sale.user?.email || 'N/A'}</Typography>
                    <Typography><strong>Método de Pago:</strong> {sale.payment_method || 'N/A'}</Typography>
                    <Typography><strong>Estado:</strong> {sale.status || 'Completada'}</Typography>
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
                                    <TableCell align="right">Cantidad</TableCell>
                                    <TableCell align="right">Precio Unit.</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sale.items?.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.product_name || 'N/A'}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                                        <TableCell align="right">
                                            ${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" sx={{ color: '#5c6bc0', fontWeight: 600 }}>
                        Total: ${parseFloat(sale.total_amount).toFixed(2)}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SaleDetailsModal;