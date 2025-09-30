import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import * as api from '../../utils/api';

const CuentaCorrienteProveedor = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [movements, setMovements] = useState([]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await api.list('/suppliers/');
                setSuppliers(data.results || (Array.isArray(data) ? data : []));
            } catch (error) {
                console.error("Error fetching suppliers:", error);
            }
        };
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (selectedSupplier) {
            const fetchMovements = async () => {
                try {
                    // CAMBIO AQUÍ: account_movements -> account-movements
                    const data = await api.list(`/suppliers/${selectedSupplier}/account-movements/`);
                    setMovements(data.results || (Array.isArray(data) ? data : []));
                } catch (error) {
                    console.error("Error fetching account movements:", error);
                    setMovements([]); // Clear movements on error
                }
            };
            fetchMovements();
        } else {
            setMovements([]);
        }
    }, [selectedSupplier]);

    const handleSupplierChange = (event) => {
        setSelectedSupplier(event.target.value);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Cuenta Corriente de Proveedor</Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Seleccionar Proveedor</InputLabel>
                <Select
                    value={selectedSupplier}
                    onChange={handleSupplierChange}
                    label="Seleccionar Proveedor"
                >
                    <MenuItem value="">
                        <em>Seleccione un proveedor</em>
                    </MenuItem>
                    {suppliers.map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Detalle</TableCell>
                            <TableCell>Monto</TableCell>
                            <TableCell>Balance</TableCell>
                            <TableCell>Fecha</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {movements.length > 0 ? (
                            movements.map((mov) => (
                                <TableRow key={mov.id}>
                                    <TableCell>{mov.type}</TableCell>
                                    <TableCell>{mov.detail}</TableCell>
                                    <TableCell>${mov.amount}</TableCell>
                                    <TableCell>${mov.balance}</TableCell>
                                    <TableCell>{new Date(mov.date).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Seleccione un proveedor para ver sus movimientos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CuentaCorrienteProveedor;