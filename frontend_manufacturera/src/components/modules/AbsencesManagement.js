import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AbsencesManagement = () => {
    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h5" gutterBottom>
                Gestión de Ausencias
            </Typography>
            <Box>
                <Typography variant="body1">
                    Aquí se gestionarán las ausencias de los empleados. El formulario y la lista de ausencias se implementarán en esta sección.
                </Typography>
                {/* TODO: Implementar formulario para registrar ausencias y lista de ausencias existentes. */}
            </Box>
        </Paper>
    );
};

export default AbsencesManagement;