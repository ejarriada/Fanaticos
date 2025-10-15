import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Paper, Grid, TextField, Button, Divider
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { normalizeChequeFromBackend } from '../../utils/chequeTransformers'; // Importar normalizador

const FinancialSummary = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [chequesData, setChequeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const { tenantId } = useAuth();

    const fetchSummary = async () => {
        try {
            setLoading(true);
            
            const cashRegisterData = await api.list('/cash-registers/');
            const totalCashBalance = Array.isArray(cashRegisterData) 
                ? cashRegisterData.reduce((acc, register) => acc + parseFloat(register.balance || 0), 0)
                : 0;

            const chequesResponse = await api.list('/checks/');
            const chequesList = Array.isArray(chequesResponse.results) ? chequesResponse.results : [];
            const normalizedChecks = chequesList.map(normalizeChequeFromBackend);

            const checksByStatus = normalizedChecks.reduce((acc, check) => {
                const status = check.status || 'SIN ESTADO';
                acc[status] = (acc[status] || 0) + parseFloat(check.amount);
                return acc;
            }, {});

            const totalThirdPartyAvailable = normalizedChecks
                .filter(c => !c.is_own && c.status === 'CARGADO')
                .reduce((acc, c) => acc + parseFloat(c.amount), 0);

            const totalOwnCheques = normalizedChecks
                .filter(c => c.is_own)
                .reduce((acc, c) => acc + parseFloat(c.amount), 0);

            const today = new Date(selectedDate);
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            
            const transactionsData = await api.list(
                `/transactions/?created_at__gte=${startOfDay}&created_at__lte=${endOfDay}`
            );
            const transactions = Array.isArray(transactionsData.results) ? transactionsData.results : [];

            const totalIncomeToday = transactions
                .filter(t => t.type === 'INGRESO')
                .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

            const totalExpenseToday = transactions
                .filter(t => t.type === 'EGRESO')
                .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

            const combinedData = {
                cash_balance: totalCashBalance,
                third_party_cheques_balance: totalThirdPartyAvailable,
                own_cheques_balance: totalOwnCheques,
                total_cheques: chequesList.length,
                income_today: totalIncomeToday,
                expense_today: totalExpenseToday,
                net_today: totalIncomeToday - totalExpenseToday
            };

            setSummaryData(combinedData);
            setChequeData(checksByStatus);
            setError(null);
        } catch (err) {
            setError('Error al cargar el resumen financiero.');
            console.error('Error en fetchSummary:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSummary();
        }
    }, [tenantId, selectedDate]);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Resumen Financiero del Día
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    label="Fecha"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 200 }}
                />
                <Button variant="contained" onClick={fetchSummary}>
                    Actualizar
                </Button>
            </Box>

            {loading && <CircularProgress />}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {summaryData && !loading && (
                <Grid container spacing={3}>
                    {/* SECCIÓN 1: SALDO EN CAJAS */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%', bgcolor: '#e3f2fd' }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Saldo Total en Cajas
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                ${summaryData.cash_balance?.toFixed(2) || '0.00'}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* SECCIÓN 2: MOVIMIENTOS DEL DÍA */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Movimientos del Día
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="success.main">Cobros del día</Typography>
                                <Typography color="success.main" fontWeight="bold">
                                    ${summaryData.income_today?.toFixed(2) || '0.00'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="error.main">Pagos del día</Typography>
                                <Typography color="error.main" fontWeight="bold">
                                    ${summaryData.expense_today?.toFixed(2) || '0.00'}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* SECCIÓN 3: CHEQUES EN CARTERA POR ESTADO */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Cheques en Cartera por Estado
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            {chequesData && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Cargado (Disponibles)
                                            </Typography>
                                            <Typography variant="h5" color="warning.main">
                                                ${chequesData.CARGADO?.toFixed(2) || '0.00'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Entregados
                                            </Typography>
                                            <Typography variant="h5" color="success.main">
                                                ${chequesData.ENTREGADO?.toFixed(2) || '0.00'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Cobrados
                                            </Typography>
                                            <Typography variant="h5" color="primary.main">
                                                ${chequesData.COBRADO?.toFixed(2) || '0.00'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Rechazados
                                            </Typography>
                                            <Typography variant="h5" color="error.main">
                                                ${chequesData.RECHAZADO?.toFixed(2) || '0.00'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Anulados
                                            </Typography>
                                            <Typography variant="h5" color="text.secondary">
                                                ${chequesData.ANULADO?.toFixed(2) || '0.00'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Total Cheques
                                            </Typography>
                                            <Typography variant="h5" color="secondary.main">
                                                {summaryData.total_cheques || 0} cheques
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                        </Paper>
                    </Grid>

                    {/* SECCIÓN 4: RESUMEN DE CHEQUES */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%', bgcolor: '#fff3e0' }}>
                            <Typography variant="h6" gutterBottom color="warning.main">
                                Cheques de Terceros Disponibles
                            </Typography>
                            <Typography variant="h4" color="warning.dark">
                                ${summaryData.third_party_cheques_balance?.toFixed(2) || '0.00'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Cheques recibidos y disponibles para uso
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%', bgcolor: '#e8f5e9' }}>
                            <Typography variant="h6" gutterBottom color="success.main">
                                Cheques Propios Entregados
                            </Typography>
                            <Typography variant="h4" color="success.dark">
                                ${summaryData.own_cheques_balance?.toFixed(2) || '0.00'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Cheques emitidos por nosotros y entregados
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default FinancialSummary;