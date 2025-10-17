import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Button, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PointOfSale from './PointOfSale';
import SalesList from './SalesList';
import CommercialSaleForm from './CommercialSaleForm';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SaleManagement = () => {
    const { tenantId } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            const data = await api.list('commercial/commercial-sales/');
            const saleList = Array.isArray(data) ? data : data.results;
            setSales(saleList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las ventas comerciales. Por favor, intente de nuevo.');
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

    const handleOpenForm = (sale = null) => {
        setSelectedSale(sale);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedSale(null);
        setIsFormOpen(false);
    };

    const handleSave = async (saleData) => {
        try {
            if (selectedSale) {
                await api.update('commercial/commercial-sales/', selectedSale.id, saleData);
            } else {
                await api.create('commercial/commercial-sales/', saleData);
            }
            fetchSales(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar la venta comercial.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta venta comercial?')) {
            try {
                await api.remove('commercial/commercial-sales/', id);
                fetchSales(); // Refresh list
            } catch (err) {
                setError('Error al eliminar la venta comercial.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Ventas Comerciales</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleChange} aria-label="pestañas de ventas">
                    <Tab label="Puesto de Venta" />
                    <Tab label="Listado de Ventas" />
                </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
                {tabValue === 0 && (
                    <PointOfSale />
                )}
                {tabValue === 1 && (
                    <Box>
                        <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }} startIcon={<AddIcon />}>
                            Nueva Venta Comercial
                        </Button>
                        {loading && <CircularProgress />}
                        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
                        {!loading && !error && (
                            <SalesList sales={sales} onEdit={handleOpenForm} onDelete={handleDelete} />
                        )}
                    </Box>
                )}
            </Box>

            <CommercialSaleForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                sale={selectedSale}
            />
        </Box>
    );
};

export default SaleManagement;
