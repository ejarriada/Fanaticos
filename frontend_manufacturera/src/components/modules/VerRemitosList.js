import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem, Chip, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as api from '../../utils/api';

const VerRemitosList = () => {
    const [remitos, setRemitos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('');

    useEffect(() => {
        fetchRemitos();
    }, []);

    const fetchRemitos = async () => {
        try {
            setLoading(true);
            const data = await api.list('/delivery-notes/');
            setRemitos(data.results || data || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los remitos.');
            console.error('Error fetching remitos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este remito?')) {
            try {
                await api.remove('/delivery-notes/', id);
                fetchRemitos(); // Recargar la lista
            } catch (err) {
                setError('Error al eliminar el remito.');
                console.error(err);
            }
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'pendiente': return 'warning';
            case 'enviado': return 'info';
            case 'entregado': return 'success';
            case 'cancelado': return 'error';
            default: return 'default';
        }
    };

    const remitosFiltrados = filtroTipo 
        ? remitos.filter(remito => remito.tipo === filtroTipo)
        : remitos;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            
            {/* Filtros */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filtrar por Tipo</InputLabel>
                    <Select
                        value={filtroTipo}
                        label="Filtrar por Tipo"
                        onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Venta">Venta</MenuItem>
                        <MenuItem value="Interno">Interno</MenuItem>
                    </Select>
                </FormControl>
                <Typography variant="body2" color="textSecondary">
                    Total: {remitosFiltrados.length} remitos
                </Typography>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Cliente</strong></TableCell>
                            <TableCell><strong>Origen</strong></TableCell>
                            <TableCell><strong>Destino</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {remitosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body2" color="textSecondary">
                                        No hay remitos para mostrar
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            remitosFiltrados.map((remito) => (
                                <TableRow key={remito.id}>
                                    <TableCell>{remito.id}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={remito.tipo || 'N/A'} 
                                            color={remito.tipo === 'Venta' ? 'primary' : 'secondary'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {remito.fecha ? new Date(remito.fecha).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {remito.tipo === 'Venta' 
                                            ? (remito.cliente?.name || 'N/A')
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {remito.origen?.name || remito.origen || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {remito.destino?.name || remito.destino || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={remito.estado || 'Pendiente'} 
                                            color={getEstadoColor(remito.estado)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            color="primary"
                                            title="Ver detalles"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="primary"
                                            title="Editar"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDelete(remito.id)}
                                            title="Eliminar"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default VerRemitosList;