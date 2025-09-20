import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress,
    Alert, IconButton
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune'; // Icon for adjustments
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ProductosTerminadosStock = ({ onAdjustStock, refreshKey }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchProducts = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const data = await api.list('/products/');
                const list = Array.isArray(data) ? data : data.results;
                setProducts(list || []);
                setError(null);
            } catch (err) {
                setError('Error al cargar los productos terminados.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
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
                            <TableCell>Nombre</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Stock Disponible</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.description}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => onAdjustStock(product)} title="Ajustar Stock">
                                        <TuneIcon />
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
