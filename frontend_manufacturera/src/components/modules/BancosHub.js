import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import BankManagement from './BankManagement';
import BankStatementManagement from './BankStatementManagement';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`bancos-hub-tabpanel-${index}`}
            aria-labelledby={`bancos-hub-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const BancosHub = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="sub-pestañas de bancos">
                    <Tab label="Gestión de Bancos" id="bancos-hub-tab-0" />
                    <Tab label="Extractos Bancarios" id="bancos-hub-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <BankManagement />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <BankStatementManagement />
            </TabPanel>
        </Box>
    );
};

export default BancosHub;
