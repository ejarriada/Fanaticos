import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CommercialProductList from './CommercialProductList';
import CommercialProductForm from './CommercialProductForm';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CommercialProductManagement = () => {
    const { tenantId } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await api.list('commercial/commercial-products/');
            const productList = Array.isArray(data) ? data : data.results;
            setProducts(productList || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los productos comerciales. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchProducts();
        }
    }, [tenantId]);

    const handleOpenForm = (product = null) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedProduct(null);
        setIsFormOpen(false);
    };

    const handleSave = async (productData) => {
        try {
            if (selectedProduct) {
                await api.update('commercial/commercial-products/', selectedProduct.id, productData);
            } else {
                await api.create('commercial/commercial-products/', productData);
            }
            fetchProducts(); // Refresh list
            handleCloseForm();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el producto comercial.';
            setError(errorMessage);
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este producto comercial?')) {
            try {
                await api.remove('commercial/commercial-products/', id);
                fetchProducts(); // Refresh list
            } catch (err) {
                setError('Error al eliminar el producto comercial.');
                console.error(err);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Gestión de Productos Comerciales</Typography>
            <Button variant="contained" onClick={() => handleOpenForm()} sx={{ mb: 2 }} startIcon={<AddIcon />}>
                Nuevo Producto Comercial
            </Button>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            {!loading && !error && (
                <CommercialProductList products={products} onEdit={handleOpenForm} onDelete={handleDelete} />
            )}

            <CommercialProductForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                product={selectedProduct}
            />
        </Box>
    );
};

export default CommercialProductManagement;
