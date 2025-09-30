import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, IconButton, CircularProgress, Alert, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import SaleDetailsModal from './SaleDetailsModal';
import EditSaleModal from './EditSaleModal';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { tenantId } = useAuth();
    const [selectedSale, setSelectedSale] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchSales = async () => {
        try {
            setLoading(true);
            let url = '/sales/';
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const data = await api.list(url);
            const saleList = Array.isArray(data) ? data : data.results;
            setSales(saleList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las ventas. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSales();
        }
    }, [tenantId]);

    const handleFilter = () => {
        fetchSales();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta venta?')) {
            try {
                await api.remove('/sales/', id);
                fetchSales();
            } catch (err) {
                setError('Error al eliminar la venta.');
                console.error(err);
            }
        }
    };

    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        setShowDetailsModal(true);
    };

    const handleEdit = (sale) => {
        setSelectedSale(sale);
        setShowEditModal(true);
    };

    const handleCancel = async (sale) => {
        if (window.confirm(`¿Está seguro de que desea anular la venta #${sale.id}?`)) {
            try {
                await api.update('/sales/', sale.id, { ...sale, status: 'Cancelada' });
                fetchSales();
            } catch (err) {
                setError('Error al anular la venta.');
                console.error(err);
            }
        }
    };

    const handleCloseModals = () => {
        setShowDetailsModal(false);
        setShowEditModal(false);
        setSelectedSale(null);
    };

    const handleSaveEdit = async (updatedSale) => {
        try {
            await api.update('/sales/', updatedSale.id, updatedSale);
            fetchSales();
            handleCloseModals();
        } catch (err) {
            setError('Error al actualizar la venta.');
            console.error(err);
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Listado de Ventas</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    label="Fecha de Inicio"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    label="Fecha de Fin"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Button variant="contained" color="primary" onClick={handleFilter}>
                    Filtrar
                </Button>
            </Box>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell><TableCell>Producto(s)</TableCell><TableCell>Cliente</TableCell><TableCell>Cantidad Total</TableCell><TableCell>Total</TableCell><TableCell>Fecha</TableCell><TableCell>Usuario</TableCell><TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>{sale.id}</TableCell>
                                    <TableCell>
                                        {sale.items && sale.items.length > 0 
                                            ? sale.items.map(item => item.product_name).join(', ') 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>{sale.client?.name || 'N/A'}</TableCell>
                                    <TableCell>
                                        {sale.items ? sale.items.reduce((sum, item) => sum + item.quantity, 0) : 0}
                                    </TableCell>
                                    <TableCell>
                                        ${typeof sale.total_amount === 'number' 
                                            ? sale.total_amount.toFixed(2) 
                                            : parseFloat(sale.total_amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{sale.user?.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleViewDetails(sale)} title="Ver detalles">
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleEdit(sale)} title="Editar">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleCancel(sale)} title="Anular" color="warning">
                                            <CancelIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(sale.id)} title="Eliminar" color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <SaleDetailsModal 
                open={showDetailsModal}
                onClose={handleCloseModals}
                sale={selectedSale}
            />

            <EditSaleModal
                open={showEditModal}
                onClose={handleCloseModals}
                sale={selectedSale}
                onSave={handleSaveEdit}
            />
        </Box>
    );
};

export default SalesList;