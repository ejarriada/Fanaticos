import React from 'react';
import { Box, Typography } from '@mui/material';
import QuotationManagement from './QuotationManagement'; // Assuming this will be the refactored component

const CotizacionModule = () => {
    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Cotizaciones</Typography>
            <QuotationManagement />
        </Box>
    );
};

export default CotizacionModule;
