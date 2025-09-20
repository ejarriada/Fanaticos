import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

import RawMaterialList from './RawMaterialList';

import PedidosMateriales from './PedidosMateriales';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`materiasprimas-tabpanel-${index}`}
            aria-labelledby={`materiasprimas-tab-${index}`}
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

const MateriasPrimasModule = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="pestañas de materias primas">
                    <Tab label="Lista de Materias Primas" id="materiasprimas-tab-0" />
                    <Tab label="Pedidos de Materiales" id="materiasprimas-tab-1" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <RawMaterialList />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <PedidosMateriales />
            </TabPanel>
        </Box>
    );
};

export default MateriasPrimasModule;
