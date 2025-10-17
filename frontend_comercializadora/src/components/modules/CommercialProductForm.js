import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    MenuItem, FormControl, InputLabel, Select, Grid
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CommercialProductForm = ({ open, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({});
    const [suppliers, setSuppliers] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const suppliersData = await api.list('/suppliers/');
                setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.results || []);
            } catch (err) {
                console.error('Error fetching suppliers', err);
            } finally {
                setLoadingDependencies(false);
            }
        };
        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                supplier: product.supplier?.id || '',
            });
        } else {
            setFormData({
                sku: '',
                barcode: '',
                name: '',
                description: '',
                category: '',
                subcategory: '',
                brand: '',
                variants: '{}',
                cost_price: '',
                sale_price: '',
                discount_price: '',
                supplier: '',
                weight: '',
                dimensions: '',
                main_image: null,
                is_active: true,
            });
        }
    }, [product, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            main_image: e.target.files[0]
        }));
    };

    const handleSubmit = () => {
        const dataToSave = new FormData();
        for (const key in formData) {
            if (key === 'variants') {
                dataToSave.append(key, JSON.stringify(formData[key]));
            } else if (formData[key] !== null && formData[key] !== undefined) {
                dataToSave.append(key, formData[key]);
            }
        }
        onSave(dataToSave);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent>Cargando proveedores...</DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{product ? 'Editar Producto Comercial' : 'Nuevo Producto Comercial'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="sku" label="SKU" type="text" fullWidth value={formData.sku || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="barcode" label="Código de Barras" type="text" fullWidth value={formData.barcode || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth value={formData.name || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField margin="dense" name="description" label="Descripción" type="text" fullWidth multiline rows={2} value={formData.description || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="category" label="Categoría" type="text" fullWidth value={formData.category || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="subcategory" label="Subcategoría" type="text" fullWidth value={formData.subcategory || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="brand" label="Marca" type="text" fullWidth value={formData.brand || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="variants" label="Variantes (JSON)" type="text" fullWidth value={formData.variants || '{}'} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField margin="dense" name="cost_price" label="Precio de Costo" type="number" fullWidth value={formData.cost_price || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField margin="dense" name="sale_price" label="Precio de Venta" type="number" fullWidth value={formData.sale_price || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField margin="dense" name="discount_price" label="Precio de Descuento" type="number" fullWidth value={formData.discount_price || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Proveedor</InputLabel>
                            <Select name="supplier" value={formData.supplier || ''} onChange={handleChange} label="Proveedor">
                                {suppliers.map(supplier => (
                                    <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="weight" label="Peso" type="number" fullWidth value={formData.weight || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField margin="dense" name="dimensions" label="Dimensiones" type="text" fullWidth value={formData.dimensions || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <InputLabel shrink>Imagen Principal</InputLabel>
                        <TextField margin="dense" name="main_image" type="file" fullWidth onChange={handleFileChange} InputLabelProps={{ shrink: true }} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommercialProductForm;
