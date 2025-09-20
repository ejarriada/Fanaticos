import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import ClientList from './ClientList';

import CuentaPorCliente from './CuentaPorCliente';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`clientes-tabpanel-${index}`}
            aria-labelledby={`clientes-tab-${index}`}
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

const ClientesModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de clientes">
                    <Tab label="Lista de Clientes" id="clientes-tab-0" />
                    <Tab label="Cuenta por Cliente" id="clientes-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <ClientList />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <CuentaPorCliente />
            </TabPanel>
        </Box>
    );
};

export default ClientesModule;
