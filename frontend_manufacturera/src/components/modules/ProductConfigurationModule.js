import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

// Import sub-modules
import ProcessManagement from './ProcessManagement';
import CategoryModule from './CategoryModule';
import SizeModule from './SizeModule';
import ColorModule from './ColorModule';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} id={`config-tabpanel-${index}`} style={{ paddingTop: '24px' }}>
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

const ProductConfigurationModule = () => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3, mt: 0 }}>Configuración de Productos</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="pestañas de configuración de productos">
                    <Tab label="Procesos de Fabricación" id="config-tab-0" />
                    <Tab label="Categorías" id="config-tab-1" />
                    <Tab label="Talles" id="config-tab-2" />
                    <Tab label="Colores" id="config-tab-3" />
                </Tabs>
            </Box>
            <TabPanel value={currentTab} index={0}>
                <ProcessManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
                <CategoryModule />
            </TabPanel>
            <TabPanel value={currentTab} index={2}>
                <SizeModule />
            </TabPanel>
            <TabPanel value={currentTab} index={3}>
                <ColorModule />
            </TabPanel>
        </Box>
    );
};

export default ProductConfigurationModule;
