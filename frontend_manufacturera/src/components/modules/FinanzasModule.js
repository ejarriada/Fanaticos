import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

// Placeholders for the components
import CashRegisterManagement from './CashRegisterManagement';

import ExpenseManagement from './ExpenseManagement';

import ChequesManagement from './ChequesManagement';

import FinancialSummary from './FinancialSummary';

import ExpenseSummary from './ExpenseSummary';

import PaymentRules from './PaymentRules';

import BankManagement from './BankManagement';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`finanzas-tabpanel-${index}`}
            aria-labelledby={`finanzas-tab-${index}`}
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

const FinanzasModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión Contable/Finanzas</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de finanzas">
                    <Tab label="Gestión de Cajas" id="finanzas-tab-0" />
                    <Tab label="Gestión de Gastos" id="finanzas-tab-1" />
                    <Tab label="Cheques" id="finanzas-tab-2" />
                    <Tab label="Resumen Financiero" id="finanzas-tab-3" />
                    <Tab label="Resumen Gastos" id="finanzas-tab-4" />
                    <Tab label="Reglas de Pago" id="finanzas-tab-5" />
                    <Tab label="Bancos" id="finanzas-tab-6" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <CashRegisterManagement />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ExpenseManagement />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <ChequesManagement />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <FinancialSummary />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <ExpenseSummary />
            </TabPanel>
            <TabPanel value={value} index={5}>
                <PaymentRules />
            </TabPanel>
            <TabPanel value={value} index={6}>
                <BankManagement />
            </TabPanel>
        </Box>
    );
};

export default FinanzasModule;
