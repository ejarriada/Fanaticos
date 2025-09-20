import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import EmployeeManagement from './EmployeeManagement';

import SalaryManagement from './SalaryManagement';

import VacationManagement from './VacationManagement';

import MedicalRecordManagement from './MedicalRecordManagement';

import AbsencesManagement from './AbsencesManagement';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`rrhh-tabpanel-${index}`}
            aria-labelledby={`rrhh-tab-${index}`}
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

const RRHHModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Recursos Humanos</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de RRHH">
                    <Tab label="Gestión de Empleados" id="rrhh-tab-0" />
                    <Tab label="Gestión de Salarios" id="rrhh-tab-1" />
                    <Tab label="Vacaciones/Permisos" id="rrhh-tab-2" />
                    <Tab label="Carpetas Médicas" id="rrhh-tab-3" />
                    <Tab label="Ausentes" id="rrhh-tab-4" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <EmployeeManagement />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <SalaryManagement />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <VacationManagement />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <MedicalRecordManagement />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <AbsencesManagement />
            </TabPanel>
        </Box>
    );
};

export default RRHHModule;
