import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Tab, Tabs, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, 
    Alert, Button, IconButton
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune'; // Icon for adjustments
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StockAdjustmentDialog from './StockAdjustmentDialog';

// TabPanel component for handling tab content
const AlmacenesManagement = () => {
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Key to trigger data refresh

    const handleOpenAdjustmentDialog = (item) => {
        setSelectedItem(item);
        setIsAdjustmentOpen(true);
    };

    const handleCloseAdjustmentDialog = () => {
        setSelectedItem(null);
        setIsAdjustmentOpen(false);
    };

    const handleSaveAdjustment = async (adjustmentData) => {
        try {
            await api.create('/stock-adjustments/', adjustmentData);
            handleCloseAdjustmentDialog();
            setRefreshKey(oldKey => oldKey + 1); // Trigger refresh
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = errorData 
                ? Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ')
                : 'Error al guardar el ajuste de stock.';
            setError(errorMessage); // Display error to the user
            console.error(err);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Gestión de Almacenes</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography>Aquí se gestionarán los almacenes.</Typography>
            {/* TODO: Add actual almacenes management UI */}

            <StockAdjustmentDialog 
                open={isAdjustmentOpen}
                onClose={handleCloseAdjustmentDialog}
                onSave={handleSaveAdjustment}
                item={selectedItem}
            />
        </Box>
    );
};

export default AlmacenesManagement;
