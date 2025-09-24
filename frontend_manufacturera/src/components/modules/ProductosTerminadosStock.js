import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress,
    Alert, IconButton
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ProductosTerminadosStock = ({ onAdjustStock, onDelete, onMove, refreshKey }) => {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchInventory = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const data = await api.list('/inventories/');
                const list = Array.isArray(data) ? data : data.results;
                setInventoryItems(list || []);
                setError(null);
            } catch (err) {
                setError('Error al cargar el stock de productos terminados.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, [tenantId, refreshKey]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Stock de Productos Terminados</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell>Almacén</TableCell>
                            <TableCell>Stock Disponible</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventoryItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.product?.name || 'N/A'}</TableCell>
                                <TableCell>{item.local?.name || 'N/A'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => onAdjustStock(item)} title="Ajustar Stock">
                                        <TuneIcon />
                                    </IconButton>
                                    <IconButton onClick={() => onMove(item)} title="Transferir Stock">
                                        <SwapHorizIcon />
                                    </IconButton>
                                    <IconButton onClick={() => onDelete(item.id, 'finished')} title="Eliminar Stock">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ProductosTerminadosStock;
