import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import * as api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PaymentRules = () => {
    const [rules, setRules] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { tenantId } = useAuth();
    const [selectedBankId, setSelectedBankId] = useState('all'); // 'all' for all banks

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            setLoading(true);
            setError(null);
            try {
                const [rulesData, banksData, paymentMethodTypesData] = await Promise.all([
                    api.list('/financial-cost-rules/'),
                    api.list('/banks/'),
                    api.list('/payment-method-types/')
                ]);

                const fetchedRules = Array.isArray(rulesData) ? rulesData : rulesData.results || [];
                const fetchedBanks = Array.isArray(banksData) ? banksData : banksData.results || [];
                const fetchedPaymentMethodTypes = Array.isArray(paymentMethodTypesData) ? paymentMethodTypesData : paymentMethodTypesData.results || [];

                setBanks(fetchedBanks);

                // Filter fetched rules based on selectedBankId
                const filteredFetchedRules = fetchedRules.filter(rule => {
                    if (selectedBankId === 'all') {
                        return rule.bank === null; // Only general rules
                    } else {
                        return rule.bank === selectedBankId; // Rules for specific bank
                    }
                });

                if (filteredFetchedRules.length === 0) {
                    // Generate default rules if none exist for the current selection
                    const defaultRules = [];
                    fetchedPaymentMethodTypes.forEach(pmt => {
                        if (pmt.name !== 'Efectivo') { // 'Efectivo' does not require a rule
                            // Generate rule only for the selected context
                            if (selectedBankId === 'all') {
                                defaultRules.push({
                                    payment_method: pmt.id,
                                    payment_method_name: pmt.name,
                                    bank: null,
                                    bank_name: 'General',
                                    percentage: 0,
                                });
                            } else { // Specific bank selected
                                defaultRules.push({
                                    payment_method: pmt.id,
                                    payment_method_name: pmt.name,
                                    bank: selectedBankId,
                                    bank_name: fetchedBanks.find(bank => bank.id === selectedBankId)?.name || 'Desconocido',
                                    percentage: 0,
                                });
                            }
                        }
                    });
                    setRules(defaultRules);
                } else {
                    // Map fetched rules to include payment_method_name and bank_name for display
                    const rulesWithNames = filteredFetchedRules.map(rule => ({
                        ...rule,
                        payment_method_name: fetchedPaymentMethodTypes.find(pmt => pmt.id === rule.payment_method)?.name || 'Desconocido',
                        bank_name: fetchedBanks.find(bank => bank.id === rule.bank)?.name || 'General',
                    }));
                    setRules(rulesWithNames);
                }
                setError(null);
            } catch (err) {
                setError('Error al cargar los datos.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId, selectedBankId]); // Add selectedBankId to dependencies

    const handleRuleChange = (index, field, value) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        setRules(newRules);
    };

    const addInstallment = (ruleIndex) => {
        const newRules = [...rules];
        // Ensure installments array exists
        if (!newRules[ruleIndex].installments) {
            newRules[ruleIndex].installments = [];
        }
        newRules[ruleIndex].installments.push({ count: '', percentage: '' });
        setRules(newRules);
    };

    const handleInstallmentChange = (ruleIndex, installmentIndex, field, value) => {
        const newRules = [...rules];
        newRules[ruleIndex].installments[installmentIndex][field] = value;
        setRules(newRules);
    };

    const removeInstallment = (ruleIndex, installmentIndex) => {
        const newRules = [...rules];
        newRules[ruleIndex].installments.splice(installmentIndex, 1);
        setRules(newRules);
    };

    const handleSaveRules = async () => {
        setLoading(true);
        setError(null);
        try {
            for (const rule of rules) {
                const dataToSend = {
                    payment_method: rule.payment_method,
                    bank: selectedBankId === 'all' ? null : selectedBankId, // Set bank based on main selector
                    percentage: rule.percentage,
                    // installments: rule.installments, // If applicable
                };

                if (rule.id) {
                    await api.update('/financial-cost-rules/', rule.id, dataToSend);
                } else {
                    await api.create('/financial-cost-rules/', dataToSend);
                }
            }
            alert("Reglas de pago guardadas!");
            // Re-fetch rules to ensure UI is up-to-date with backend
            const rulesData = await api.list('/financial-cost-rules/');
            setRules(Array.isArray(rulesData) ? rulesData : rulesData.results || []);
        } catch (err) {
            setError('Error al guardar las reglas de pago.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Reglas de Pago</Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Filtrar por Banco</InputLabel>
                <Select
                    value={selectedBankId}
                    label="Filtrar por Banco"
                    onChange={(e) => setSelectedBankId(e.target.value)}
                >
                    <MenuItem value="all">Todos los Bancos</MenuItem>
                    {banks.map((bank) => (
                        <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Paper sx={{ p: 3 }}>
                {rules
                    .filter(rule => rule.payment_method_name !== 'Efectivo')
                    .filter(rule => {
                        if (selectedBankId === 'all') {
                            return rule.bank === null; // Only show general rules when 'all' is selected
                        } else {
                            return rule.bank === selectedBankId; // Show rules for the selected bank
                        }
                    })
                    .map((rule, ruleIndex) => (
                    <Box key={rule.id || `${rule.payment_method}-${rule.bank}`} sx={{ mb: 4, border: '1px solid #eee', p: 2, borderRadius: '4px' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{rule.payment_method_name} ({rule.bank_name || 'General'})</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Porcentaje (%)"
                                    type="number"
                                    fullWidth
                                    value={rule.percentage}
                                    onChange={(e) => handleRuleChange(ruleIndex, 'percentage', e.target.value)}
                                />
                            </Grid>
                            
                            {(rule.payment_method_name === 'Tarjeta Crédito' || rule.payment_method_name === 'Cheque') && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Cuotas / Tipos</Typography>
                                    {rule.installments?.map((installment, instIndex) => (
                                        <Grid container spacing={1} key={instIndex} alignItems="center" sx={{ mb: 1 }}>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label={rule.payment_method_name === 'Tarjeta Crédito' ? "Cantidad de Cuotas" : "Tipo"}
                                                    fullWidth
                                                    value={installment.count}
                                                    onChange={(e) => handleInstallmentChange(ruleIndex, instIndex, 'count', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label="Porcentaje (%)"
                                                    type="number"
                                                    fullWidth
                                                    value={installment.percentage}
                                                    onChange={(e) => handleInstallmentChange(ruleIndex, instIndex, 'percentage', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <IconButton onClick={() => removeInstallment(ruleIndex, instIndex)}><DeleteIcon /></IconButton>
                                            </Grid>
                                        </Grid>
                                    ))}
                                    <Button startIcon={<AddIcon />} onClick={() => addInstallment(ruleIndex)} variant="outlined" size="small" sx={{ mt: 1 }}>
                                        Añadir Cuota / Tipo
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                ))}
                <Button variant="contained" onClick={handleSaveRules} sx={{ mt: 3 }}>Guardar Reglas</Button>
            </Paper>
        </Box>
    );
};

export default PaymentRules;
