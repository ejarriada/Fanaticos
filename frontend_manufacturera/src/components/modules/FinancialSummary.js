import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Paper, Grid, TextField, Button
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const FinancialSummary = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [month, setMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
    const { tenantId } = useAuth();

    const fetchSummary = async () => {
        try {
            setLoading(true);
            // Assuming an API endpoint like /financial-summary/?month=YYYY-MM
            const data = await api.get(`/financial-summary/?month=${month}`);
            setSummaryData(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar el resumen financiero.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSummary();
        }
    }, [tenantId, month]);

    const handleMonthChange = (e) => {
        setMonth(e.target.value);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Resumen Financiero</Typography>

            <Box sx={{ mb: 3 }}>
                <TextField
                    label="Mes"
                    type="month"
                    value={month}
                    onChange={handleMonthChange}
                    InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" onClick={fetchSummary} sx={{ ml: 2 }}>Cargar Mes</Button>
            </Box>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {summaryData && !loading && !error && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">Cajas:</Typography>
                            <Typography variant="body1">${summaryData.cash_balance?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">Cheques de Terceros Disponibles:</Typography>
                            <Typography variant="body1">${summaryData.third_party_cheques_balance?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">Clientes:</Typography>
                            <Typography variant="body1">${summaryData.client_debt?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">Proveedores:</Typography>
                            <Typography variant="body1">${summaryData.supplier_debt?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">Cheques Propios:</Typography>
                            <Typography variant="body1">${summaryData.own_cheques_balance?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1">Resultado:</Typography>
                            <Typography variant="body1">${summaryData.net_result?.toFixed(2) || '0.00'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default FinancialSummary;
