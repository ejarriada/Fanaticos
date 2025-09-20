import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress,
    Alert, IconButton
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune'; // Icon for adjustments
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const MateriaPrimaStock = ({ onAdjustStock, refreshKey }) => {
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchRawMaterials = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const data = await api.list('/raw-materials/');
                const list = Array.isArray(data) ? data : data.results;
                setRawMaterials(list || []);
                setError(null);
            } catch (err) {
                setError('Error al cargar la materia prima.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRawMaterials();
    }, [tenantId, refreshKey]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Stock de Materia Prima</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Nro. de Lote</TableCell>
                            <TableCell>Stock Actual</TableCell>
                            <TableCell>Unidad de Medida</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rawMaterials.map((rm) => (
                            <TableRow key={rm.id}>
                                <TableCell>{rm.name}</TableCell>
                                <TableCell>{rm.batch_number}</TableCell>
                                <TableCell>{rm.current_stock}</TableCell>
                                <TableCell>{rm.unit_of_measure}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => onAdjustStock(rm)} title="Ajustar Stock">
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

export default MateriaPrimaStock;
