import React from 'react';
import { Box, Typography } from '@mui/material';
import OrderNoteManagement from './OrderNoteManagement';

const NotaPedidoModule = () => {
    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Gestión de Notas de Pedido</Typography>
            <OrderNoteManagement />
        </Box>
    );
};

export default NotaPedidoModule;
