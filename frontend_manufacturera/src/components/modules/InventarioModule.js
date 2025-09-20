import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import MateriaPrimaStock from './MateriaPrimaStock';
import ProductosTerminadosStock from './ProductosTerminadosStock';
import AlmacenesManagement from './AlmacenesManagement';

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

    const handleChange = (event, newValue) => {
        setValue(newValue);
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
                <MateriaPrimaStock />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ProductosTerminadosStock />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <AlmacenesManagement />
            </TabPanel>
        </Box>
    );
};

export default InventarioModule;
