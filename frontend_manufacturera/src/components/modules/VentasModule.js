import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import NewSaleForm from './NewSaleForm';

import SalesList from './SalesList';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`ventas-tabpanel-${index}`}
            aria-labelledby={`ventas-tab-${index}`}
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

const VentasModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Ventas</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de ventas">
                    <Tab label="Nueva Venta" id="ventas-tab-0" />
                    <Tab label="Ver Ventas" id="ventas-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <NewSaleForm />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <SalesList />
            </TabPanel>
        </Box>
    );
};

export default VentasModule;
