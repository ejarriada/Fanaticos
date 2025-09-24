import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress,
    Alert, IconButton
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const MateriaPrimaStock = ({ onAdjustStock, onDelete, onEdit, refreshKey }) => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchStockItems = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const data = await api.list('/materia-prima-proveedores/');
                const list = Array.isArray(data) ? data : data.results;
                setStockItems(list || []);
                setError(null);
            } catch (err) {
                setError('Error al cargar el stock de materia prima.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStockItems();
    }, [tenantId, refreshKey]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Stock de Materia Prima por Proveedor</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Materia Prima</TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell>Costo</TableCell>
                            <TableCell>Stock Actual</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stockItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.supplier_name}</TableCell>
                                <TableCell>${parseFloat(item.cost).toFixed(2)}</TableCell>
                                <TableCell>{item.current_stock}</TableCell>
                                <TableCell>{item.unit_of_measure}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => onAdjustStock(item)} title="Ajustar Stock">
                                        <TuneIcon />
                                    </IconButton>
                                    <IconButton onClick={() => onEdit(item)} title="Editar Costo">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => onDelete(item.id, 'raw')} title="Eliminar Stock">
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

export default MateriaPrimaStock;
