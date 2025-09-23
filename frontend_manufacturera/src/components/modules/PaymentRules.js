import { Grid } from "@mui/material";
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const PaymentRules = () => {
    const [rules, setRules] = useState([
        { type: 'Efectivo', percentage: 0, fixed_amount: 0 },
        { type: 'Transferencia', percentage: 0, fixed_amount: 0 },
        { type: 'Tarjeta Débito', percentage: 0, fixed_amount: 0 },
        { type: 'Tarjeta Crédito', percentage: 0, fixed_amount: 0, bank: '', installments: [] },
        { type: 'Cheque', percentage: 0, fixed_amount: 0, cheque_type: '', installments: [] },
        { type: 'Múltiple', percentage: 0, fixed_amount: 0 },
    ]);

    const handleRuleChange = (index, field, value) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        setRules(newRules);
    };

    const addInstallment = (ruleIndex) => {
        const newRules = [...rules];
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

    const handleSaveRules = () => {
        console.log("Saving rules:", rules);
        // Implement API call to save rules
        alert("Reglas de pago guardadas!");
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Reglas de Pago</Typography>
            <Paper sx={{ p: 3 }}>
                {rules.map((rule, ruleIndex) => (
                    <Box key={rule.type} sx={{ mb: 4, border: '1px solid #eee', p: 2, borderRadius: '4px' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{rule.type}</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={6}>
                                <TextField
                                    label="Porcentaje (%)"
                                    type="number"
                                    fullWidth
                                    value={rule.percentage}
                                    onChange={(e) => handleRuleChange(ruleIndex, 'percentage', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Monto Fijo ($)"
                                    type="number"
                                    fullWidth
                                    value={rule.fixed_amount}
                                    onChange={(e) => handleRuleChange(ruleIndex, 'fixed_amount', e.target.value)}
                                />
                            </Grid>
                            
                            {(rule.type === 'Tarjeta Crédito' || rule.type === 'Cheque') && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Cuotas / Tipos</Typography>
                                    {rule.installments?.map((installment, instIndex) => (
                                        <Grid container spacing={1} key={instIndex} alignItems="center" sx={{ mb: 1 }}>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label={rule.type === 'Tarjeta Crédito' ? "Cantidad de Cuotas" : "Tipo"}
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
