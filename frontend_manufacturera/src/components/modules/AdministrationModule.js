import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import UserManagement from './UserManagement';
import FactoryManagement from './FactoryManagement';

// Panel de Pestañas (TabPanel) para asociar contenido a cada pestaña
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
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

const AdministrationModule = () => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Paper sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ p: 3, pb: 1 }}>Módulo de Administración</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="Módulos de Administración">
                    <Tab label="Usuarios" id="admin-tab-0" />
                    <Tab label="Fábricas" id="admin-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={currentTab} index={0}>
                <UserManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
                <FactoryManagement />
            </TabPanel>
        </Paper>
    );
};

export default AdministrationModule;
