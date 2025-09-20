import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import VerRemitosList from './VerRemitosList';

import NuevoRemitoForm from './NuevoRemitoForm';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`remitos-tabpanel-${index}`}
            aria-labelledby={`remitos-tab-${index}`}
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

const RemitosModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Remitos</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de remitos">
                    <Tab label="Ver Remitos" id="remitos-tab-0" />
                    <Tab label="Nuevo Remito" id="remitos-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <VerRemitosList />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <NuevoRemitoForm />
            </TabPanel>
        </Box>
    );
};

export default RemitosModule;
