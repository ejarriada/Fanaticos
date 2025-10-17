import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    MenuItem, FormControl, InputLabel, Select, Grid
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CommercialInventoryForm = ({ open, onClose, onSave, inventory }) => {
    const [formData, setFormData] = useState({});
    const [commercialProducts, setCommercialProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(true);
    const { tenantId } = useAuth();

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoadingDependencies(true);
                const [commercialProductsData, warehousesData] = await Promise.all([
                    api.list('commercial/commercial-products/'),
                    api.list('/warehouses/'),
                ]);
                setCommercialProducts(Array.isArray(commercialProductsData) ? commercialProductsData : commercialProductsData.results || []);
                setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.results || []);
            } catch (err) {
                console.error('Error fetching dependencies', err);
            } finally {
                setLoadingDependencies(false);
            }
        };
        if (tenantId) {
            fetchDependencies();
        }
    }, [tenantId]);

    useEffect(() => {
        if (inventory) {
            setFormData({
                ...inventory,
                commercial_product: inventory.commercial_product?.id || '',
                warehouse: inventory.warehouse?.id || '',
            });
        } else {
            setFormData({
                commercial_product: '',
                warehouse: '',
                quantity: '',
                min_stock_level: '',
                max_stock_level: '',
            });
        }
    }, [inventory, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    if (loadingDependencies) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Cargando dependencias...</DialogTitle>
                <DialogContent>Cargando productos comerciales y almacenes...</DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{inventory ? 'Editar Inventario Comercial' : 'Nuevo Inventario Comercial'}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Producto Comercial</InputLabel>
                    <Select name="commercial_product" value={formData.commercial_product || ''} onChange={handleChange} label="Producto Comercial">
                        {commercialProducts.map(product => (
                            <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Almacén</InputLabel>
                    <Select name="warehouse" value={formData.warehouse || ''} onChange={handleChange} label="Almacén">
                        {warehouses.map(warehouse => (
                            <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField margin="dense" name="quantity" label="Cantidad" type="number" fullWidth value={formData.quantity || ''} onChange={handleChange} />
                <TextField margin="dense" name="min_stock_level" label="Nivel Mínimo de Stock" type="number" fullWidth value={formData.min_stock_level || ''} onChange={handleChange} />
                <TextField margin="dense" name="max_stock_level" label="Nivel Máximo de Stock" type="number" fullWidth value={formData.max_stock_level || ''} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommercialInventoryForm;
