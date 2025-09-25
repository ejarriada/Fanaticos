import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import EmployeeManagement from './EmployeeManagement';
import SalaryManagement from './SalaryManagement';
import VacationManagement from './VacationManagement';
import PermitManagement from './PermitManagement';
import MedicalRecordManagement from './MedicalRecordManagement';
import AbsencesManagement from './AbsencesManagement';

// Panel de Pestañas (TabPanel) para asociar contenido a cada pestaña
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`hr-tabpanel-${index}`}
            aria-labelledby={`hr-tab-${index}`}
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

const HumanResourcesModule = () => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Paper sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ p: 3, pb: 1 }}>Módulo de Recursos Humanos</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="Módulos de Recursos Humanos" variant="scrollable" scrollButtons="auto">
                    <Tab label="Empleados" id="hr-tab-0" />
                    <Tab label="Salarios" id="hr-tab-1" />
                    <Tab label="Vacaciones" id="hr-tab-2" />
                    <Tab label="Permisos" id="hr-tab-3" />
                    <Tab label="Carpetas Médicas" id="hr-tab-4" />
                    <Tab label="Ausencias" id="hr-tab-5" />
                </Tabs>
            </Box>
            <TabPanel value={currentTab} index={0}>
                <EmployeeManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
                <SalaryManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={2}>
                <VacationManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={3}>
                <PermitManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={4}>
                <MedicalRecordManagement />
            </TabPanel>
            <TabPanel value={currentTab} index={5}>
                <AbsencesManagement />
            </TabPanel>
        </Paper>
    );
};

export default HumanResourcesModule;