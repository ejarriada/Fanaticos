import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Paper, Grid, TextField, Button, 
    Divider, Chip, Card, CardContent
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { normalizeChequeFromBackend } from '../../utils/chequeTransformers';

const FinancialSummary = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [chequesData, setChequeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { tenantId } = useAuth();

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Obtener cajas
            const cashRegisterData = await api.list('/cash-registers/');
            const cashRegisters = Array.isArray(cashRegisterData) 
                ? cashRegisterData 
                : cashRegisterData.results || [];
            
            const totalCashBalance = cashRegisters.reduce(
                (acc, register) => acc + parseFloat(register.balance || 0), 
                0
            );

            // 2. Obtener cheques
            const chequesResponse = await api.list('/checks/');
            
            let chequesList = [];
            if (Array.isArray(chequesResponse)) {
                chequesList = chequesResponse;
            } else if (chequesResponse?.results && Array.isArray(chequesResponse.results)) {
                chequesList = chequesResponse.results;
            } else if (chequesResponse?.data && Array.isArray(chequesResponse.data)) {
                chequesList = chequesResponse.data;
            }

            const normalizedChecks = chequesList.map(normalizeChequeFromBackend);

            // 3. Calcular saldos por estado
            const checksByStatus = {
                CARGADO: 0,
                ENTREGADO: 0,
                RECHAZADO: 0,
                COBRADO: 0,
                ANULADO: 0
            };

            normalizedChecks.forEach((check) => {
                const amount = parseFloat(check.amount || 0);
                const status = check.status || 'SIN_ESTADO';
                
                if (checksByStatus.hasOwnProperty(status)) {
                    checksByStatus[status] += amount;
                }
            });

            // 4. Calcular totales
            const totalThirdPartyAvailable = normalizedChecks
                .filter(c => c.status === 'CARGADO' && (!c.is_own || c.is_own === false))
                .reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);

            const totalOwnCheques = normalizedChecks
                .filter(c => c.is_own === true)
                .reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);

            // 5. Obtener transacciones del día
            const today = new Date(selectedDate);
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            
            let totalIncomeToday = 0;
            let totalExpenseToday = 0;

            try {
                const transactionsData = await api.list(
                    `/transactions/?created_at__gte=${startOfDay}&created_at__lte=${endOfDay}`
                );
                const transactions = Array.isArray(transactionsData) 
                    ? transactionsData 
                    : transactionsData.results || [];

                totalIncomeToday = transactions
                    .filter(t => t.type === 'INGRESO' || t.type === 'INCOME')
                    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

                totalExpenseToday = transactions
                    .filter(t => t.type === 'EGRESO' || t.type === 'EXPENSE')
                    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
            } catch (transError) {
                console.warn('⚠️ Error al cargar transacciones:', transError);
            }

            // 6. Consolidar datos
            const combinedData = {
                cash_balance: totalCashBalance,
                third_party_cheques_balance: totalThirdPartyAvailable,
                own_cheques_balance: totalOwnCheques,
                total_cheques: normalizedChecks.length,
                income_today: totalIncomeToday,
                expense_today: totalExpenseToday,
                net_today: totalIncomeToday - totalExpenseToday
            };

            setSummaryData(combinedData);
            setChequeData(checksByStatus);
            setDebugInfo(`${normalizedChecks.length} cheques`);
            setError(null);

        } catch (err) {
            console.error('❌ Error en fetchSummary:', err);
            setError(`Error al cargar el resumen financiero: ${err.message}`);
            setDebugInfo(`Error`);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
            {/* HEADER */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    Resumen Financiero
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Fecha"
                        type="date"
                        size="small"
                        value={selectedDate}
                        onChange={handleDateChange}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 180 }}
                    />
                    <Button variant="contained" onClick={fetchSummary} size="medium">
                        Actualizar
                    </Button>
                    {debugInfo && (
                        <Chip 
                            icon={<CheckCircleIcon />} 
                            label={debugInfo} 
                            color="success" 
                            size="small" 
                            variant="outlined"
                        />
                    )}
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {summaryData && (
                <>
                    {/* SECCIÓN 1: KPIs PRINCIPALES */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Card elevation={2} sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                                            Saldo en Cajas
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                                        {formatCurrency(summaryData.cash_balance)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card elevation={2} sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TrendingUpIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                                            Cobros del Día
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                                        {formatCurrency(summaryData.income_today)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card elevation={2} sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TrendingDownIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                                            Pagos del Día
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                                        {formatCurrency(summaryData.expense_today)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* SECCIÓN 2: ESTADOS DE CHEQUES */}
                    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <ReceiptIcon sx={{ fontSize: 32, color: '#1976d2', mr: 2 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                Cheques en Cartera
                            </Typography>
                            <Chip 
                                label={`${summaryData.total_cheques} cheques`} 
                                color="primary" 
                                size="small" 
                                sx={{ ml: 2 }}
                            />
                        </Box>
                        
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={4} md={2.4}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#fff3e0', 
                                    borderRadius: 2, 
                                    textAlign: 'center',
                                    border: '2px solid #ffe0b2',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                                }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        Cargado
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#e65100', fontWeight: 700, my: 1 }}>
                                        {formatCurrency(chequesData?.CARGADO || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Disponibles
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={6} sm={4} md={2.4}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#e8f5e9', 
                                    borderRadius: 2, 
                                    textAlign: 'center',
                                    border: '2px solid #c8e6c9',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                                }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        Entregado
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 700, my: 1 }}>
                                        {formatCurrency(chequesData?.ENTREGADO || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        En circulación
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={6} sm={4} md={2.4}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#e3f2fd', 
                                    borderRadius: 2, 
                                    textAlign: 'center',
                                    border: '2px solid #bbdefb',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                                }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        Cobrado
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#1565c0', fontWeight: 700, my: 1 }}>
                                        {formatCurrency(chequesData?.COBRADO || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Completados
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={6} sm={4} md={2.4}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#ffebee', 
                                    borderRadius: 2, 
                                    textAlign: 'center',
                                    border: '2px solid #ffcdd2',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                                }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        Rechazado
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#c62828', fontWeight: 700, my: 1 }}>
                                        {formatCurrency(chequesData?.RECHAZADO || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Sin fondos
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={6} sm={4} md={2.4}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: '#fafafa', 
                                    borderRadius: 2, 
                                    textAlign: 'center',
                                    border: '2px solid #e0e0e0',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                                }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        Anulado
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: '#616161', fontWeight: 700, my: 1 }}>
                                        {formatCurrency(chequesData?.ANULADO || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Cancelados
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* SECCIÓN 3: RESUMEN CHEQUES TERCEROS VS PROPIOS */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={3} sx={{ 
                                p: 4, 
                                height: '100%',
                                background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                                border: '3px solid #f39c12'
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#854d0e', mb: 2 }}>
                                    💰 Cheques de Terceros Disponibles
                                </Typography>
                                <Typography variant="h2" sx={{ color: '#854d0e', fontWeight: 800, mb: 1 }}>
                                    {formatCurrency(summaryData.third_party_cheques_balance)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#854d0e' }}>
                                    Cheques recibidos (no propios) en estado CARGADO
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper elevation={3} sx={{ 
                                p: 4, 
                                height: '100%',
                                background: 'linear-gradient(135deg, #a8e6cf 0%, #56ccf2 100%)',
                                border: '3px solid #00b894'
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0c5460', mb: 2 }}>
                                    📝 Cheques Propios
                                </Typography>
                                <Typography variant="h2" sx={{ color: '#0c5460', fontWeight: 800, mb: 1 }}>
                                    {formatCurrency(summaryData.own_cheques_balance)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#0c5460' }}>
                                    Cheques emitidos por nosotros (is_own = true)
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default FinancialSummary;