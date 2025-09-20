import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

// Import Accounting/Finance sub-modules
import AccountManagement from './AccountManagement';
import CashRegisterManagement from './CashRegisterManagement';
import TransactionManagement from './TransactionManagement';
import PaymentManagement from './PaymentManagement';
import BankStatementManagement from './BankStatementManagement';
import BankManagement from './BankManagement';
import PaymentMethodTypeManagement from './PaymentMethodTypeManagement';
import FinancialCostRuleManagement from './FinancialCostRuleManagement';

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
                    <Typography>{children}</Typography>
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

const AccountingFinanceModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="Accounting/Finance tabs">
                    <Tab label="Cuentas" {...a11yProps(0)} />
                    <Tab label="Cajas" {...a11yProps(1)} />
                    <Tab label="Transacciones" {...a11yProps(2)} />
                    <Tab label="Pagos" {...a11yProps(3)} />
                    <Tab label="Extractos Bancarios" {...a11yProps(4)} />
                    <Tab label="Bancos" {...a11yProps(5)} />
                    <Tab label="Tipos de Pagos" {...a11yProps(6)} />
                    <Tab label="Reglas de Costo Financiero" {...a11yProps(7)} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <AccountManagement />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <CashRegisterManagement />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <TransactionManagement />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <PaymentManagement />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <BankStatementManagement />
            </TabPanel>
            <TabPanel value={value} index={5}>
                <BankManagement />
            </TabPanel>
            <TabPanel value={value} index={6}>
                <PaymentMethodTypeManagement />
            </TabPanel>
            <TabPanel value={value} index={7}>
                <FinancialCostRuleManagement />
            </TabPanel>
        </Box>
    );
};

export default AccountingFinanceModule;
