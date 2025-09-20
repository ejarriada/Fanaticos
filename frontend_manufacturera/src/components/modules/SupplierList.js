import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Typography, CircularProgress, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Main Supplier Management Component
const SupplierList = ({ onEdit, refresh }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await api.list('/suppliers/');
            setSuppliers(data.results || (Array.isArray(data) ? data : []));
            setError(null);
        } catch (err) {
            setError('Error al cargar los proveedores. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSuppliers();
        }
    }, [tenantId, refresh]);

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
            try {
                await api.remove('/suppliers/', id);
                fetchSuppliers(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el proveedor.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Dirección</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell>CUIT/CUIL</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>{supplier.name}</TableCell>
                                    <TableCell>{supplier.address}</TableCell>
                                    <TableCell>{supplier.phone}</TableCell>
                                    <TableCell>{supplier.category}</TableCell>
                                    <TableCell>{supplier.cuit_cuil}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => onEdit(supplier)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(supplier.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default SupplierList;