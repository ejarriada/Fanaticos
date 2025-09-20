import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button
} from '@mui/material';
import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ExpenseSummary = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [month, setMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
    const { tenantId } = useAuth();

    const fetchSummary = async () => {
        try {
            setLoading(true);
            // Assuming an API endpoint like /expense-summary/?month=YYYY-MM
            const data = await api.get(`/expense-summary/?month=${month}`);
            setSummaryData(data.expenses_by_type || []);
            setTotalExpenses(data.total_expenses || 0);
            setError(null);
        } catch (err) {
            setError('Error al cargar el resumen de gastos.');
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
            <Typography variant="h5" gutterBottom>Resumen de Gastos</Typography>

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

            {summaryData.length > 0 && !loading && !error && (
                <Paper sx={{ p: 3 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Monto</TableCell>
                                    <TableCell>%</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {summaryData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.type}</TableCell>
                                        <TableCell>${item.amount.toFixed(2)}</TableCell>
                                        <TableCell>{item.percentage.toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>${totalExpenses.toFixed(2)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* TODO: Add a chart here */}
                </Paper>
            )}
        </Box>
    );
};

export default ExpenseSummary;
