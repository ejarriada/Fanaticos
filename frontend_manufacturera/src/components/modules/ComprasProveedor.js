import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography
} from '@mui/material';
import * as api from '../../utils/api';

// Mock data for purchases
const mockPurchases = [
    { id: 1, detail: 'Compra de telas', amount: 5000, paid: 5000, invoice: 'F-001', user: 'admin', date: '2025-09-01' },
    { id: 2, detail: 'Compra de hilos', amount: 1500, paid: 0, invoice: 'F-002', user: 'admin', date: '2025-09-03' },
];

const ComprasProveedor = ({ onNewPurchase }) => {
    const [purchases, setPurchases] = useState(mockPurchases);

    // TODO: Fetch real purchases from the API

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Compras a Proveedores</Typography>
            <Button variant="contained" onClick={onNewPurchase} sx={{ mb: 2 }}>
                Nueva Compra
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Detalle</TableCell>
                            <TableCell>Monto</TableCell>
                            <TableCell>Pagado</TableCell>
                            <TableCell>Factura</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Fecha</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {purchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                                <TableCell>{purchase.detail}</TableCell>
                                <TableCell>${purchase.amount}</TableCell>
                                <TableCell>${purchase.paid}</TableCell>
                                <TableCell>{purchase.invoice}</TableCell>
                                <TableCell>{purchase.user}</TableCell>
                                <TableCell>{purchase.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ComprasProveedor;
