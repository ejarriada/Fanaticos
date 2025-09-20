import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

// Import HR sub-modules
import EmployeeRoleManagement from './EmployeeRoleManagement';
import EmployeeManagement from './EmployeeManagement';
import SalaryManagement from './SalaryManagement';
import PermitManagement from './PermitManagement';
import VacationManagement from './VacationManagement';
import MedicalRecordManagement from './MedicalRecordManagement';

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

const HumanResourcesModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="HR tabs">
                    <Tab label="Roles de Empleado" {...a11yProps(0)} />
                    <Tab label="Empleados" {...a11yProps(1)} />
                    <Tab label="Salarios" {...a11yProps(2)} />
                    <Tab label="Permisos" {...a11yProps(3)} />
                    <Tab label="Vacaciones" {...a11yProps(4)} />
                    <Tab label="Historial Médico" {...a11yProps(5)} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <EmployeeRoleManagement />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <EmployeeManagement />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <SalaryManagement />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <PermitManagement />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <VacationManagement />
            </TabPanel>
            <TabPanel value={value} index={5}>
                <MedicalRecordManagement />
            </TabPanel>
        </Box>
    );
};

export default HumanResourcesModule;
