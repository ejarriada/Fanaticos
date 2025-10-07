
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { tenantId } = useAuth();

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

    return (
        <div>
            <h2>Listado de Ventas</h2>
            <div style={{ marginBottom: '20px' }}>
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
                    style={{ marginLeft: '10px' }}
                />
                <Button variant="contained" color="primary" onClick={handleFilter} style={{ marginLeft: '10px' }}>
                    Filtrar
                </Button>
            </div>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Producto</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>{sale.id}</TableCell>
                                    <TableCell>{sale.product_name || sale.product}</TableCell>
                                    <TableCell>{sale.client_name || sale.client}</TableCell>
                                    <TableCell>{sale.quantity}</TableCell>
                                    <TableCell>{sale.total_amount}</TableCell>
                                    <TableCell>{sale.sale_date}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleDelete(sale.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </div>
    );
};

export default SalesList;
