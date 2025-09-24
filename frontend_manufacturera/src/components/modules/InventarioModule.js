import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import * as api from '../../utils/api'; // Import api utils

import MateriaPrimaStock from './MateriaPrimaStock';
import ProductosTerminadosStock from './ProductosTerminadosStock';
import AlmacenesManagement from './AlmacenesManagement';
import StockAdjustmentDialog from './StockAdjustmentDialog';
import EditCostDialog from './EditCostDialog'; // Assuming this is created for editing cost
import MoveStockDialog from './MoveStockDialog'; // Import the new move dialog

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
    const [locales, setLocales] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocales = async () => {
            try {
                const data = await api.list('/locales/');
                setLocales(data.results || (Array.isArray(data) ? data : []));
            } catch (err) {
                console.error("Failed to fetch locales", err);
            }
        };
        fetchLocales();
    }, []);

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
        setRefreshKey(prev => prev + 1);
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
                    item={selectedItem}
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
