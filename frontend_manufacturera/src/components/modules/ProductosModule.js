import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import PlantillasProductoList from './PlantillasProductoList';

import ProductosFinalesList from './ProductosFinalesList';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`productos-tabpanel-${index}`}
            aria-labelledby={`productos-tab-${index}`}
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

const ProductosModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de productos">
                    <Tab label="Plantillas de Productos" id="productos-tab-0" />
                    <Tab label="Productos Finales" id="productos-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <PlantillasProductoList />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ProductosFinalesList />
            </TabPanel>
        </Box>
    );
};

export default ProductosModule;
