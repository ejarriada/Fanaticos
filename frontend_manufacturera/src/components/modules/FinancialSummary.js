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
            
            // Perform multiple API calls in parallel
            const [balanceData, profitLossData, revenueExpensesData] = await Promise.all([
                api.list(`/management/current-balance/?month=${month}`),
                api.list(`/management/overall-profit-loss/?month=${month}`),
                api.list(`/management/revenue-expenses/?month=${month}`)
            ]);

            // Combine the results into a single summary object
            const combinedData = {
                cash_balance: balanceData.cash_register_balances?.reduce((acc, cur) => acc + cur.balance, 0),
                client_debt: balanceData.account_balances?.find(acc => acc.account__name === 'Cuentas por Cobrar')?.balance || 0,
                supplier_debt: balanceData.account_balances?.find(acc => acc.account__name === 'Cuentas por Pagar')?.balance || 0,
                overall_profit_loss: profitLossData.overall_profit_loss,
                total_revenue: revenueExpensesData.total_revenue,
                total_expenses: revenueExpensesData.total_expenses,
                // These might need their own endpoints or be derived differently
                third_party_cheques_balance: 0, 
                own_cheques_balance: 0,
                net_result: profitLossData.overall_profit_loss, // Or calculate from revenue/expenses
            };

            setSummaryData(combinedData);
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
