import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import PointOfSale from './PointOfSale';
import SalesList from './SalesList';

const SaleManagement = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de ventas">
                    <Tab label="Puesto de Venta" />
                    <Tab label="Listado de Ventas" />
                </Tabs>
            </Box>
            <Box sx={{ p: 3 }}>
                {value === 0 && (
                    <PointOfSale />
                )}
                {value === 1 && (
                    <SalesList />
                )}
            </Box>
        </Box>
    );
};

export default SaleManagement;
