import React, { useState } from 'react';
import { Box, AppBar, Tabs, Tab, Typography } from '@mui/material';

import InventoryManagement from './InventoryManagement'; // Existing component
import ProductManagement from './ProductManagement';     // Existing component (for Plantillas)
import FinalProductManagement from './FinalProductManagement'; // Existing component (for Productos Finales)

// TabPanel component for conditional rendering
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const InventoryHub = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <AppBar position="static">
                <Tabs value={value} onChange={handleChange} aria-label="inventory tabs">
                    <Tab label="Inventario" {...a11yProps(0)} />
                    <Tab label="Plantillas de Producto" {...a11yProps(1)} />
                    <Tab label="Productos Finales" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <TabPanel value={value} index={0}>
                <InventoryManagement />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ProductManagement />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <FinalProductManagement />
            </TabPanel>
        </Box>
    );
};

export default InventoryHub;
