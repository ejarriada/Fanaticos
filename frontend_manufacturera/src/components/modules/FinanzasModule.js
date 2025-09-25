import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

// Import all necessary components
import CashRegisterManagement from './CashRegisterManagement';
import ExpenseManagement from './ExpenseManagement';
import ChequesManagement from './ChequesManagement';
import FinancialSummary from './FinancialSummary';
import PaymentRules from './PaymentRules';
import InvoiceManagement from './InvoiceManagement';
import PaymentManagement from './PaymentManagement';
import AccountManagement from './AccountManagement';
import PaymentMethodTypeManagement from './PaymentMethodTypeManagement';
import BancosHub from './BancosHub'; // Hub for Bank and Bank Statements

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
                <Box sx={{ p: 3 }}>
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
            <Typography variant="h4" sx={{ p:3, pb: 2 }}>Gestión Contable/Finanzas</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de finanzas" variant="scrollable" scrollButtons="auto">
                    <Tab label="Resumen" id="finanzas-tab-0" />
                    <Tab label="Cajas" id="finanzas-tab-1" />
                    <Tab label="Gastos" id="finanzas-tab-2" />
                    <Tab label="Cheques" id="finanzas-tab-3" />
                    <Tab label="Bancos" id="finanzas-tab-4" />
                    <Tab label="Facturas" id="finanzas-tab-5" />
                    <Tab label="Pagos" id="finanzas-tab-6" />
                    <Tab label="Cuentas" id="finanzas-tab-7" />
                    <Tab label="Reglas de Pago" id="finanzas-tab-8" />
                    <Tab label="Tipos de Pago" id="finanzas-tab-9" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <FinancialSummary />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <CashRegisterManagement />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <ExpenseManagement />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <ChequesManagement />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <BancosHub />
            </TabPanel>
            <TabPanel value={value} index={5}>
                <InvoiceManagement />
            </TabPanel>
            <TabPanel value={value} index={6}>
                <PaymentManagement />
            </TabPanel>
            <TabPanel value={value} index={7}>
                <AccountManagement />
            </TabPanel>
            <TabPanel value={value} index={8}>
                <PaymentRules />
            </TabPanel>
            <TabPanel value={value} index={9}>
                <PaymentMethodTypeManagement />
            </TabPanel>
        </Box>
    );
};

export default FinanzasModule;