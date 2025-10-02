import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Alert } from '@mui/material';
import * as api from '../../utils/api';

import MateriaPrimaStock from './MateriaPrimaStock';
import ProductosTerminadosStock from './ProductosTerminadosStock';
import AlmacenesManagement from './AlmacenesManagement';
import StockAdjustmentDialog from './StockAdjustmentDialog';
import EditCostDialog from './EditCostDialog';
import MoveStockDialog from './MoveStockDialog';

import { useAuth } from '../../context/AuthContext';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`inventario-tabpanel-${index}`}
            aria-labelledby={`inventario-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

const InventarioModule = () => {
    const [value, setValue] = useState(0);
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
    const [isEditCostDialogOpen, setIsEditCostDialogOpen] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [locales, setLocales] = useState([]); // Standardized to locales
    const [refreshKey, setRefreshKey] = useState(0);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth(); // Get tenantId from context

    useEffect(() => {
        const fetchLocales = async () => {
            if (!tenantId) return; // Don't fetch if tenantId is not available
            try {
                const data = await api.list('/locals/'); // Corrected endpoint
                setLocales(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error("Failed to fetch locales", err);
                setError('No se pudieron cargar los almacenes.');
            }
        };
        fetchLocales();
    }, [tenantId]); // Add tenantId to dependency array

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleAdjustStock = (item) => {
        setSelectedItem(item);
        setIsAdjustmentDialogOpen(true);
    };

    const handleCloseAdjustmentDialog = () => {
        setIsAdjustmentDialogOpen(false);
        setSelectedItem(null);
    };

    const handleSaveAdjustment = async (adjustmentData) => {
        try {
            await api.create('/stock-adjustments/', adjustmentData);
            setRefreshKey(prev => prev + 1); // Refresh stock tables
            handleCloseAdjustmentDialog();
        } catch (err) {
            setError(`Error al guardar el ajuste: ${err.response?.data?.error || err.message}`);
            console.error(err);
        }
    };

    const handleOpenEditCost = (item) => {
        setSelectedItem(item);
        setIsEditCostDialogOpen(true);
    };

    const handleCloseEditCostDialog = () => {
        setIsEditCostDialogOpen(false);
        setSelectedItem(null);
    };

    const handleSaveCost = async (id, costData) => {
        try {
            await api.patch('/materia-prima-proveedores/', id, costData);
            handleCloseEditCostDialog();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            setError(`Error al actualizar el costo: ${err.message}`);
            console.error(err);
        }
    };

    const handleOpenMoveDialog = (item) => {
        setSelectedItem(item);
        setIsMoveDialogOpen(true);
    };

    const handleCloseMoveDialog = () => {
        setIsMoveDialogOpen(false);
        setSelectedItem(null);
    };

    const handleSaveTransfer = async (id, transferData) => {
        try {
            await api.postAction('/inventories/', id, 'transfer-stock', transferData);
            handleCloseMoveDialog();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            setError(`Error al transferir stock: ${err.response?.data?.error || err.message}`);
            console.error(err);
        }
    };

    const handleDelete = async (id, type) => {
        const confirmDelete = window.confirm('¿Está seguro de que desea eliminar este registro de stock?');
        if (!confirmDelete) return;

        const endpoint = type === 'raw' ? '/materia-prima-proveedores/' : '/inventories/';
        
        try {
            await api.remove(endpoint, id);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            setError(`Error al eliminar el registro: ${err.message}`);
            console.error(err);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Inventario</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de inventario">
                    <Tab label="Stock Materia Prima" id="inventario-tab-0" />
                    <Tab label="Stock Productos Terminados" id="inventario-tab-1" />
                    <Tab label="Almacenes" id="inventario-tab-2" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <MateriaPrimaStock 
                    onAdjustStock={handleAdjustStock} 
                    onDelete={handleDelete} 
                    onEdit={handleOpenEditCost} 
                    refreshKey={refreshKey} 
                />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ProductosTerminadosStock 
                    onAdjustStock={handleAdjustStock} 
                    onDelete={handleDelete} 
                    onMove={handleOpenMoveDialog} 
                    refreshKey={refreshKey} 
                />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <AlmacenesManagement />
            </TabPanel>

            {isAdjustmentDialogOpen && (
                <StockAdjustmentDialog
                    open={isAdjustmentDialogOpen}
                    onClose={handleCloseAdjustmentDialog}
                    onSave={handleSaveAdjustment}
                    item={selectedItem}
                    locales={locales}
                />
            )}

            {isEditCostDialogOpen && (
                <EditCostDialog
                    open={isEditCostDialogOpen}
                    onClose={handleCloseEditCostDialog}
                    onSave={handleSaveCost}
                    item={selectedItem}
                />
            )}

            {isMoveDialogOpen && (
                <MoveStockDialog
                    open={isMoveDialogOpen}
                    onClose={handleCloseMoveDialog}
                    onSave={handleSaveTransfer}
                    item={selectedItem}
                    locales={locales}
                />
            )}
        </Box>
    );
};

export default InventarioModule;