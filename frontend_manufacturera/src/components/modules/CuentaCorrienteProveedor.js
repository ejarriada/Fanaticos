import React, { useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography
} from '@mui/material';

// Mock data for account status
const mockAccountMovements = [
    { id: 1, type: 'Compra', detail: 'Factura F-001', cashbox: '-', amount: -5000, balance: 1000, date: '2025-09-01' },
    { id: 2, type: 'Pago', detail: 'Pago factura F-001', cashbox: 'Caja Principal', amount: 5000, balance: 6000, date: '2025-09-02' },
    { id: 3, type: 'Compra', detail: 'Factura F-002', cashbox: '-', amount: -1500, balance: 4500, date: '2025-09-03' },
];

const CuentaCorrienteProveedor = () => {
    const [movements, setMovements] = useState(mockAccountMovements);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Cuenta Corriente de Proveedor</Typography>
            {/* TODO: Add selector for supplier */}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Detalle</TableCell>
                            <TableCell>Caja</TableCell>
                            <TableCell>Monto</TableCell>
                            <TableCell>Balance</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {movements.map((mov) => (
                            <TableRow key={mov.id}>
                                <TableCell>{mov.type}</TableCell>
                                <TableCell>{mov.detail}</TableCell>
                                <TableCell>{mov.cashbox}</TableCell>
                                <TableCell>${mov.amount}</TableCell>
                                <TableCell>${mov.balance}</TableCell>
                                <TableCell>{mov.date}</TableCell>
                                <TableCell>{/* Actions like delete */}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CuentaCorrienteProveedor;
