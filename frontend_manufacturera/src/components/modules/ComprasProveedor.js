import React, { useState, useEffect } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, CircularProgress, Alert, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../../utils/api';
import NewPurchaseForm from './NewPurchaseForm'; // Import the form for editing

const ComprasProveedor = ({ onNewPurchase, refresh, suppliers }) => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const data = await api.list('/purchase-orders/');
            setPurchases(Array.isArray(data) ? data : data.results || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las órdenes de compra.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, [refresh]); // Re-fetch when refresh prop changes

    const handleEdit = (purchase) => {
        setSelectedPurchase(purchase);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de compra?')) {
            try {
                await api.remove('/purchase-orders/', id);
                fetchPurchases(); // Refresh list after deletion
            } catch (err) {
                setError('Error al eliminar la orden de compra.');
                console.error(err);
            }
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedPurchase(null);
    };

    const handleSaveSuccess = () => {
        fetchPurchases(); // Refresh list after save/update
        handleCloseForm();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Compras a Proveedores</Typography>
            <Button variant="contained" onClick={onNewPurchase} sx={{ mb: 2 }}>
                Nueva Compra
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Proveedor</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Fecha Orden</TableCell>
                                <TableCell>Fecha Entrega Estimada</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {purchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                    <TableCell>{purchase.id}</TableCell>
                                    <TableCell>{purchase.supplier_name || 'N/A'}</TableCell>
                                    <TableCell>{purchase.user_name || 'N/A'}</TableCell>
                                    <TableCell>{new Date(purchase.order_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(purchase.expected_delivery_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{purchase.status}</TableCell>
                                    <TableCell>${purchase.total_amount || '0.00'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(purchase)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(purchase.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {isFormOpen && (
                <NewPurchaseForm 
                    open={isFormOpen} 
                    onClose={handleCloseForm} 
                    onSaveSuccess={handleSaveSuccess} 
                    order={selectedPurchase} 
                    suppliers={suppliers} 
                />
            )}
        </Box>
    );
};

export default ComprasProveedor;