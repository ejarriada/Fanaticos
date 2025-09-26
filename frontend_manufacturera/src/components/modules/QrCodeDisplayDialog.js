import React from 'react';
import {
    Typography, Dialog, DialogActions,
    DialogContent, DialogTitle, Button
} from '@mui/material';

const QrCodeDisplayDialog = ({ open, onClose, qrCodeData, title }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title || 'Código QR'}</DialogTitle>
            <DialogContent>
                {qrCodeData ? (
                    <img src={`data:image/png;base64,${qrCodeData}`} alt="QR Code" style={{ width: '100%', height: 'auto' }} />
                ) : (
                    <Typography>No hay datos de QR disponibles.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QrCodeDisplayDialog;
